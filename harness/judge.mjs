// ============================================================================
// judge.mjs — rubric-guided judge for the Strategic Judgment Leaderboard.
//
// Reads harness/results.json (from run.mjs), scores each response 0-100 across
// the case's rubric dimensions, flags hindsight/contamination tells, aggregates
// to per-(model,case) and overall, and writes scores.json at the repo root
// (next to index.html) — the file the leaderboard fetches at runtime.
//
//   node harness/judge.mjs            real run; an Anthropic model judges; needs ANTHROPIC_API_KEY
//   node harness/judge.mjs --dry-run  deterministic heuristic judge, no key/network
//
// Real runs use claude-opus-4-8 as the judge, with the rubric+gold-key engine
// prompt cached (cache_control) so all responses for one case reuse the prefix.
// --dry-run uses a transparent heuristic so the pipeline is testable offline.
//
// IMPORTANT: the numbers this produces are NOT publishable as-is. A real,
// citable leaderboard requires BOTH a live run with the API key AND Jordan's
// expert historical review of every gold key. scores.json records which of
// those happened in `provenance`; index.html keys its disclosure label off it.
// ============================================================================

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cases, contaminationTells } from "./cases.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_PATH = join(__dirname, "results.json");
const SCORES_PATH = join(__dirname, "..", "scores.json");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const JUDGE_MODEL = "claude-opus-4-8";

const caseById = Object.fromEntries(cases.map((c) => [c.id, c]));

// ---------------------------------------------------------------------------
// Hindsight/contamination detection — shared by both judges. Returns the list
// of tell phrases that appear in the response (case-insensitive).
function detectTells(caseId, text) {
  const lc = text.toLowerCase();
  return (contaminationTells[caseId] || []).filter((tell) => lc.includes(tell.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Deterministic heuristic judge (--dry-run). Scores each rubric dimension by
// lexical overlap between the response and that dimension's gold-key bullet,
// then applies an epistemic penalty for any contamination tells. Fully
// reproducible; no network. This is a stand-in for the model judge, not a
// serious grader — its only job is to make the offline pipeline runnable.
const STOPWORDS = new Set(
  "the a an and or of to in on for with without it its is are be as that this not no by from at into than vs over under up its his her their our your you we i over also both each both more most less least one two three first last".split(/\s+/),
);
function tokens(s) {
  return (s.toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => !STOPWORDS.has(w));
}
function overlap(aText, bText) {
  const a = new Set(tokens(aText));
  const b = tokens(bText);
  if (b.length === 0) return 0;
  let hit = 0;
  for (const w of b) if (a.has(w)) hit++;
  return hit / b.length; // 0..1
}

function heuristicScore(c, text) {
  const dims = c.rubric.map((dim, i) => {
    const goldBullet = c.goldKey[i] || c.goldKey[c.goldKey.length - 1];
    // Map lexical overlap (0..~0.4 in practice) onto a plausible 0.45..1.0
    // fraction of the dimension's point value.
    const ov = overlap(text, goldBullet);
    const frac = Math.min(1, 0.45 + ov * 1.6);
    const score = Math.round(dim.pts * frac);
    return { dimension: dim.dimension, max: dim.pts, score };
  });
  const tells = detectTells(c.id, text);
  // Epistemic penalty: each tell docks points, concentrated on the epistemic
  // dimension (the last rubric row) but capped so a score stays >= 0.
  let total = dims.reduce((s, d) => s + d.score, 0);
  const penalty = Math.min(total, tells.length * 18);
  if (penalty > 0) {
    const last = dims[dims.length - 1];
    last.score = Math.max(0, last.score - penalty);
    last.penaltyApplied = penalty;
    total = dims.reduce((s, d) => s + d.score, 0);
  }
  return { dims, total, tells };
}

// ---------------------------------------------------------------------------
// Model judge (real runs). claude-opus-4-8, structured-output JSON. The engine
// prompt (rubric + gold key + instructions) is cached per case so every
// response for that case reuses the prefix.
function judgeSystemPrompt(c) {
  const rubricRows = c.rubric
    .map((d) => `  - ${d.dimension} (max ${d.pts}): ${d.earns}`)
    .join("\n");
  const goldRows = c.goldKey.map((g, i) => `  ${i + 1}. ${g}`).join("\n");
  const tells = (contaminationTells[c.id] || []).join("; ");
  return `You are a rigorous, calibrated grader for a strategic-judgment benchmark.
You score a model's deliberative memorandum about a historical decision, judging
ONLY the quality of reasoning a contemporary decision-maker could have produced
at the information cutoff — NOT whether the memo names the historically correct
choice.

CASE: ${c.title}
INFORMATION CUTOFF: ${c.informationCutoff}

GOLD STANDARD — the reasoning a strong memo exhibits (reward these moves; do not
require the historical answer):
${goldRows}

RUBRIC — score each dimension from 0 to its max:
${rubricRows}

HINDSIGHT / CONTAMINATION: penalize the epistemic-discipline dimension when the
memo leaks knowledge it could not have at the cutoff — naming the historical
choice without deriving it, citing post-cutoff facts, or stating the outcome as
a premise. Example tells for this case: ${tells}

Return ONLY a JSON object of the form:
{"dimensions":[{"dimension":"<name>","score":<int>,"max":<int>,"rationale":"<short>"}],
 "contamination_tells":["<phrase>", ...],
 "total":<int 0-100>}
Scores must sum to total. Be parsimonious and consistent across responses.`;
}

async function modelScore(client, c, text) {
  const resp = await client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: judgeSystemPrompt(c),
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            dimensions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  dimension: { type: "string" },
                  score: { type: "integer" },
                  max: { type: "integer" },
                  rationale: { type: "string" },
                },
                required: ["dimension", "score", "max", "rationale"],
                additionalProperties: false,
              },
            },
            contamination_tells: { type: "array", items: { type: "string" } },
            total: { type: "integer" },
          },
          required: ["dimensions", "contamination_tells", "total"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      { role: "user", content: `MEMORANDUM UNDER REVIEW:\n\n${text}` },
    ],
  });
  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error(
      `judge returned no text block (stop_reason=${resp.stop_reason}); cannot grade this response`,
    );
  }
  let out;
  try {
    out = JSON.parse(textBlock.text);
  } catch (e) {
    throw new Error(`judge returned non-JSON output: ${e.message}\n--- raw ---\n${textBlock.text}`);
  }
  // Trust the model's own tells but union with the deterministic detector so a
  // missed leak still flags.
  const tells = Array.from(
    new Set([...(out.contamination_tells || []), ...detectTells(c.id, text)]),
  );
  return {
    dims: out.dimensions.map((d) => ({ dimension: d.dimension, max: d.max, score: d.score })),
    total: out.total,
    tells,
  };
}

// ---------------------------------------------------------------------------
function mean(xs) {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

async function main() {
  if (!existsSync(RESULTS_PATH)) {
    console.error(
      `ERROR: ${RESULTS_PATH} not found. Run the collector first:\n` +
        `  node harness/run.mjs${DRY_RUN ? " --dry-run" : ""}`,
    );
    process.exit(1);
  }
  const results = JSON.parse(readFileSync(RESULTS_PATH, "utf8"));

  let client = null;
  if (!DRY_RUN) {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error(
        "ERROR: ANTHROPIC_API_KEY is not set. Use --dry-run for the offline heuristic judge,\n" +
          "or set the key:  ANTHROPIC_API_KEY=… node harness/judge.mjs",
      );
      process.exit(1);
    }
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    client = new Anthropic();
  }

  console.log(
    `[judge] mode=${DRY_RUN ? "DRY-RUN (heuristic)" : `LIVE (${JUDGE_MODEL})`}  responses=${results.responses.length}`,
  );

  // Score every response, grouping by (model, case).
  // key: `${modelId}::${caseId}` -> { trialTotals:[], trialTells:[], dims:[][] }
  const buckets = new Map();
  for (const r of results.responses) {
    const c = caseById[r.caseId];
    if (!c) continue;
    const scored = DRY_RUN ? heuristicScore(c, r.text) : await modelScore(client, c, r.text);
    const key = `${r.modelId}::${r.caseId}`;
    if (!buckets.has(key)) buckets.set(key, { modelId: r.modelId, modelLabel: r.modelLabel, caseId: r.caseId, trials: [] });
    buckets.get(key).trials.push({ trial: r.trial, total: scored.total, dims: scored.dims, tells: scored.tells });
    console.log(`  ${r.modelId}  ${r.caseId}  trial ${r.trial + 1}: ${scored.total}/100  tells=${scored.tells.length}`);
  }

  // Aggregate to per-model rows.
  const modelOrder = results.models.map((m) => m.id);
  const rows = modelOrder.map((modelId) => {
    const label = results.models.find((m) => m.id === modelId).label;
    const perCase = {};
    let flags = 0;
    for (const c of cases) {
      const b = buckets.get(`${modelId}::${c.id}`);
      if (!b) {
        perCase[c.id] = null;
        continue;
      }
      perCase[c.id] = Math.round(mean(b.trials.map((t) => t.total)));
      flags += b.trials.filter((t) => t.tells.length > 0).length;
    }
    const caseScores = cases.map((c) => perCase[c.id]).filter((x) => x != null);
    const overall = caseScores.length ? Math.round(mean(caseScores)) : null;
    return {
      modelId,
      model: label,
      overall,
      perCase, // { cuba, inchon, gulf }
      flags,
    };
  });

  // provenance: the leaderboard's disclosure label keys off this. A dry-run, or
  // a live run that hasn't been through Jordan's expert gold-key review, is
  // still ILLUSTRATIVE — not publishable.
  const expertReviewed = process.env.SJL_EXPERT_REVIEWED === "1" && !DRY_RUN;
  const out = {
    schema: "sjl-scores/1",
    generatedAt: new Date().toISOString(),
    // The single flag index.html reads to decide whether to show real numbers
    // or keep the "ILLUSTRATIVE — NOT MEASURED" labelling.
    measured: !DRY_RUN,
    provenance: {
      mode: DRY_RUN ? "dry-run" : "live",
      runMode: results.mode,
      judge: DRY_RUN ? "deterministic-heuristic" : JUDGE_MODEL,
      trials: results.trials,
      expertReviewed,
      // The two preconditions for a citable leaderboard.
      requiresApiKey: !DRY_RUN ? "satisfied" : "NOT satisfied (dry-run)",
      requiresExpertGoldKeyReview: expertReviewed ? "satisfied" : "NOT satisfied",
    },
    cases: cases.map((c) => ({ id: c.id, shortLabel: c.shortLabel, title: c.title })),
    leaderboard: rows,
  };

  writeFileSync(SCORES_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`[judge] wrote scores.json -> ${SCORES_PATH}`);
  console.log(`[judge] measured=${out.measured}  expertReviewed=${expertReviewed}`);
  if (!expertReviewed) {
    console.log(
      "[judge] NOTE: scores remain ILLUSTRATIVE. A citable leaderboard needs a live run\n" +
        "        (ANTHROPIC_API_KEY) AND Jordan's expert review of the gold keys\n" +
        "        (then re-run judge with SJL_EXPERT_REVIEWED=1).",
    );
  }
  // Brief standings dump.
  const sorted = rows.slice().filter((r) => r.overall != null).sort((a, b) => b.overall - a.overall);
  for (const r of sorted) {
    console.log(`    ${String(r.overall).padStart(3)}  ${r.model}  (cuba ${r.perCase.cuba}, inchon ${r.perCase.inchon}, gulf ${r.perCase.gulf}; flags ${r.flags})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
