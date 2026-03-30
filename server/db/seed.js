import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    `postgresql://${process.env.PGUSER || "postgres"}:${process.env.PGPASSWORD || ""}@${process.env.PGHOST || "localhost"}:${process.env.PGPORT || "5432"}/${process.env.PGDATABASE || "takeshis_castle"}`,
});

const sampleItems = [
  {
    name: "Motorized Spaghetti Fork",
    description: "Battery-powered twirling fork; may launch pasta at Mach 2.",
    weirdness_level: 8,
  },
  {
    name: "Inflatable Dartboard",
    description: "Soft targets that bounce darts back at the thrower with spite.",
    weirdness_level: 7,
  },
  {
    name: "Dehydrated Water",
    description: "Just add water to rehydrate your water. Infinite recursion warning.",
    weirdness_level: 9,
  },
  {
    name: "Reverse Umbrella",
    description: "Collects rain into a funnel aimed at your shoes.",
    weirdness_level: 6,
  },
  {
    name: "Bluetooth Rock",
    description: "Pairs with nothing. Looks judgmental on your desk.",
    weirdness_level: 5,
  },
  {
    name: "Self-Doubt Compass",
    description: "Always points toward your biggest regret.",
    weirdness_level: 8,
  },
  {
    name: "Inflatable Anchor",
    description: "For when you need to float away but stay committed.",
    weirdness_level: 7,
  },
  {
    name: "Silent Alarm Clock",
    description: "Wakes only your neighbors via telepathy (untested).",
    weirdness_level: 6,
  },
  {
    name: "Left-Handed Screwdriver",
    description: "Threads tighten on the wrong axis on purpose.",
    weirdness_level: 7,
  },
  {
    name: "Portable Black Hole (Mini)",
    description: "Snack-sized singularity; keep away from receipts.",
    weirdness_level: 10,
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM inventory_items");
    for (const item of sampleItems) {
      await client.query(
        `INSERT INTO inventory_items (name, description, weirdness_level)
         VALUES ($1, $2, $3)`,
        [item.name, item.description, item.weirdness_level]
      );
    }
    await client.query("COMMIT");
    console.log(`Seeded ${sampleItems.length} inventory_items.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
