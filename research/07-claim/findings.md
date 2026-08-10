# The frozen claim — One Day in America

Ticket 07 · `rigor-claim` pass · frozen 2026-08-10 · claude (opus)

Corpus = **the ledger and the candidate claim**: ticket 03's gate-proven extract, and the words
ticket 06 locked. The Atelier Rigor engine (`rigor` CLI) was **not** used — same reason as ticket
02, this project is not scaffolded as an Atelier project. Its `compare()` / `curve` / `freeze-claim`
steps are served by `spike/claim/verify.mjs`, which logs every number it computes through one
`log()` call and prints the ledger at the end. `rigor decide` is served by **Decisions that bind
later stages** at the bottom of this file.

Harness = [`spike/claim/verify.mjs`](../../spike/claim/verify.mjs) ·
report = [`spike/claim/results/report.txt`](../../spike/claim/results/report.txt) ·
ledger + values = `spike/claim/results/{ledger,claim}.json`. All committed, as the evidence trail —
same convention as `spike/render-budget`; `npm`-scale byproducts are what `.gitignore` excludes, not
the spike's own code and results.

**Σ cells logged: 146**, across 17 estimands. Every number below traces to one of them.

---

## The claim, frozen

> **Everyone's 3 a.m. looks the same. Nobody's noon does.**

| | |
|---|---|
| **Estimand** | `braid_gap_pp` — the share of the population doing the single most common activity, at the tightest hour of the day against the loosest |
| **The number** | **96.5 % → 25.8 %, a 70.8 pp gap** |
| **Population** | Civilian, noninstitutional, **15+**, living in households, 50 states + DC (S9). Not "all Americans" |
| **Year** | **2024 only** (L3). n = **7,669** respondent-days |
| **Weighting** | `TUFINLWGT`, person-day weights, §7.4 estimators (S3) |
| **Time base** | Each respondent's **own local clock** on their own diary day, 4 a.m. → 4 a.m. **Not simultaneity** (S8) |
| **Partition** | The 12 gate-proven published activity majors (ticket 03) |
| **Resolution** | The **hour** — because the copy names hours |
| **Uncertainty** | No BLS standard error exists (S12 off the board, L4). Linearized floor ± 0.72 pp on the gap; three independent annual samples reproduce it within 0.64 pp |
| **Register** | **Associational / descriptive.** No causal verb anywhere in the record or the copy |
| **Kind** | **Exploratory**, found by mining (ticket 05), not predicted. Labelled as such |

**Cited at the median specification, not the best cell.** The curve's median specification is
`2024 · majors12 · 60 min` → **70.8 pp**. The best cell available was 72.3 pp (2024 · majors12 ·
1 min). The record uses the median, and it costs 1.5 pp.

The median specification is also, by coincidence worth noting, **exactly the resolution the copy's
words assert**: "3 a.m." and "noon" are hours, not minutes.

### The four defensible readings of the same claim

| Reading | 3 a.m. | noon | gap |
|---|---|---|---|
| **The hour** (median spec, recommended) | **96.5 %** personal care | **25.8 %** work | **70.8 pp** |
| The minute the words name | 96.4 % | 24.4 % | 72.0 pp |
| Asleep specifically, the hour | 96.0 % | 4.0 % | — |
| The day's argmax / argmin | 96.6 % at 3:34 a.m. | 24.3 % at 12:02 p.m. | 72.3 pp |

**Use the hour.** It is the median specification, it is the resolution the words already claim, and
it is the only reading that cannot be accused of picking a minute.

---

## Job 1 — is "3 a.m." defensible, or does the word have to move?

**The word stays. The measured minute must never ship.**

The map flagged that the copy says "3 a.m." while the measured sleep peak is 3:27 a.m., and that the
value at 3:00 sharp was uncomputed. It is now computed, and the rounding is nearly free:

| At | modal (12 majors) | asleep only |
|---|---|---|
| 3:00 a.m. sharp | 96.4 % | 95.7 % |
| the 3 a.m. hour | 96.5 % | 96.0 % |
| 3:34 a.m. (modal argmax) | 96.6 % | — |
| 3:27 a.m. (asleep argmax) | — | 96.2 % |

**Cost of the word: 0.21 pp** on the modal reading, **0.52 pp** on the asleep reading. Against a
70.8 pp effect, and against a ± 0.72 pp uncertainty floor that is itself larger than the rounding.

**The reason to keep it is stronger than "the cost is small": the argmax minute is not a real
statistic.** Three independent annual samples put the peak at **2:55 a.m. (2019), 3:11 a.m. (2023),
3:34 a.m. (2024)** — a 39-minute wander — while the value at 3:00 sharp moves only 0.64 pp across
the same three samples. This is C5 exactly: the location of an extremum drawn from a flat noisy
curve is mostly noise. The plateau is what is real — **120 contiguous minutes, 2:00–3:59 a.m., where
the modal share sits at or above 95 %** (asleep alone: 119 minutes, 2:01–3:59 a.m.).

So "3 a.m." is not a rounding of 3:27. It is the correct-resolution statement of a two-hour plateau,
and **"3:27 a.m." is the number that would be indefensible** — it names a minute the next year's
sample would not pick.

**"Noon" needs no work at all.** 12:00 sharp is 24.4 %, within **0.11 pp** of the day's measured
trough (24.3 % at 12:02 p.m.), and the noon hour is the trough hour in every frame and resolution on
a fine activity partition. The same rule binds: **12:02 p.m. never ships** — 2019 and 2023 both put
the trough at 12:05 p.m.

---

## Job 2 — does "worked that day" tighten noon?

**Yes, hard. It roughly triples the noon share and moves the group's loosest moment to the evening.**

The map's open item — "filtering to *worked that day* may tighten noon instead of fraying it. Nobody
has computed it" — is now computed. 2024 only, so `n` is the real thread count the rope would
re-form from, and L6's 844 line applies to each row.

| group | n | ≥844 | 3:00 a.m. | **noon** | modal at noon | that group's loosest minute |
|---|---:|---|---:|---:|---|---|
| everyone | 7,669 | yes | 96.4 % | **24.4 %** | work | 24.3 % · 12:02 p.m. |
| **worked that day** | 2,489 | yes | 95.9 % | **57.4 %** | work | 25.1 % · **6:04 p.m.** |
| **worked 6 h+ that day** | 1,757 | yes | 95.7 % | **65.4 %** | work | 26.7 % · **6:22 p.m.** |
| worked 6 h+, weekday | 1,472 | yes | 96.1 % | **65.3 %** | work | 25.7 % · 6:15 p.m. |
| did not work that day | 5,180 | yes | 96.8 % | 29.8 % | leisure/sports | 23.6 % · 9:33 a.m. |
| employed, didn't work that day | 1,966 | yes | 96.8 % | 28.9 % | leisure/sports | 25.0 % · 10:00 a.m. |
| age 25–54 | 3,227 | yes | 96.2 % | 34.7 % | work | 25.1 % · 5:02 p.m. |
| age 65+ | 2,678 | yes | 96.9 % | 30.0 % | leisure/sports | 23.9 % · 9:00 a.m. |
| weekday diaries | 3,837 | yes | 96.5 % | 30.3 % | work | 28.5 % · 4:33 p.m. |
| weekend diaries | 3,832 | yes | 96.3 % | 28.3 % | leisure/sports | 22.9 % · 9:33 a.m. |
| children <18 in hh | 2,107 | yes | 96.9 % | 27.0 % | work | 26.1 % · 4:16 p.m. |
| no children in hh | 5,562 | yes | 96.1 % | 23.0 % | work | 22.9 % · 12:02 p.m. |
| men | 3,563 | yes | 95.6 % | 26.3 % | work | 26.1 % · 12:02 p.m. |
| women | 4,106 | yes | 97.2 % | 22.6 % | work | 22.6 % · 12:02 p.m. |
| enrolled in school | 466 | **NO** | 99.1 % | 26.6 % | education | 24.2 % · 12:44 p.m. |

**Three findings the exploration layer inherits.**

1. **The rope re-forms.** Filter to people who worked 6 h+ on a weekday and the midday goes from a
   fray to a second braid: **86.4 % of them are working at 2 p.m.**, against 30.3 % for the country.
   Hour by hour the group runs 82.7 / 85.5 / 83.7 / 65.3 / 78.6 / **86.4** / 84.0 % from 9 a.m. to
   3 p.m. Noon is the *dip* inside their working day — lunch — not their loosest hour.
2. **Their loosest moment moves to the evening.** Every worker slice troughs at **6:00–6:22 p.m.**,
   not at noon. The most coordinated group in the country is at its least coordinated in the early
   evening, after its working hours have ended. That is the strongest single payoff in the
   exploration layer.
3. **At noon the country's modal share is low in a population where only about a quarter are working
   at all; the working slice itself is not scattered.** The two other big slices at noon are doing
   leisure (non-workers, 29.8 %; 65+, 30.0 %), and the population number is the blend.

**This is not a tautology, and the check is in the record.** Filtering on "worked that day"
guarantees one work minute, not a shared window. Under a rotation null — every person's activity
durations held fixed, their day started at a uniform random time — the expected share of that group
working at any given minute is **39.2 %**. Observed at 2 p.m. is 86.4 %, **2.20×** the null. At noon
it is 65.3 % against the same 39.2 %, **1.67×**. The tightening is coordination, not arithmetic.

**Groups that cannot be offered as drawn threads in a 2024-only build.** L6 governs, and 2024 alone
is a smaller pool than the pooled counts ticket 06 quoted: **enrolled in school is 466**, under the
844 line. Statable as a number, not drawable as traceable people. Every other filter above clears it.

---

## The gate — 15 checks

### Stage A — shape and units

| | verdict |
|---|---|
| **A1 · Denominator and level of analysis** | **Pass.** A rate throughout. Denominator = Σ`TUFINLWGT` over the 2024 S9 universe, identical on both sides of the comparison — the two numbers are the same population at two times of its own day, not two populations. No group-to-individual crossing: the claim is about *the share of people*, and the mark draws *one thread per person*, so the visual and the statistic sit at the same level. |
| **A2 · Unit consistency** | **Pass.** One unit throughout: weighted share of respondent-days, percent. One year, so no deflator, no vintage mixing, no stock-vs-flow. Both sides come off the same 1440-minute grid built from the same `TUACTDUR24` durations (S2), and the harness re-asserts ticket 03's coverage invariant — every minute of every year is covered by exactly n respondent-days — before computing anything. |
| **A3 · Aggregation direction** | **Pass, with the mixture named.** The plausible third variable is day of week (ATUS samples weekend days at 2.5× the weekday rate). Split: weekdays peak 96.6 % / noon 30.3 %; weekends peak 96.7 % / noon 28.3 %. Both slices carry the same shape, so the pooled number is not an average of two opposite things. **But the pooled noon share (24.4 %) is lower than either slice**, because the modal activity at noon differs by day type — work on weekdays, leisure on weekends — so blending them lowers the winner. Day of week is a **confounder-like selector** here, not a mediator; the correct number for a claim about *the American day* is nonetheless the 7-day weighted one, because that is the estimand and BLS's own weights are person-day weights over all seven. **Consequence for copy:** part of "nobody's noon looks alike" is *your noon depends on what day it is*. That is still fraying, and it must not be described as fraying purely within a single weekday. |

### Stage B — multiplicity

| | verdict |
|---|---|
| **B1 · Comparison ledger** | **Pass.** 146 cells logged by the tool that computed them, printed by estimand at the end of `report.txt`. The prior wide search — ticket 05's candidate mining, six candidate families over the same extract — is logged in `spike/spines/results/report.txt` and is the honest denominator for *how this claim was found*. |
| **B2 · Confirmatory vs exploratory** | **Pass, tagged exploratory.** This pattern was found by browsing (ticket 05 mined the extract for candidate spines, then ticket 06 ranked four survivors). It was not predicted. **The claim must never be written in a voice implying it was.** No "we expected", no "as theory predicts". |
| **B3 · Correction or confirmation** | **Pass — specification curve.** 60 specifications: partition (3) × frame (5) × resolution (4). Gap range **52.0 – 72.3 pp**, median **71.0 pp**, median specification **70.8 pp**. Weighting is not a curve dimension because S3 forbids an unweighted estimate; the equal-ink twin is measured separately as a fidelity question about the mark. |

**The curve's one real finding — the claim is partition-dependent, and that binds the design.**

- Peak lands in the 2–5 a.m. band in **60/60** specifications. The night half of the claim is
  unconditionally stable.
- Trough lands in the midday band in only **40/60 (66.7 %)** — below any sane stability threshold.
- **Every one of the 20 misses is a `coarse3` specification**, which collapses the day into
  necessary / obligated / free. Under three colours, noon is **53.7 % obligated** and the day's
  loosest hour moves to **6 p.m. (39.1 %)**. The headline would be false.
- Conditioned on a fine activity partition (`majors12` or `majors13`, 40 specs): trough in the
  midday band **40/40 (100 %)**, gap **69.1–72.3 pp**.

The partition is not a free analytic choice, because **the partition *is* the colour scale the mark
ships**. So the claim is frozen conditioned on it, and the condition becomes a hard design
constraint (C3 below): ship a fine activity scale, or change the headline.

### Stage C — statistical substance

| | verdict |
|---|---|
| **C1 · Effect-size floor** | **Pass, with a disclosed weakness.** Floor = **10 pp**, set from the largest measured error anywhere in this pipeline (the 9.09 pp worst-case equal-ink error, rounded up). Median specification clears it **7.1×**; the worst of all 60 clears it **5.2×**. **The weakness: the floor was fixed after the comparisons existed** — this project is not Atelier-scaffolded and no floor was declared at charting. A floor chosen post-hoc is itself a forking path. It is disclosed rather than dressed up; the conclusion does not turn on where the floor sits, since no defensible specification lands within 5× of it. |
| **C2 · Noise and uncertainty** | **Pass.** No p-value anywhere; none would mean anything here. Two statements, both computed **at the same specification as the frozen estimate** — the hour, not the sharp minute: **(a)** linearized SRS-with-weights floors — 3 a.m. hour **96.54 ± 0.27 %** (asleep 96.03 ± 0.28), noon hour **25.79 ± 0.66 %**, gap **70.75 ± 0.72 pp** — explicitly **floors**, not BLS replicate-weight SEs (P2), never to be printed as an error bar. (The sharp-minute twins, 96.41 ± 0.28 / 24.40 ± 0.70 / 72.01 ± 0.75, are in the report; pairing a minute-level interval with an hour-level estimate would be mixing specifications.) **(b)** The stronger evidence: three independent annual samples reproduce the numbers within **0.64 pp at 3 a.m. and 0.40 pp at noon**. An actual re-draw of the survey beats a variance formula. |
| **C3 · Confounding and spurious correlation** | **Pass.** Confound check: day of week (A3, both slices carry the shape), sex, age band, presence of children, employment — all in the Job 2 table, none reverses the shape; every group's 3 a.m. sits at 95.6–99.1 % and every group's loosest minute is under 29 %. **Not** "confounding ruled out" — checked against these variables, on 2026-08-10, with this result. Search-coincidence: the claim came out of a logged wide search (ticket 05), and the whole day is only 1,440 cells, so this is not one lucky pair out of millions. |
| **C4 · Selection and survivorship** | **Pass, narrowed, and the exclusion cuts both ways.** **(i) The universe (S9)** excludes under-15s, the institutionalized (prisons, nursing homes, dorms), active-duty military, and territories. Institutional days are *more* schedule-bound than household days, so their absence, if anything, **understates** the night-time uniformity. **The same exclusion runs the other way at noon**: the largest excluded group is everyone under 15, the most schedule-bound population in the country and nearly all of it in the same place at midday, so excluding them plausibly **overstates** midday fragmentation. Both directions are stated; neither is computed, and the record does not get to argue the direction only where it flatters the claim. The copy's "Everyone" is narrowed to the S9 universe here and must not be defended as literal. **(ii) Non-response** — ATUS 2024 respondents are people who agreed to describe a day; ticket 02 recorded no evidence on whether their days differ, so this is stated as unchecked, not dismissed. **(iii) Job 2's "worked that day" filter selects on the outcome the group is then observed doing** — handled explicitly by the rotation null above (1.67–2.20× the null), which is what separates coordination from the filter. |
| **C5 · Regression to the mean** | **Pass — and it is the whole of Job 1.** The argmax minute *is* an extreme from a noisy curve, and it does revert: 2:55 → 3:11 → 3:34 a.m. across three samples, with no cause. **And the minute axis is not even a measurement axis at that scale**: ATUS is a recall diary reported in round numbers, and **85.3 % of 2024 episode starts fall on a multiple of five minutes, 23.9 % on the hour** (uniform would be 20 % and 1.7 %). A named minute is therefore a report of when people *say* things happened. This is why the rounded hour ships and the exact minute is forbidden. The *value* is checked against two other periods (2019, 2023) and holds within 0.64 pp. |
| **C6 · Base rate and predictive value** | **Not applicable.** No "X flags/predicts Y" claim exists here; the claim is a description of a distribution, not a rule. Stated, not skipped. |

### Stage D — language

**D1 · Causal-language lint — pass on the second run.** The register is **associational/descriptive**
and no unlock condition is claimed or needed. Scanned copy and record against the blocked list: no
`causes`, `leads to`, `drives`, `results in`, `because of`, `explains why`, `responsible for`,
`is why`.

**The first run of this lint passed while the record contained two blocked constructions**, both
found by the adversarial pass: a bare **`because`** (the list carries `because of`, and unqualified
`because` slipped it) and **"coordinated by work"** — a causal claim hidden in a passive, two
paragraphs above C7's own rejection of exactly that. Both are fixed. The lesson is recorded rather
than tidied away: **a blocked-pattern list is a keyword scan, and a causal claim can be phrased
around every keyword on it.** Bare `because`, agentless passives, and decline verbs ("falls apart",
"comes apart") all belong on the list for this project.

The one place a blocked pattern would be *tempting* is Job 2 — "work is what holds the country
together at noon", "the workday **drives** the coordination". **Blocked.** ATUS is cross-sectional;
it observes that people who worked were working at the same hours, not that work caused the
synchrony (school, daylight, business hours and shift structure are all unseparated here). Permitted
phrasings: *the working slice is the coordinated one* · *coordination tracks the working day* · *the
country's noon is loose in a population where about a quarter are working at all*.

**D2 · Uncertainty communication — pass, with two design obligations.**

- **No number is charted with more visual confidence than it has.** Since no error bars exist
  anywhere in this build (L4), no number may be drawn in a way that implies one.
- **The small-group rule is live.** School enrolment (n = 466) may be stated as a number and must
  never be drawn as traceable threads (L6).

### Stage E — record

**E1 · Record completeness — pass.** All nine fields present and dated, below.

---

## The nine fields

1. **Source, retrieval, query, transform.** BLS American Time Use Survey, 2024 Activity + Respondent
   files, re-fetched byte-identical to the ticket-02 hashes (ticket 03). Transform: `npm run data`
   builds `data/extract/{episodes,respondents}-2024.csv`, gate-proven against 637 of 639 published
   Table A-1 cells. Query: `spike/claim/verify.mjs`, run 2026-08-10.
2. **The tidy numbers.** 2024, n = 7,669 respondent-days, Σ`TUFINLWGT` denominator. 3 a.m. hour:
   96.5 % personal care (96.0 % asleep). Noon hour: 25.8 % work (4.0 % asleep). Gap 70.8 pp.
   Minute-level and argmax/argmin variants in the four-readings table above; all 146 cells in
   `ledger.json`.
3. **The curve and its denominator.** 60 specifications for `braid_gap_pp`, median 71.0 pp, median
   specification 70.8 pp, range 52.0–72.3 pp; stability 60/60 on the peak, 40/40 on the trough once
   conditioned on a fine partition. Σ cells over all estimands: 146.
4. **The floor cleared, and by how much.** 10 pp; cleared 7.1× at the median specification, 5.2× at
   the worst. Post-hoc floor, disclosed (C1).
5. **Uncertainty and its basis.** No BLS SE exists (S12/L4). Linearized SRS-with-weights **floors**,
   computed at the hour to match the frozen estimate: ± 0.27 pp at 3 a.m., ± 0.66 pp at noon,
   ± 0.72 pp on the gap. Independent basis: three annual samples agree within 0.64 pp. Neither may be
   drawn as an error bar (P2).
6. **The confound check performed and its result.** Checked 2026-08-10 against day of week, sex, age
   band, presence of children under 18, employment status and worked-that-day. Result: the shape
   holds in every slice; the pooled noon share is lower than either day-type slice because the modal
   activity differs by day type. **Not** ruled out — checked, with this result.
7. **The causal register used.** Associational. No unlock condition claimed, none needed.
8. **Known limitations already surfaced.** (a) No simultaneity — local clocks only (S8). (b) The
   universe is 15+, civilian, noninstitutional, households, 50 states + DC — not "all Americans"
   (S9). (c) ATUS sleep is *diary* sleep, time in bed asleep or trying to sleep, which runs ~1.5 h
   above self-report surveys — a definition, not an error (ticket 05). (d) The claim is
   partition-dependent: a coarse activity scale moves the loosest hour to 6 p.m. (e) Exploratory,
   found by mining. (f) One year; no change is asserted and none may be read in. (g) Non-response
   bias unchecked. (h) The floor is post-hoc.
   **(i) Reporting granularity is not constant across the day, and this claim is a granularity
   contrast.** ATUS is a retrospective recall diary: a night is typically narrated as one or two
   episodes, a daytime as many (≈18 episodes per diary day). The instrument cannot resolve
   night-time heterogeneity even where it exists, while it resolves midday heterogeneity finely, and
   85.3 % of reported episode starts land on a multiple of five minutes. Some unknown part of the
   70.8 pp gap is a property of how a day is *narrated*, not what was *done*. Distinct from (c),
   which is about sleep duration level rather than uniformity; unquantified, direction unknown, and
   it is the limitation most specific to this claim.
   **(j) The universe exclusion is not direction-neutral.** It understates night uniformity and
   plausibly overstates midday fragmentation (C4). Both directions stated, neither computed.
   **(k) The 4 a.m. diary boundary (S2) is a wrap, not a seam inside the claim.** The diary day runs
   4 a.m. → 4 a.m., so the claim's 3 a.m. is minute 1380 — the morning **after** the day being
   watched — while noon is on the diary day itself. The 2.86 pp step between the array's last and
   first minute spans two different mornings ~24 h apart for the same person, not a discontinuity in
   anyone's day. No bias follows: person-day weights represent all seven diary days, so the
   following mornings cover all seven too. Recorded because a challenger will notice the step.
9. **Correction-log hook.** This file is the record. If a number is later shown wrong: amend this
   file in place with a dated `## Correction` section at the bottom, update the site copy in the
   same commit, and note it in the project's map under Decisions. Owner: Dustin. Anything that
   changes the frozen number by more than the 10 pp floor requires re-running the gate, not a patch.

---

## What the claim cannot support

The four misreadings a viewer will make, and whether the design has to actively prevent them.

| Misreading | True? | Prevent? |
|---|---|---|
| **"At 3 a.m. Eastern, 96 % of America was asleep at the same moment."** | **No.** S8: no time-zone convention is documented, and the figure is each respondent's own 3 a.m. | **Yes, actively — and the possessive is not enough on its own.** The possessive in "**Everyone's** 3 a.m." is load-bearing and any rewrite that drops it ("America at 3 a.m.") is forbidden (L2). But a reader with no chart literacy does not parse an apostrophe-s as a time-zone disclaimer; to them "Everyone's 3 a.m." still means *3 a.m., for everyone*. Staking the project's largest exposure on one grammatical device is too thin. **The source line carries the rest** — see C10. No clock, ticker, or "right now" framing anywhere in the mark. |
| **"Everyone means everyone, and nobody means nobody."** | Literally no — 4 % are awake at 3 a.m., and a quarter of the country shares an activity at noon. | **No.** Rhetorical absolutes over a 96 %/26 % split are within normal English and the mark shows the residue as visible off-colour threads. It stays honest only while the mark keeps drawing the exceptions rather than smoothing them away. |
| **"Something changed — this is what remote work did to the American day."** | Not asserted and not supported. 2024 alone is drawn (L3); no change is claimed and S12 is off the board. | **Yes, passively.** No year label that implies a comparison, no "now", no "since". If a writeup wants the change story, that is candidate 1, which ticket 06 dropped. |
| **"This is 7,669 people's whole lives / a sample of nights."** | Each thread is one real diary day from one anonymous respondent — a complete 1,440 minutes, one day, not a person's habit. | **Mild.** Pull-a-thread should read as *a day*, never as *a person's typical day*. |
| **"Midday America is chaos — everyone is off doing their own thing."** | **No,** and this one gets through. 25.8 % share one activity, and the working slice runs 65–86 % on one activity through its own afternoon. The number is a modal **maximum**, not a dispersion measure: a low maximum is equally consistent with the country splitting into a few large blocks — which is what Job 2 shows it does. **Noon is stratified, not scattered.** | **Yes, passively.** The exploration layer (C7/C8) is what shows the blocks, and it must be discoverable without instruction. Any text-only surface must say *"the most common single activity"* rather than implying no two days are alike. |

**Three things the site is now forbidden to print:**

- **"3:27 a.m."** or **"12:02 p.m."** — argmax minutes, unstable across samples (C5), on an axis where
  85.3 % of reported episode starts land on a multiple of five minutes.
- **Any error bar, interval, or ± on any number** — none exists in this build (P2, L4).
- **"96.5 % were asleep."** 96.5 % is the **personal care** major; asleep at the same hour is
  **96.0 %**. Either number may be printed. They may not be swapped.

**The standing replacement sentence.** Wherever the claim travels *without the picture* — registry
entry, OG alt text, newsletter, LinkedIn — the headline alone overstates, because "Nobody's" reads as
dispersion and the statistic is a maximum. Use this instead, verbatim:

> **At 3 a.m., the most common single activity holds 96.5 % of American civilians 15 and over living
> in households — 96.0 % of them asleep. At noon, the most common single activity holds 25.8 %.
> American Time Use Survey 2024 · 7,669 diary days · each on its own local clock.**

("civilians … living in households" is not pedantry: S9's rejected column bars copy that implies all
US residents, all ages, or includes the institutionalized and active-duty military.)

---

## The adversarial language pass

Run 2026-08-10 in a fresh context on a narrow manifest — this record, the curve, and the ATUS
provenance record only; never the exploration transcript and never the rejected candidates. **This
is an information firewall, and it is honestly weaker than an incentive-independent stranger. It is
not peer review.**

Full findings and dispositions: [`adversarial-pass.md`](adversarial-pass.md).

**Verdict: ship with named fixes. Nothing reopened the headline; every blocking fix was in this
record, not the copy.** Eleven findings, all accepted, in three groups:

- **Two causal-language leaks D1 passed over** — a bare `because` (the lint scanned for `because of`)
  and "coordinated by work" hidden in a passive. Both were in this file, in bold, and ticket 09
  inherits this file verbatim. Fixed in Job 2's findings 2 and 3.
- **One real framing defect**: `braid_gap_pp` is a modal **maximum**, so "Nobody's" asserts a
  dispersion the statistic cannot carry. Safe over the mark, which draws the blocks; unsafe in text.
  → C11 and the new misreading row.
- **Six record gaps**, four of which were converted from *noted* to *measured*: the personal-care /
  asleep swap ban, time-heaping (85.3 % of episode starts on a multiple of five), the universe
  exclusion's two-way direction, the 4 a.m. wrap, and the mismatched interval. → limitations (i)–(k),
  C10, and a matched hour-level uncertainty floor.

---

## Decisions that bind later stages

Format mirrors `rigor decide`: decided · why · rejected.

| # | Decided | Why | Rejected |
|---|---|---|---|
| **C1** | **The headline copy is frozen as written: "Everyone's 3 a.m. looks the same. Nobody's noon does."** Both words survive the gate unchanged | "3 a.m." costs 0.21 pp against a 70.8 pp effect and names a 120-minute plateau the data actually has; "noon" is within 0.11 pp of the measured trough | Moving the word to "3:30 a.m."; adding a number to the headline; dropping the possessive |
| **C2** | **The frozen number is the HOUR, at the median specification: 96.5 % → 25.8 %, a 70.8 pp gap, 2024, weighted, 12 published majors** | It is the median specification of a 60-spec curve, and it is the resolution the words already assert. Citing 72.3 pp would be citing the best cell | 96.2 % / 24.3 % at 3:27 a.m. and 12:02 p.m.; any minute-level number in public copy |
| **C3** | **The mark must ship a fine activity partition — 12 published majors, or 13 with sleep split out. A coarse scale is forbidden** | Under a three-way necessary/obligated/free scale the loosest hour moves to 6 p.m. at 39.1 % and the headline becomes false. Trough stability is 40/40 on fine partitions, 0/20 on the coarse one | A 3–5 colour "simplified" palette; any design simplification that merges majors before the modal share is taken |
| **C4** | **Equal ink per thread is acceptable at the two minutes the claim names, and only there.** Error is +0.09 pp at 3 a.m. and −0.93 pp at noon — but reaches **9.09 pp at 9:48 a.m.** | Ticket 04's R5 warning is real but time-dependent: it binds hardest in the morning ramp, not at the claim's own moments. Systematic PPS-with-replacement on `TUFINLWGT` at k = 7,669 reproduces the weighted truth to ± 0.3 pp across 8 seeds and removes the problem everywhere | Drawing all 7,669 equal-ink and describing the picture as weighted; ignoring R5 because the headline minutes happen to be safe |
| **C5** | **The register is associational, permanently. No causal verb about work, remote work, or scheduling may appear in copy, OG card, registry entry or writeup** | ATUS is cross-sectional; school, daylight, business hours and shift structure are unseparated. No unlock condition exists | "The workday is why the country coordinates"; "remote work frayed the middle of the day" |
| **C6** | **The claim is tagged exploratory and must be written that way** | Found by mining ticket 05's candidate families, not predicted. Writing it in a predicted voice is HARKing | Any framing of the form "as expected" / "the data confirms" |
| **C7** | **"Worked that day" tightens noon to 57.4 % (65.4 % at 6 h+), and every worker slice troughs at 6:00–6:22 p.m., not noon.** This is the exploration layer's strongest payoff and it is now measured | 2.20× a rotation null at 2 p.m., so it is coordination and not the filter or arithmetic. Answers the map's open question outright | Leaving it unmeasured; describing it as work *causing* the synchrony (C5) |
| **C8** | **In a 2024-only build the drawable filter set is: worked/didn't (2,489/5,180), worked 6 h+ (1,757), sex (3,563/4,106), weekday/weekend (3,837/3,832), 65+ (2,678), 25–54 (3,227), children <18 (2,107/5,562). School enrolment (466) is out** | L6's 844 line applied to 2024 alone, which is a smaller pool than ticket 06's pooled counts | Offering school enrolment as a drawn group; re-pooling years to rescue a filter (L3 forbids it) |
| **C9** | **The claim record is the correction hook.** Any number the site prints traces to this file; corrections are dated amendments at its bottom, shipped in the same commit as the copy change | Field 9 of the record; corrections are routine, not a crisis | Correcting copy without amending the record |
| **C10** | **The source line is mandatory and carries the no-simultaneity work.** One line, one place: *"7,669 real diary days · American Time Use Survey 2024 · each on its own local clock, 4 a.m. to 4 a.m."* | S11 already requires BLS attribution, so this is not a new surface — it is the words that already had to exist, doing a second job. The possessive alone is too thin a defence for the project's largest exposure (S8), because a general reader does not read an apostrophe-s as a time-zone disclaimer | Leaving the S8 defence entirely to the headline's grammar; an unattributed mark; a "right now" or live-clock framing |
| **C11** | **"Nobody's" is safe over the mark and unsafe without it.** Any surface that quotes the claim without the picture uses the standing replacement sentence, which says *"the most common single activity holds…"* | The estimand is a modal **maximum**, not a dispersion measure: 25.8 % is equally consistent with a scattered country and with a few large blocks, and Job 2 shows it is the blocks. The picture corrects this by drawing the blocks; text alone does not | Quoting the bare headline on the OG card, the registry entry, or a writeup; "no two days are alike" phrasing anywhere |

---

## What this hands ticket 08 / 09

- **Ticket 08 (reference wall)** is unblocked and unconstrained by this ticket — nothing here shapes
  the visual language.
- **Ticket 09 (the Fable brief)** inherits six hard constraints it must carry verbatim: **C3** (fine
  activity partition, or the headline is false), **C4** (equal ink is fine at the claim's minutes but
  wrong by 9 pp mid-morning — PPS if any decimation happens), **C8**'s filter list, **C10** (the
  mandatory source line, which is the S8 defence), **C11** (the exploration layer must be
  discoverable without instruction, because it is what shows noon is stratified rather than
  scattered), and the **no-simultaneity** framing ban from *What the claim cannot support*.
  Everything else about the mark remains Fable's under thin-anchor.
- **Ticket 10 (pick and deepen)** inherits **C7**: the evening fray is a designed payoff now, not a
  hypothesis.
