// ============================================================================
// run.mjs — collect model responses for the Strategic Judgment Leaderboard.
//
// For each model in MODELS and each case in cases.mjs, send the verbatim
// system + briefing + task prompt and collect the deliberative memo. Runs N
// trials per (model, case) to average over sampling variance, and writes the
// raw responses to harness/results.json.
//
//   node harness/run.mjs              real run; needs ANTHROPIC_API_KEY
//   node harness/run.mjs --dry-run    deterministic offline mock, no key/network
//   node harness/run.mjs --trials 5   override trial count (default 2)
//
// Real runs use the official @anthropic-ai/sdk with prompt caching
// (cache_control) on the large system prompt so repeated trials reuse the
// cached prefix. --dry-run produces a fixed, reproducible mock so the whole
// pipeline (run -> judge -> scores.json -> index.html) is testable with no key.
// ============================================================================

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cases, buildUserPrompt } from "./cases.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_PATH = join(__dirname, "results.json");

// Anthropic model IDs by role. actor = latency-sensitive; director/quality =
// the strongest model; cheap = the small/fast model. These are the models the
// leaderboard ranks.
export const MODELS = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", role: "director / quality" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", role: "actor / latency-sensitive" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", role: "cheap" },
];

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const trialsArg = args.indexOf("--trials");
const TRIALS = trialsArg !== -1 ? Math.max(1, parseInt(args[trialsArg + 1], 10) || 2) : 2;
const MAX_TOKENS = 4096;

// --- Deterministic mock -----------------------------------------------------
// A small string hash so the mock varies by (model, case, trial) but is fully
// reproducible. No randomness anywhere in --dry-run.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Build a plausible deliberative memo that actually exercises the case's gold
// key and rubric dimensions, so the heuristic judge has real signal to score.
// One trial per (model, case) deliberately injects a hindsight tell so the
// contamination-flagging path is exercised in --dry-run.
function mockMemo(model, c, trial) {
  const seed = hash(`${model.id}|${c.id}|${trial}`);
  const injectTell = seed % 5 === 0; // ~20% of trials carry a contamination tell
  const firstDim = c.rubric[0].dimension;
  const lines = [
    `DELIBERATIVE MEMORANDUM — ${c.title}`,
    `Cutoff: ${c.informationCutoff}`,
    "",
    `1. OBJECTIVE. ${c.goldKey[0]}`,
    "",
    "2. OPTIONS AND RISKS.",
    `   ${c.goldKey[1]}`,
    `   ${c.goldKey[2]}`,
    "",
    `3. RECOMMENDATION. On the ${firstDim.toLowerCase()} above, I recommend the graduated, reversible course that keeps the next move in our hands and preserves an off-ramp for the adversary.`,
    "",
    `4. KEY UNKNOWN. ${c.goldKey[4]}`,
    "",
    `5. ESCALATION / ADVERSARY. ${c.goldKey[3]} I reason only from the facts on hand as of ${c.informationCutoff}, and flag the principal unknowns rather than assuming them away.`,
  ];
  if (injectTell) {
    // A deliberate hindsight leak for the dry-run to catch.
    const tell = {
      cuba: "We should impose the quarantine, since the blockade was announced on October 22 and the Jupiter trade resolved it after thirteen days.",
      inchon: "Approve Inchon: it succeeded spectacularly on September 15 and Seoul fell within two weeks, a masterstroke.",
      gulf: "Halt now, since the ceasefire was declared and Saddam remained in power until 2003 anyway.",
    }[c.id];
    lines.push("", `POSTSCRIPT. ${tell}`);
  }
  return lines.join("\n");
}

// --- Real Anthropic call ----------------------------------------------------
async function realMemo(client, model, c) {
  // cache_control on the system prompt: stable across trials and models with
  // the same case, so repeated requests reuse the cached prefix. The volatile
  // per-case briefing+task goes in the user turn (after the cached system).
  const resp = await client.messages.create({
    model: model.id,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: c.systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildUserPrompt(c) }],
  });
  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return {
    text,
    usage: resp.usage,
    stop_reason: resp.stop_reason,
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  let client = null;

  if (!DRY_RUN) {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error(
        "ERROR: ANTHROPIC_API_KEY is not set. Use --dry-run for an offline mock,\n" +
          "or set the key:  ANTHROPIC_API_KEY=… node harness/run.mjs",
      );
      process.exit(1);
    }
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    client = new Anthropic();
  }

  console.log(
    `[run] mode=${DRY_RUN ? "DRY-RUN (mock)" : "LIVE"}  models=${MODELS.length}  cases=${cases.length}  trials=${TRIALS}`,
  );

  const responses = [];
  for (const model of MODELS) {
    for (const c of cases) {
      for (let trial = 0; trial < TRIALS; trial++) {
        let text, usage = null, stop_reason = "mock";
        if (DRY_RUN) {
          text = mockMemo(model, c, trial);
        } else {
          const r = await realMemo(client, model, c);
          text = r.text;
          usage = r.usage;
          stop_reason = r.stop_reason;
        }
        responses.push({
          modelId: model.id,
          modelLabel: model.label,
          role: model.role,
          caseId: c.id,
          trial,
          text,
          usage,
          stop_reason,
        });
        console.log(`  ${model.id}  ${c.id}  trial ${trial + 1}/${TRIALS}  (${text.length} chars)`);
      }
    }
  }

  const out = {
    schema: "sjl-results/1",
    mode: DRY_RUN ? "dry-run" : "live",
    startedAt,
    finishedAt: new Date().toISOString(),
    trials: TRIALS,
    models: MODELS,
    responses,
  };
  writeFileSync(RESULTS_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`[run] wrote ${responses.length} responses -> ${RESULTS_PATH}`);
  console.log(`[run] next: node harness/judge.mjs${DRY_RUN ? " --dry-run" : ""}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
