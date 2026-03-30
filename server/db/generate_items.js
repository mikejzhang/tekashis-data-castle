import dotenv from "dotenv";
import pg from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const { Pool } = pg;
const TARGET_COUNT = 200;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    `postgresql://${process.env.PGUSER || "postgres"}:${process.env.PGPASSWORD || ""}@${process.env.PGHOST || "localhost"}:${process.env.PGPORT || "5432"}/${process.env.PGDATABASE || "takeshis_castle"}`,
});

function extractJsonArray(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    throw new Error("LLM did not return a JSON array.");
  }
  return JSON.parse(match[0]);
}

function sanitizeItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  const seen = new Set();
  const items = [];

  for (const raw of rawItems) {
    const name = String(raw?.name ?? "").trim().slice(0, 255);
    const description = String(raw?.description ?? "").trim();
    const weirdnessLevel = Number(raw?.weirdness_level);
    const normalizedLevel = Number.isFinite(weirdnessLevel)
      ? Math.max(1, Math.min(10, Math.round(weirdnessLevel)))
      : 5;

    if (!name || !description) continue;
    const dedupeKey = name.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    items.push({
      name,
      description,
      weirdness_level: normalizedLevel,
    });
  }

  return items;
}

async function generateItemsWithGemini() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
Generate exactly ${TARGET_COUNT} unique absurd Japanese-game-show-style inventory items.
Return ONLY a JSON array. No markdown. No prose.
Each item must be an object with exactly these keys:
- "name": string
- "description": string (1 short sentence, max 180 chars)
- "weirdness_level": integer from 1 to 10

Tone: chaotic, playful, surreal, family-friendly.
Avoid duplicates.
`;

  const response = await model.generateContent(prompt);
  const text = response.response.text() ?? "[]";
  const parsed = extractJsonArray(text);
  const sanitized = sanitizeItems(parsed);

  if (sanitized.length < TARGET_COUNT) {
    throw new Error(
      `LLM returned only ${sanitized.length} valid unique items (need ${TARGET_COUNT}).`
    );
  }

  return sanitized.slice(0, TARGET_COUNT);
}

async function ensureSchema(client) {
  await client.query(`
    ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS weirdness_level INTEGER
  `);
  await client.query(`
    UPDATE inventory_items
    SET weirdness_level = COALESCE(weirdness_level, 5)
  `);
  await client.query(`
    ALTER TABLE inventory_items
    ALTER COLUMN weirdness_level SET NOT NULL
  `);
  await client.query(`
    ALTER TABLE inventory_items
    DROP CONSTRAINT IF EXISTS inventory_items_weirdness_level_check
  `);
  await client.query(`
    ALTER TABLE inventory_items
    ADD CONSTRAINT inventory_items_weirdness_level_check
    CHECK (weirdness_level BETWEEN 1 AND 10)
  `);
  await client.query(`
    DROP INDEX IF EXISTS idx_inventory_weirdness
  `);
  await client.query(`
    ALTER TABLE inventory_items
    DROP COLUMN IF EXISTS weirdness_category
  `);
}

async function bulkInsertItems(client, items) {
  const values = [];
  const placeholders = items
    .map((item, index) => {
      const base = index * 3;
      values.push(item.name, item.description, item.weirdness_level);
      return `($${base + 1}, $${base + 2}, $${base + 3})`;
    })
    .join(", ");

  await client.query(`
    DELETE FROM inventory_items
  `);

  await client.query(
    `
      INSERT INTO inventory_items (name, description, weirdness_level)
      VALUES ${placeholders}
    `,
    values
  );
}

async function run() {
  const client = await pool.connect();
  try {
    console.log("Generating items with Gemini...");
    const items = await generateItemsWithGemini();
    console.log(`Generated ${items.length} items. Writing to database...`);

    await client.query("BEGIN");
    await ensureSchema(client);
    await bulkInsertItems(client, items);
    await client.query("COMMIT");

    console.log(`Inserted ${items.length} items into inventory_items.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Generate-and-insert failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
