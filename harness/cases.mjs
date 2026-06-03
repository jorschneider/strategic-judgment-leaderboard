// ============================================================================
// cases.mjs — Strategic Judgment Leaderboard, single source of truth.
//
// The three case files, extracted verbatim from index.html so there is exactly
// ONE place the briefings, prompts, gold keys, outcomes, and rubrics live. The
// site renders the same prose; the harness sends the same prompts. If you edit a
// case, edit it here.
//
// Each case has:
//   id               machine id used in scores.json keys
//   shortLabel       column label used in the leaderboard table
//   title            human title
//   informationCutoff  the fixed date/hour the model reasons from
//   whatWasKnown     array of briefing facts ("Situation as Known")
//   systemPrompt     verbatim SYSTEM instruction sent to the model
//   prompt           verbatim DATE + TASK block (briefing is interpolated in)
//   goldKey          array of historian-sourced reasoning-standard bullets
//   documentedOutcome  what actually happened (the withheld answer key)
//   rubric           array of { dimension, earns, pts } summing to 100
//   sources          provenance note for the gold key
// ============================================================================

export const cases = [
  {
    id: "cuba",
    shortLabel: "Cuba '62",
    title: "The ExComm Decision — Cuban Missile Crisis",
    informationCutoff: "16 October 1962, morning.",
    informationCutoffNote:
      "The model knows everything the President knew at the first meeting of the Executive Committee of the National Security Council — and nothing after. It does NOT know there will be a blockade, a thirteen-day standoff, a secret Jupiter-missile trade, or a peaceful resolution. Those are the answer key, and they are withheld.",
    whatWasKnown: [
      "On 14 October a U-2 reconnaissance flight photographed San Cristóbal, Cuba. Analysts at NPIC have identified Soviet medium-range ballistic missile (SS-4) sites under construction. The film was developed and read out on 15 October; the President was briefed this morning, 16 October.",
      "The missiles are not yet operational, but the sites are being built rapidly. Once fueled and armed, SS-4s could strike Washington, D.C. with little warning.",
      "This contradicts repeated public and private Soviet assurances — through Ambassador Dobrynin and others — that Moscow would place no offensive weapons in Cuba.",
      "It is three weeks before the U.S. midterm elections. The administration has publicly warned that offensive missiles in Cuba would not be tolerated.",
      "Options on the table this morning: do nothing; a diplomatic approach; a naval blockade; a single “surgical” air strike on the missile sites; a wider air campaign; a full invasion of Cuba. The military's surgical-strike option cannot guarantee destroying every missile, and any strike risks killing Soviet personnel.",
      "Unknown to the principals this morning: the precise number of warheads on the island, whether tactical nuclear weapons are already deployed to repel an invasion, and how Khrushchev will respond to any given U.S. move.",
    ],
    systemPrompt: `You are a strategic advisor in the situation room. You may use ONLY the
information in the briefing below, which reflects everything known to U.S.
decision-makers as of the stated date and hour. Do not use any knowledge of
what happened afterward. If you find yourself relying on the outcome, stop and
reason instead from the facts on hand.`,
    prompt: `DATE/HOUR: 16 October 1962, morning.

BRIEFING: [the "Situation as Known" facts are inserted here in full]

TASK:
 1. State the core U.S. objective in one sentence.
 2. List the realistic options and, for each, its principal risks — including
    how the Soviet leadership is likely to respond.
 3. Recommend a course of action and justify it.
 4. Identify the single piece of information you would most want before acting,
    and how you would try to get it without forcing the other side's hand.
 5. Name the worst plausible way your recommendation could escalate, and how
    you would build in an off-ramp.

Respond as a deliberative memorandum.`,
    goldKey: [
      "Frames the objective correctly: get the missiles out without triggering nuclear war — not necessarily to punish or invade. Recognizes this is as much a political and signaling problem as a military one.",
      "Sees that a “surgical” strike is an illusion of control: it cannot be guaranteed to get every missile, it kills Soviets, it forecloses options, and it hands the initiative to Khrushchev. A first strike is the last rung, not the first.",
      "Identifies the value of a graduated, reversible move that buys time, demonstrates resolve, keeps the next move in U.S. hands, and gives the adversary a face-saving exit — the logic that historically pointed ExComm toward a blockade/quarantine paired with private diplomacy.",
      "Treats Khrushchev as a rational actor with his own domestic constraints, and explicitly designs an off-ramp (a quiet reciprocal concession; avoiding public humiliation).",
      "Names the information it most needs (are the missiles operational? are warheads on the island?) and how to buy time to learn it.",
    ],
    documentedOutcome:
      "After six days of secret deliberation, Kennedy chose a naval “quarantine” of Cuba, announced publicly on 22 October, rather than an immediate strike. Thirteen tense days followed. The crisis was resolved when the USSR agreed to remove the missiles in exchange for a U.S. pledge not to invade Cuba and a quiet, separate commitment to withdraw Jupiter missiles from Turkey. War was averted. The graduated, reversible move with a built-in off-ramp is widely regarded as a model of crisis judgment.",
    rubric: [
      { dimension: "Objective framing", earns: "Correctly centers “remove the missiles without nuclear war” over punishment/invasion.", pts: 20 },
      { dimension: "Option analysis", earns: "Weighs strike vs. blockade vs. diplomacy on their real risks; exposes the “surgical strike” fallacy.", pts: 25 },
      { dimension: "Escalation control", earns: "Prefers a reversible, time-buying move; designs a credible off-ramp for the adversary.", pts: 25 },
      { dimension: "Adversary modeling", earns: "Treats Khrushchev as rational with domestic constraints; anticipates his likely response.", pts: 15 },
      { dimension: "Epistemic discipline", earns: "Reasons from 16 Oct facts only; names key unknowns. Penalty for hindsight tells.", pts: 15 },
    ],
    sources:
      "Reasoning standard to be drafted and verified against: declassified ExComm meeting transcripts (the secret recordings); FRUS 1961–1963, Vol. XI (Cuban Missile Crisis); JFK Library holdings. This draft is a starting point for Jordan's expert review, not a finished key.",
  },
  {
    id: "inchon",
    shortLabel: "Inchon '50",
    title: "Operation Chromite — The Inchon Landing",
    informationCutoff: "23 August 1950.",
    informationCutoffNote:
      "The model stands in the Dai-Ichi headquarters in Tokyo on the day the Joint Chiefs' delegation — Army Chief Collins and CNO Sherman — arrives to talk MacArthur out of Inchon. It does not know the landing will be approved, will succeed, or that Seoul will fall within two weeks.",
    whatWasKnown: [
      "It is late August 1950. North Korean forces have driven U.N. troops into a small pocket in the southeast — the Pusan Perimeter — where the line is barely holding. The strategic situation is precarious.",
      "General MacArthur proposes a bold amphibious envelopment far to the rear: a landing at Inchon, the port for Seoul, to sever North Korean supply lines and retake the capital, collapsing the enemy's position around Pusan.",
      "The Navy and Marine planners catalog severe obstacles. Inchon has tides exceeding 30 feet — among the most extreme in the world — leaving vast mud flats that are impassable except in brief windows. The approach is a single narrow, easily mined channel (Flying Fish Channel). There are no beaches; troops must scale seawalls directly into a built-up city. The fortified island of Wolmi-do dominates the harbor and must be taken first, sacrificing surprise.",
      "The suitable tide window is extraordinarily narrow — only a few days in mid-September offer high enough water, and the landing would have to be split into two phases roughly twelve hours apart.",
      "The Joint Chiefs are skeptical: they fear stripping reserves from the fragile Pusan Perimeter, doubt the plan can be ready in time, and question whether Inchon is the right place at all. Alternative landing sites further south (e.g., Kunsan) are considered safer but far less decisive.",
      "Unknown to the planners: the actual strength and readiness of enemy defenses at Inchon and Wolmi-do, and whether the enemy anticipates the move.",
    ],
    systemPrompt: `You are a strategic advisor to the Joint Chiefs of Staff. You may use ONLY the
information in the briefing below, reflecting what was known on the stated date.
Do not use any knowledge of what happened afterward.`,
    prompt: `DATE: 23 August 1950.

BRIEFING: [the "Situation as Known" facts are inserted here in full]

TASK:
 1. State the operational problem and the decisive objective in one sentence.
 2. Assess MacArthur's Inchon proposal against its specific physical and
    military risks (tides, channel, seawalls, Wolmi-do, loss of surprise,
    drawdown of the Pusan reserve).
 3. Compare it with the safer alternatives and state what each would and would
    not achieve.
 4. Recommend: approve Inchon, approve an alternative, or withhold — and justify.
 5. If you approve a high-risk plan, specify the conditions and abort criteria
    that would make the gamble defensible rather than reckless.

Respond as a deliberative memorandum.`,
    goldKey: [
      "Correctly identifies the decisive logic of envelopment: a successful deep landing collapses the entire enemy position and is worth far more than an incremental push from Pusan.",
      "Engages each physical objection on its merits rather than dismissing them — and recognizes that the very obstacles (tides, the “impossible” harbor) also make the landing unexpected, which is itself a source of surprise and leverage.",
      "Distinguishes a calculated gamble from recklessness: a high expected payoff, a narrow but real window, and conditions under which the gamble is defensible — vs. a low-probability bet with no upside.",
      "Either recommends Inchon with explicit risk-mitigation and abort criteria, or recommends an alternative with a clear-eyed accounting of the decisiveness it sacrifices. Both can score well; an unreasoned answer in either direction cannot.",
      "Models the adversary's expectations — precisely the dimension MacArthur exploited.",
    ],
    documentedOutcome:
      "The Joint Chiefs approved the plan on 28 August; President Truman concurred. On 15 September 1950 the landing went in — Wolmi-do was taken on the morning tide, the main force on the evening tide. It succeeded spectacularly, severing North Korean supply lines and leading to the recapture of Seoul within roughly two weeks and the collapse of the enemy front. Inchon is remembered as a masterstroke. (Its very success arguably emboldened the subsequent advance to the Yalu — which provoked Chinese intervention — a reminder that a brilliant operational gamble can carry strategic consequences beyond the decision at hand.)",
    rubric: [
      { dimension: "Decisive-objective framing", earns: "Sees envelopment's outsized payoff vs. incremental pressure from Pusan.", pts: 20 },
      { dimension: "Honest risk accounting", earns: "Engages tides, channel, seawalls, Wolmi-do, surprise loss, reserve drawdown on the merits.", pts: 25 },
      { dimension: "Gamble discipline", earns: "Separates calculated risk from recklessness; sets conditions/abort criteria.", pts: 25 },
      { dimension: "Alternatives", earns: "Fairly weighs safer landing sites and what decisiveness they forfeit.", pts: 15 },
      { dimension: "Epistemic discipline", earns: "Reasons from 23 Aug facts only; uses the “unexpected” angle as analysis, not hindsight. Penalty for outcome tells.", pts: 15 },
    ],
    sources:
      "Reasoning standard to be drafted and verified against: the official histories (e.g., the U.S. Army South to the Naktong, North to the Yalu), USMC and Naval History & Heritage Command accounts of Operation Chromite, and the record of the 23 Aug 1950 Tokyo conference. Draft for expert review.",
  },
  {
    id: "gulf",
    shortLabel: "Gulf '91",
    title: "Stop at 100 Hours — Ending the Gulf War",
    informationCutoff: "27 February 1991, evening (Washington).",
    informationCutoffNote:
      "The ground war is roughly 100 hours old. The model is briefed as the President and his advisors weigh whether to halt offensive operations now. It does not know that a ceasefire will be declared, that part of the Republican Guard will escape, or that Saddam Hussein will remain in power for another twelve years.",
    whatWasKnown: [
      "The U.S.-led coalition's ground offensive began 24 February. In roughly four days it has been a rout: Kuwait is effectively liberated, the Iraqi army is shattered and in headlong retreat, and coalition casualties are remarkably light.",
      "Retreating Iraqi columns on the highways out of Kuwait City are being destroyed from the air — scenes already drawing the label “Highway of Death.” The imagery is becoming a political and humanitarian concern.",
      "The coalition's stated U.N. mandate is the liberation of Kuwait and restoration of its government — not the conquest of Iraq or the removal of Saddam Hussein. The coalition includes Arab states whose participation is premised on that limited aim.",
      "Continuing the offensive could trap and destroy more of the elite Republican Guard, but would mean driving deeper into Iraq — beyond the mandate, with uncertain end-state, occupation risk, and strain on coalition unity.",
      "Halting now secures a clean, decisive victory at low cost and on the moral high ground, but risks leaving Saddam's regime — and a portion of his best units — intact.",
      "Unknown this evening: exactly how much of the Republican Guard will get away; whether Saddam will survive politically; whether Iraq's internal factions will rise against him and what will happen to them.",
    ],
    systemPrompt: `You are a strategic advisor in the situation room. You may use ONLY the
information in the briefing below, reflecting what was known on the stated date
and hour. Do not use any knowledge of what happened afterward.`,
    prompt: `DATE/HOUR: 27 February 1991, evening (Washington).

BRIEFING: [the "Situation as Known" facts are inserted here in full]

TASK:
 1. Restate the war's actual political objective and whether it has been met.
 2. Lay out the case FOR halting now and the case for pressing on; be specific
    about what each buys and what each costs.
 3. Address the tension between military opportunity (finishing the Republican
    Guard / removing Saddam) and the limited mandate and coalition unity.
 4. Recommend halt, continue, or continue-with-limits — and justify against the
    objective, not against an open-ended wish list.
 5. If you halt, specify the ceasefire terms you would demand to lock in the win.

Respond as a deliberative memorandum.`,
    goldKey: [
      "Anchors on the real, limited objective — liberate Kuwait, restore its government — and recognizes that objective has essentially been achieved.",
      "Distinguishes “what is militarily possible” from “what the mandate and coalition authorize,” and treats mission creep as a real cost, not a free option.",
      "Weighs the genuine value of destroying more of the Republican Guard and the temptation of regime change against the costs: coalition fracture, occupation with no defined end-state, legitimacy, and the “Highway of Death” optics.",
      "Whether it recommends halt or a limited continuation, it ties the recommendation to the objective and specifies ceasefire terms that lock in the win — rather than reasoning backward from a desire to topple Saddam.",
      "Surfaces the strongest counter-argument to its own recommendation honestly — the mark of judgment under genuine uncertainty.",
    ],
    documentedOutcome:
      "President Bush, after consulting General Powell and coalition partners, suspended offensive operations after 100 hours; a ceasefire followed. Kuwait was liberated at low coalition cost and the limited mandate was honored — but a portion of the Republican Guard escaped, Saddam Hussein crushed the subsequent Shia and Kurdish uprisings, and he remained in power until 2003. The decision is still debated: a textbook limited war by its own terms, or a victory left dangerously unfinished.",
    rubric: [
      { dimension: "Objective anchoring", earns: "Centers the actual limited mandate and judges “done or not” against it.", pts: 20 },
      { dimension: "Cost/benefit honesty", earns: "States plainly what halting vs. continuing each buys and costs.", pts: 25 },
      { dimension: "Mission-creep discipline", earns: "Treats coalition unity and end-state risk as real constraints, not afterthoughts.", pts: 25 },
      { dimension: "Terms & lock-in", earns: "If halting, specifies ceasefire terms; if continuing, defines a limit and end-state.", pts: 15 },
      { dimension: "Epistemic discipline", earns: "Reasons from 27 Feb facts; steel-mans the opposing view; no hindsight about Saddam's survival. Penalty for outcome tells.", pts: 15 },
    ],
    sources:
      "Reasoning standard to be drafted and verified against: President Bush's 27 Feb 1991 address; the recollections of Bush, Scowcroft, and Powell; and the established record of the war's U.N. mandate and coalition composition. Draft for expert review; this is the most debatable of the three keys.",
  },
];

// Build the full user message a model receives for a case: the verbatim prompt
// with the briefing actually interpolated in place of the placeholder line.
export function buildUserPrompt(c) {
  const briefing = c.whatWasKnown.map((f) => `  - ${f}`).join("\n");
  return c.prompt.replace(
    '[the "Situation as Known" facts are inserted here in full]',
    "\n" + briefing,
  );
}

// Hindsight/contamination tells the judge looks for, per case. These are the
// concrete leaks named in the site's Methodology section.
export const contaminationTells = {
  cuba: ["quarantine", "blockade announced", "thirteen days", "13 days", "jupiter", "turkey", "october 22", "back-channel", "backchannel"],
  inchon: ["september 15", "15 september", "seoul fell", "seoul was recaptured", "succeeded spectacularly", "masterstroke", "yalu", "chinese intervention", "approved on 28"],
  gulf: ["ceasefire was declared", "republican guard escaped", "saddam remained", "until 2003", "twelve years", "shia uprising", "kurdish uprising", "crushed the"],
};
