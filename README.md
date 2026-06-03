# The Strategic Judgment Leaderboard

A single-file static demo of a benchmark concept that grades AI models on the quality of their *reasoning* about consequential historical decisions — judged only on what was knowable at the moment of choice. It reconstructs three thoroughly declassified decisions (the Cuban Missile Crisis ExComm deliberation of 16 Oct 1962, MacArthur's Inchon landing decision of 23 Aug 1950, and the 100-hour halt that ended the Gulf War on 27 Feb 1991) as situation-room briefings with an explicit information cutoff, the exact prompt a model would receive, a historian-sourced gold reasoning standard, the documented outcome, and a scoring rubric — plus an illustrative leaderboard and a methodology that explains the anti-contamination design. The aesthetic is a declassified dossier: manila folder, typewriter display type, redaction-bar motifs, a sober "DECLASSIFIED" stamp, monospace for scores and case IDs, and a single oxblood accent.

## How to run the site

The page is a single self-contained `index.html` with no build step. Either:

- Open `index.html` directly in a browser (`file://`), **or**
- Serve it: `python3 -m http.server` then visit `http://localhost:8000`

At load, the page tries to `fetch('./scores.json')` and render the leaderboard from it. On **any** failure — opened via `file://` (browsers block `fetch` there), the file being absent, or a `scores.json` that is present but marked unmeasured/unrun — it falls back to the inline **"ILLUSTRATIVE — NOT MEASURED"** placeholder rows. So the leaderboard always renders, and the demo still works opened directly from disk. When a real, expert-reviewed `scores.json` is present and served over HTTP, the page swaps in the measured numbers and flips the disclosure labels to "MEASURED".

Fonts load from the Google Fonts CDN (Special Elite, IBM Plex Mono, Source Serif 4). Everything else is inline. No backend, no tracking, no data leaves the browser. Deploys to Vercel as a static site.

## The eval harness

The harness turns the concept into real numbers. It lives in `harness/`, uses the official `@anthropic-ai/sdk`, and treats `harness/cases.mjs` as the single source of truth for the three case files (briefings, verbatim prompts, gold keys, outcomes, rubrics — the same content `index.html` displays).

```
harness/cases.mjs   the 3 cases as structured data (one source of truth)
harness/run.mjs     calls each model on each case, N trials -> harness/results.json
harness/judge.mjs   rubric-guided judge -> scores.json (next to index.html)
```

Install once: `npm install` (pulls `@anthropic-ai/sdk`).

### Offline dry-run (no key, no network)

Test the whole pipeline with a deterministic mock — no API key required:

```bash
node harness/run.mjs --dry-run      # writes harness/results.json (mock memos)
node harness/judge.mjs --dry-run    # writes scores.json (heuristic grader)
# or: npm run eval:dry
```

`--dry-run` is fully reproducible: `run.mjs` emits fixed mock memos (a ~20% slice carries a deliberate hindsight tell so the contamination-flagging path is exercised), and `judge.mjs` scores them with a transparent lexical heuristic instead of a model. The resulting `scores.json` is marked `"measured": false`, so the site keeps the placeholder labelling — exactly what you want for a sample, never for publication.

### Real run

```bash
ANTHROPIC_API_KEY=…  node harness/run.mjs        # collect real responses
ANTHROPIC_API_KEY=…  node harness/judge.mjs      # grade them -> scores.json
```

`run.mjs` sends the verbatim system + briefing + task prompt to each model across `--trials N` (default 2), applying prompt caching (`cache_control`) on the large theory-engine / rubric system prompts so repeated trials reuse the cached prefix. Models ranked: `claude-opus-4-8` (director / quality / judge), `claude-sonnet-4-6` (actor / latency-sensitive), `claude-haiku-4-5-20251001` (cheap). `judge.mjs` uses `claude-opus-4-8` as a rubric-guided judge (structured JSON output, rubric/gold-key prompt cached per case), scores each response 0–100 across the rubric dimensions, flags hindsight/contamination tells, and aggregates to per-case and overall.

### Two preconditions before any number is citable

A real run alone is **not** enough to publish. `scores.json` only counts as publishable when BOTH hold, and the site only shows "MEASURED" when both are recorded in its `provenance`:

1. **A live run** with `ANTHROPIC_API_KEY` (so `measured: true`), AND
2. **Jordan's expert historical review** of every gold key. After that review, re-run the judge with `SJL_EXPERT_REVIEWED=1 node harness/judge.mjs` to record it.

Until both are satisfied, the numbers remain illustrative by design — a benchmark is only as honest as its refusal to publish numbers it didn't measure.

## What's real vs. illustrative

**Real:**
- The three historical case files — situations, dates, options, and documented outcomes — drawn from well-established declassified records (ExComm transcripts & FRUS for Cuba; the official Korean War / Operation Chromite histories for Inchon; the public record of the Gulf War's U.N. mandate and ceasefire). Kept to widely-accepted facts.
- The benchmark *concept*: the information-cutoff / anti-contamination design, the verbatim prompts, and the scoring rubrics are a genuine, runnable design.

**Illustrative / placeholder:**
- **Every leaderboard score is a hand-set placeholder.** No model was evaluated and no live eval was run; the numbers exist only to show the table's shape and are labelled unmistakably as such. They should not be cited.
- The "contamination flags" counts are likewise illustrative.
- The **gold-standard reasoning keys are first drafts** written for the demo. They have **not** been through expert historical review and are starting points, not authority — they need Jordan's expert review.

## What's needed to go live

1. **Finalize and expert-review the items** — lock each briefing/prompt and put every gold key through expert historical review (the step that most needs Jordan), verified against FRUS, declassified transcripts, and official histories.
2. **Model API keys** for the frontier models to be ranked (none are bundled).
3. **A harness** — a runner that sends the verbatim prompt to each model on each item across multiple trials, plus a rubric-guided judge model (with human spot-checking) to grade responses and flag hindsight leakage.
4. **Aggregate and publish** real per-item and overall scores, replacing the placeholders, with trial count and methodology stated alongside.

## Sources consulted (widely-established declassified facts)

- Cuban Missile Crisis: JFK Library; U.S. State Dept. Office of the Historian (FRUS 1961–63, Vol. XI); National Security Archive.
- Inchon / Operation Chromite: U.S. Army Center of Military History; USMC and Naval History & Heritage Command accounts.
- Gulf War ceasefire: President Bush's 27 Feb 1991 address (Miller Center); Naval History & Heritage Command Desert Storm materials.
