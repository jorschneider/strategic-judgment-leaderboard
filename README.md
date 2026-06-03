# The Strategic Judgment Leaderboard

A single-file static demo of a benchmark concept that grades AI models on the quality of their *reasoning* about consequential historical decisions — judged only on what was knowable at the moment of choice. It reconstructs three thoroughly declassified decisions (the Cuban Missile Crisis ExComm deliberation of 16 Oct 1962, MacArthur's Inchon landing decision of 23 Aug 1950, and the 100-hour halt that ended the Gulf War on 27 Feb 1991) as situation-room briefings with an explicit information cutoff, the exact prompt a model would receive, a historian-sourced gold reasoning standard, the documented outcome, and a scoring rubric — plus an illustrative leaderboard and a methodology that explains the anti-contamination design. The aesthetic is a declassified dossier: manila folder, typewriter display type, redaction-bar motifs, a sober "DECLASSIFIED" stamp, monospace for scores and case IDs, and a single oxblood accent.

## How to run

It is a single self-contained `index.html` with no build step. Either:

- Open `index.html` directly in a browser, **or**
- Serve it: `python3 -m http.server` then visit `http://localhost:8000`

Fonts load from the Google Fonts CDN (Special Elite, IBM Plex Mono, Source Serif 4). Everything else is inline. No backend, no tracking, no data leaves the browser. Deploys to Vercel as a static site.

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
