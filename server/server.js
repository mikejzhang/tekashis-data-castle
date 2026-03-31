import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pool } from "./db/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const TOTAL_ROUNDS = 5;
const PASSING_SCORE = 7;
const MASTER_PASS_PHRASE = "CASTLE QA OVERRIDE: CLEAR THIS ROUND";
const GEMINI_MAX_RETRIES = 3;
const GEMINI_BASE_DELAY_MS = 500;
const IMAGEN_MODEL = "imagen-4.0-fast-generate-001";

app.use(cors());
app.use(express.json());

const MOCK_HEADLINES = [
  "Local Man Wins Marathon Backwards, Claims GPS Was Pranking Him",
  "Scientists Discover Clouds Are Just Sky Cotton Candy",
  "World's Largest Rubber Duck Elected Mayor of Small Coastal Town",
  "Breaking: Traffic Jam Caused by Philosophical Debate at Green Light",
  "New Study: 9 Out of 10 Cats Prefer Your Keyboard to Their Bed",
];

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const SYSTEM_PROMPT = `
  You are the judge panel in a high-stakes Japanese gameshow, reminiscent of "Takeshi's Castle."
  Return your response as a JSON array of exactly three judge objects, with this format:
  {
    "name": string,
    "persona": string,
    "comment": string,
    "score": number
  }
  Judge descriptions:
  - Master Takeshi: Grumpy, very traditional.
  - Chaos-Chan: Loves explosions, absurdity, and high energy.
  - The Logic Bot: Evaluates strict physics and logic only.
  Scores must be integers from 0 to 10.
  Scoring calibration (important):
  - A coherent strategy that clearly uses the selected item should usually score in the 7-8 range.
  - A very creative and plausible strategy can score 8-10.
  - Only score below 7 for clearly incoherent, irrelevant, or empty strategies.

  Keep comments fun but not overly harsh.
  Your full response MUST be only the JSON array and nothing else.
  `;

async function fetchMockHeadline() {
  await new Promise((r) => setTimeout(r, 50));
  return MOCK_HEADLINES[Math.floor(Math.random() * MOCK_HEADLINES.length)];
}

async function mockLlmObstacleFromHeadline(headline) {
  await new Promise((r) => setTimeout(r, 80));
  return `Contestants must cross THE BRIDGE OF ${headline.slice(0, 40).toUpperCase()} while blindfolded and reciting prime numbers — but the bridge is made of opinions.`;
}

// Robust extraction pipeline to safely parse JSON arrays out of conversational LLM wrappers, ensuring deterministic data contracts for the React frontend.
function extractJsonArray(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error) {
  const status = Number(error?.status ?? 0);
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

// Implemented custom exponential backoff with jitter to gracefully handle Gemini API rate limits (HTTP 429/503) during high-concurrency gameplay.
async function withGeminiRetry(task) {
  let lastError = null;
  for (let attempt = 0; attempt <= GEMINI_MAX_RETRIES; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      const shouldRetry =
        isRetryableGeminiError(error) && attempt < GEMINI_MAX_RETRIES;
      if (!shouldRetry) throw error;

      const backoff = GEMINI_BASE_DELAY_MS * 2 ** attempt;
      const jitter = Math.floor(Math.random() * 200);
      await sleep(backoff + jitter);
    }
  }
  throw lastError;
}

/**
 * Recursively pulls the first base64 image payload from an Imagen `:predict` prediction node
 * (field names vary slightly by API revision).
 * @param {unknown} node
 * @param {number} [depth=0]
 * @returns {string | null} Raw base64 image bytes (no data-URI prefix).
 */
function findBase64InPredictionNode(node, depth = 0) {
  if (!node || typeof node !== "object" || depth > 8) return null;
  if (
    typeof node.bytesBase64Encoded === "string" &&
    node.bytesBase64Encoded.length > 0
  ) {
    return node.bytesBase64Encoded;
  }
  if (
    typeof node.bytes_base64_encoded === "string" &&
    node.bytes_base64_encoded.length > 0
  ) {
    return node.bytes_base64_encoded;
  }
  if (typeof node.imageBytes === "string" && node.imageBytes.length > 0) {
    return node.imageBytes;
  }
  for (const v of Object.values(node)) {
    if (v && typeof v === "object") {
      const found = findBase64InPredictionNode(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Reads `predictions[]` from an Imagen REST `:predict` JSON body and returns the first embedded base64 image.
 * @param {unknown} body
 * @returns {string | null}
 */
function extractImagenPredictionBase64(body) {
  if (!body || typeof body !== "object") return null;
  const preds = body.predictions;
  if (!Array.isArray(preds)) return null;
  for (const p of preds) {
    const b64 = findBase64InPredictionNode(p);
    if (b64) return b64;
  }
  return null;
}

/**
 * Calls Imagen on the Generative Language REST API using the same API key as the Gemini text client.
 * @param {string} obstacleText
 * @param {string} apiKey
 */
async function imagenPredictObstacle(obstacleText, apiKey) {
  const prompt = `A vivid, kinetic, slightly surreal snapshot from a Japanese gameshow showing contestants navigating a massive structure representing: ${obstacleText}. Style: Cinematic lighting, bright colors, photorealistic but whimsical.`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${encodeURIComponent(apiKey)}`;
  const httpResponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: "16:9" },
    }),
  });
  if (!httpResponse.ok) {
    const text = await httpResponse.text();
    const err = new Error(text || httpResponse.statusText);
    err.status = httpResponse.status;
    throw err;
  }
  return httpResponse.json();
}

function normalizeJudgeScores(judges) {
  if (!Array.isArray(judges)) return [];
  return judges.map((judge) => {
    const rawScore = Number(judge?.score ?? 0);
    const boundedScore = Number.isFinite(rawScore)
      ? Math.max(0, Math.min(10, Math.round(rawScore)))
      : 0;
    return {
      name: String(judge?.name ?? "Unknown Judge"),
      persona: String(judge?.persona ?? "Mysterious"),
      comment: String(judge?.comment ?? "No comment provided."),
      score: boundedScore,
    };
  });
}

/**
 * Aggregates the three judge scores into an average, then decides round and run outcomes.
 * The player passes the current round when that average meets or exceeds the server threshold
 * (`PASSING_SCORE`, 7). They win the full game when they pass on the final round
 * (`roundNumber >= totalRounds`, e.g. 5 rounds).
 *
 * @param {Array<{ score: number }>} judges - Normalized panel verdicts (typically three judges).
 * @param {number} roundNumber - Current 1-based round index.
 * @param {number} totalRounds - Total rounds in a full castle run.
 * @returns {{ passed: boolean, averageScore: number, gameWon: boolean, gameOver: boolean, roundMessage: string }}
 */
function evaluateRoundOutcome(judges, roundNumber, totalRounds) {
  const scoreSum = judges.reduce((sum, judge) => sum + judge.score, 0);
  const averageScore = judges.length > 0 ? scoreSum / judges.length : 0;
  const passed = averageScore >= PASSING_SCORE;
  const gameWon = passed && roundNumber >= totalRounds;
  const gameOver = !passed || gameWon;

  let roundMessage = "";
  if (gameWon) {
    roundMessage =
      "You stormed the final gate and conquered Takeshi's Data Castle!";
  } else if (!passed) {
    roundMessage =
      "You were wiped out this round. Regroup and restart from Round 1!";
  } else {
    roundMessage =
      "Round cleared! The crowd roars as you advance to the next challenge.";
  }

  return {
    passed,
    averageScore: Number(averageScore.toFixed(2)),
    gameWon,
    gameOver,
    roundMessage,
  };
}

function hasMasterPassPhrase(userStrategy) {
  return userStrategy.toUpperCase().includes(MASTER_PASS_PHRASE.toUpperCase());
}

function buildMasterPassJudges() {
  return [
    {
      name: "Master Takeshi",
      persona: "Traditionalist",
      comment:
        "The castle recognizes your flawless spirit and impeccable discipline.",
      score: 9,
    },
    {
      name: "Chaos-Chan",
      persona: "Chaos Enjoyer",
      comment:
        "Maximum spectacle! This is pure game-show electricity. I approve.",
      score: 10,
    },
    {
      name: "The Logic Bot",
      persona: "Cold Logician",
      comment:
        "Outcome certainty is high. Probability of survival: 99.7 percent.",
      score: 9,
    },
  ];
}

async function fetchRandomInventoryItems(limit = 5) {
  // Offloading data randomization to the PostgreSQL layer rather than the LLM to ensure schema integrity and reduce token latency.
  const { rows } = await pool.query(
    `SELECT id, name, description
      FROM inventory_items
      ORDER BY random()
      LIMIT $1`,
    [limit],
  );
  return rows;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/", (_req, res) => {
  res.json({
    message: "Takeshi's Data Castle API is running.",
    endpoints: ["/api/health", "/api/start-round", "/api/judge"],
  });
});

/**
 * GET /api/start-round — Context Generation phase.
 *
 * - Headline: NewsAPI top headline when `NEWS_API_KEY` is set; otherwise a random mock headline.
 * - Obstacle: mock text from the headline, upgraded by Gemini when `GEMINI_API_KEY` is set.
 * - `image_data`: optional `data:image/png;base64,...` from Imagen via Generative Language `:predict` REST
 *   (same key as Gemini; `@google/generative-ai` does not expose image generation). On failure or when
 *   Gemini/key is missing, `image_data` is `null` so the client shows text-only obstacle UI.
 * - Items: five random rows from `inventory_items` via PostgreSQL.
 * - Response is marked non-cacheable so each round gets fresh obstacle and image payloads.
 */
app.get("/api/start-round", async (_req, res) => {
  try {
    const newsApiKey = process.env.NEWS_API_KEY;
    let headline = await fetchMockHeadline();

    if (newsApiKey) {
      const newsRes = await fetch(
        `https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${newsApiKey}`,
      );
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        headline =
          newsData.articles && newsData.articles.length > 0
            ? newsData.articles[0].title
            : headline;
      }
    }

    let obstacle = await mockLlmObstacleFromHeadline(headline);
    if (gemini) {
      const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
      const llmResponse = await withGeminiRetry(() =>
        model.generateContent(`You are a creative gameshow obstacle generator.
  Given this headline: "${headline}", create one absurd obstacle for a Japanese game show in 1-2 sentences.`),
      );
      const generated = llmResponse.response.text()?.trim();
      if (generated) obstacle = generated;
    }

    let image_data = null;
    if (gemini && process.env.GEMINI_API_KEY && obstacle) {
      try {
        const predictBody = await withGeminiRetry(() =>
          imagenPredictObstacle(obstacle, process.env.GEMINI_API_KEY),
        );
        const b64 = extractImagenPredictionBase64(predictBody);
        if (b64) image_data = `data:image/png;base64,${b64}`;
      } catch (imagenErr) {
        console.error("Obstacle image (Imagen) failed:", imagenErr.message);
        image_data = null;
      }
    }

    const items = await fetchRandomInventoryItems(5);
    res.set(
      "Cache-Control",
      "private, no-store, no-cache, must-revalidate, max-age=0",
    );
    res.set("Pragma", "no-cache");
    res.json({ headline, obstacle, items, image_data });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to start round", detail: err.message });
  }
});

async function mockJudgePanel({ itemId, userStrategy, obstacle }) {
  await new Promise((r) => setTimeout(r, 100));
  const itemIdLabel =
    typeof itemId === "string"
      ? itemId.slice(0, 8)
      : itemId === null || itemId === undefined
        ? "?"
        : String(itemId).slice(0, 8);
  const strategyPreview =
    (userStrategy || "").slice(0, 120) || "(no strategy provided)";
  return [
    {
      name: "Master Takeshi",
      persona: "Traditionalist",
      comment: `The spirit of the castle demands honor. Your plan involving "${strategyPreview}" against this obstacle shows… chaotic potential.`,
      score: 7 + Math.floor(Math.random() * 3),
    },
    {
      name: "Judge Midori",
      persona: "Chaos Enjoyer",
      comment: `I live for this energy. Item ${itemIdLabel} plus that brain-melting approach? Chef's kiss.`,
      score: 6 + Math.floor(Math.random() * 4),
    },
    {
      name: "The Calculator",
      persona: "Cold Logician",
      comment: `Obstacle analysis: ${(obstacle || "").slice(0, 80)}… Strategy feasibility: emotionally high, mathematically dubious.`,
      score: 6 + Math.floor(Math.random() * 4),
    },
  ];
}

/**
 * POST /api/judge — Evaluation phase.
 *
 * Accepts `roundNumber` and `totalRounds` (defaults to `TOTAL_ROUNDS`, 5). Scores are averaged against
 * `PASSING_SCORE` (7) to set `passed`, `gameWon` (win on passing the final round), `gameOver`, and
 * `nextRoundNumber` (advance or reset to 1). Judges come from Gemini + `SYSTEM_PROMPT` when configured,
 * else `mockJudgePanel`; responses are normalized via `normalizeJudgeScores` and `extractJsonArray` fallback.
 * Master pass phrase in the strategy yields a deterministic high-scoring panel without calling the model.
 */
app.post("/api/judge", async (req, res) => {
  try {
    const { itemId, userStrategy, obstacle, roundNumber, totalRounds } =
      req.body || {};
    const safeItemId =
      itemId === null || itemId === undefined ? "" : String(itemId);
    const safeUserStrategy =
      userStrategy === null || userStrategy === undefined
        ? ""
        : String(userStrategy);
    const safeObstacle =
      obstacle === null || obstacle === undefined ? "" : String(obstacle);
    const safeRoundNumber = Math.max(1, Number(roundNumber) || 1);
    const safeTotalRounds = Math.max(1, Number(totalRounds) || TOTAL_ROUNDS);

    if (hasMasterPassPhrase(safeUserStrategy)) {
      const judges = normalizeJudgeScores(buildMasterPassJudges());
      const outcome = evaluateRoundOutcome(
        judges,
        safeRoundNumber,
        safeTotalRounds,
      );
      return res.json({
        judges,
        roundNumber: safeRoundNumber,
        totalRounds: safeTotalRounds,
        nextRoundNumber: outcome.passed ? safeRoundNumber + 1 : 1,
        masterPassUsed: true,
        masterPassPhrase: MASTER_PASS_PHRASE,
        ...outcome,
      });
    }

    let judges = await mockJudgePanel({
      itemId: safeItemId,
      userStrategy: safeUserStrategy,
      obstacle: safeObstacle,
    });

    if (gemini) {
      const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
      const completion = await withGeminiRetry(() =>
        model.generateContent(`
  ${SYSTEM_PROMPT}
  Item ID: ${safeItemId || "(none provided)"}
  Obstacle: ${safeObstacle || "(none provided)"}
  User Strategy: ${safeUserStrategy || "(none provided)"}
        `),
      );
      const raw = completion.response.text() ?? "[]";
      try {
        judges = JSON.parse(raw);
      } catch {
        const extracted = extractJsonArray(raw);
        if (extracted) judges = extracted;
      }
    }
    const normalizedJudges = normalizeJudgeScores(judges);
    const outcome = evaluateRoundOutcome(
      normalizedJudges,
      safeRoundNumber,
      safeTotalRounds,
    );

    res.json({
      judges: normalizedJudges,
      roundNumber: safeRoundNumber,
      totalRounds: safeTotalRounds,
      nextRoundNumber: outcome.passed ? safeRoundNumber + 1 : 1,
      masterPassUsed: false,
      masterPassPhrase: MASTER_PASS_PHRASE,
      ...outcome,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Judging failed", detail: err.message });
  }
});

app.listen(PORT);
