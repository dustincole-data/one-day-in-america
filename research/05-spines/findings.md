# Candidate spines — the ranked shortlist, with numbers

Ticket 05 · computed 2026-08-09 · claude (opus)

Builds on the ticket-03 extract ([`../03-extract/findings.md`](../03-extract/findings.md)) and the
ticket-04 render budget ([`../04-render-budget/findings.md`](../04-render-budget/findings.md)).
Decisions **S1–S12**, **E1–E7** and **R1–R7** were the input contract; none was re-decided here.

Harness: [`spike/spines/mine.mjs`](../../spike/spines) — `node spike/spines/mine.mjs --json`, ~20 s,
full transcript at [`spike/spines/results/report.txt`](../../spike/spines/results/report.txt) and
machine-readable numbers at `spike/spines/results/spines.json`. Every estimate is weighted on
`TUFINLWGT` using the §7.4 estimators mirrored from `scripts/atus/estimate.ts` (S3).

**Four candidates survive, one is killed, one runner-up is kept alive.** The winner is not picked
here — that is ticket 06 and it is Dustin's call.

---

## The two things that decide the ranking

**1. Every candidate splits on one cost: does it assert a *change*?** S12 says a 2019-vs-2023/24
change claim cannot be printed until the replicate-weight files are acquired and standard errors
computed. Candidate 1 asserts a change. Candidates 2, 3 and 4 assert the shape of one day, and are
free of that cost entirely. That is not a tiebreaker, it is the largest single difference in what
each spine costs to ship.

**2. Renderability is a hard screen, and its number is 844.** Ticket 04 fixed the traceable-thread
ceiling at 844 on a phone (3 device px each). A candidate whose smallest comparison cell holds fewer
sample days than that cannot be drawn one-thread-one-person at full contrast — it has to be
pre-aggregated, which changes the mark.

| cell the mark would have to draw | sample days | |
|---|---:|---|
| 2024 everyone | 7,669 | above |
| pooled 2023+24 women / men | 8,662 / 7,555 | above |
| 2019 / 2024 workers | 3,399 / 2,489 | above |
| 2019 / 2024 commuters | 2,537 / 1,627 | above |
| 2024 workers, worked entirely at home | 725 | **below** |
| pooled, worked + child under 6 | 761 | **below** |
| pooled, worked + child under 6, women | 343 | **below** |
| pooled, single parent who worked | 443 | **below** |

**On the standard errors below.** Every `±` in this record is a linearized SE for a weighted mean
under SRS-with-weights. It captures the weighting design effect but not stratification or
replication, so it is an **approximate floor, not the BLS replicate-weight SE** (§7.5). It is here to
rank candidates by survivability, not to be printed. S12 still binds ticket 07.

**Sanity, before anything downstream.** The harness reproduces ticket 03's published handoff numbers
exactly — worked 44.5 / 43.8 / 42.5 %, work-at-home among workers 26.0 / 36.5 / 33.9 %, commuted
35.5 / 30.7 / 30.0 %, commute among commuters 47.1 / 47.1 / 49.2 min — and independently lands on
BLS's own printed Socializing-and-communicating figures (0.64 h for 2019, 0.59 h for 2024).

---

## 1 · The workday did not move. It moved indoors.

The strongest *surprising* candidate, and the only one that asserts a change.

The shape of the American working day is almost exactly where it was in 2019. The peak — the minute
of the day at which the largest share of the 15+ population is doing paid work — moved ten minutes,
and barely changed height:

| | peak working minute | share of the 15+ population at that minute | share of those workers who were **at home** |
|---|---|---:|---:|
| 2019 | 10:45 a.m. | 32.5 % | 9.7 % |
| 2023 | 10:58 a.m. | 33.9 % | 22.0 % |
| 2024 | 10:55 a.m. | 32.2 % | **22.4 %** |

Population-wide, across the whole day rather than at one minute:

| | share of **every paid-work minute in America** done at home |
|---|---:|
| 2019 | 11.6 % |
| 2023 | 23.6 % |
| 2024 | **22.6 %** |

And the commute it displaced:

| | commuted | commuters/day | minutes among commuters | commute min/person/day |
|---|---:|---:|---:|---:|
| 2019 | 35.5 % | 93.6 M | 47.1 | 16.74 |
| 2024 | 30.0 % | **81.8 M** | **49.3** | 14.75 |

**11.8 million fewer people commute on an average day — while the population it is drawn from grew
from 263.4 M to 272.9 M.** And the ones still doing it commute *longer*, not shorter.

The decomposition says which term actually moved: `worked × commuted-if-worked × minutes`, 44.5 % ×
79.7 % × 47.1 in 2019 against 42.5 % × **70.4 %** × 49.3 in 2024. Labour-force participation is not
the story; conditional commuting is.

**Where the recovered minutes went — the 1440 ledger.** The day is a fixed 1440 minutes, so the
population-average deltas sum to exactly zero. This is the ticket's original suspicion, tested:

| major | 2019 | 2023 | 2024 | Δ 24−19 | ± floor |
|---|---:|---:|---:|---:|---:|
| household | 107.1 | 114.9 | 120.8 | **+13.8** | 2.7 |
| personal care (incl. sleep) | 577.4 | 590.2 | 587.8 | **+10.4** | 3.0 |
| eating and drinking | 70.9 | 71.9 | 74.2 | +3.3 | 1.2 |
| care of household members | 29.2 | 30.2 | 30.6 | +1.4 | 1.6 |
| phone, mail, e-mail | 9.4 | 9.8 | 10.7 | +1.3 | 0.7 |
| org., civic, religious | 18.0 | 14.5 | 18.3 | +0.2 | 1.3 |
| care of nonhousehold members | 11.2 | 10.3 | 10.0 | −1.2 | 0.9 |
| education | 27.5 | 23.5 | 25.2 | −2.3 | 3.2 |
| other, n.e.c. | 16.5 | 12.4 | 12.5 | −4.0 | 1.0 |
| purchasing | 44.7 | 39.4 | 40.5 | −4.2 | 1.5 |
| **leisure and sports** | 311.1 | 309.1 | 303.9 | **−7.2** | 4.6 |
| **work** | 216.8 | 213.8 | 205.5 | **−11.3** | 5.9 |

**The suspicion is confirmed in direction and must be stated carefully in size.** The time did not go
to leisure — leisure is the *second-largest faller*. It went to housework and to personal care. But
read the floors: household (+13.8 ± 2.7) and personal care (+10.4 ± 3.0) are several floors wide;
**leisure (−7.2 ± 4.6) is not.** The honest claim is "leisure did not gain", not "leisure fell".

### The objection this had to survive

*"Just compare people who worked at home to people who commuted."* It does not work. In 2024, workers
who worked entirely at home logged 174 minutes less paid work than commuters — because "worked
entirely at home" collects anyone who answered thirty minutes of e-mail on a Saturday. Restricting
both sides to a real working day (≥ 6 h of paid work, n = 358 vs 1,303) shrinks it but does not clear
it: still 76.6 ± 6.7 minutes apart, with home workers keeping +13.4 household, +12.0 care, +26.4
leisure, +24.4 sleep.

**Working from home and working fewer hours are correlated by construction in this data, so the
group-vs-group form of this candidate never deconfounds.** It has to be told cross-year and
population-wide — which is exactly the form S12 taxes.

**Renderability.** Good, with a real cost: the mark must hold **two states**, because the claim is a
before/after. Every cell is above 844 (2019 workers 3,399; 2024 workers 2,489). The beautiful version
is that the silhouette barely changes while its colour does — same curve, recoloured — which is a
mark that must be legible twice and animate between. That is more than a static braid has to do, and
R3's overdraw budget applies to whichever state costs more.

**Cost to ship.** Highest. Replicate weights (S12) before any number is printed.

---

## 2 · At 3 a.m. America is one country. By noon it is a hundred.

The cheapest claim to freeze, the best renderability, and the least surprising.

For each minute of the diary day, the weighted share of the population doing the single most common
published major:

| 2024 | | |
|---|---|---:|
| most agreement | 3:34 a.m. | **96.6 %** doing personal care |
| — sleep alone | 3:27 a.m. | **96.2 %** asleep |
| least agreement | 12:02 p.m. | **24.3 %** working |

**A 4.0× swing between the tightest and loosest minute of the day.** The same measure by hour, 2024
(normalized entropy across the 12 majors in brackets): 3 a.m. 96.4 % [0.086] · 6 a.m. 75.1 % [0.411]
· 8 a.m. 32.4 % [0.761] · **noon 24.4 % [0.815]** · 4 p.m. 30.8 % [0.776] · 8 p.m. 51.8 % [0.684] ·
11 p.m. 75.5 % [0.342].

It is a property of the American day, not of a year — peak and trough are stable across all three:

| | peak | trough |
|---|---|---|
| 2019 | 96.2 % at 2:55 a.m. | 24.5 % at 12:05 p.m. |
| 2023 | 96.4 % at 3:11 a.m. | 24.7 % at 12:05 p.m. |
| 2024 | 96.6 % at 3:34 a.m. | 24.3 % at 12:02 p.m. |

### The objection this had to survive

*"That is just 'people sleep at night'."* Half true, and the fix is to test the waking half alone.
In the 840 minutes from 8 a.m. to 10 p.m.: the most common single activity in America holds **under a
third of the country for 522 of them (62.1 %)**, and under 40 % for 630 (75.0 %). The waking day
never gets tighter than 55.2 % (8:57 p.m., leisure).

The weaker version of the same idea — how many of the 12 majors it takes to cover half the country —
does not carry: it runs 1 at 6 a.m. → 3 at 10 a.m.–noon → 1 at 8 p.m. A 1→3→1 range is not a
gut punch. **The modal-share curve is the number that works; the coverage count is not.**

**S8 binds hard here.** This is local time on each respondent's own diary day. The mark may show a
time-of-day axis; the copy may never say "at 3 a.m., 96 % of Americans *were* asleep" as a moment.
"The American day" is sayable; "America at 3 a.m." is not.

**Renderability.** The best of the five, and the only one where the claim *is* the mark: the braid is
tight at night and frays through the day, which is literally the measured quantity. Both the
one-year (7,669) and three-year (25,652) thread sets are far above 844.

The number that settles it: ticket 04 (R5) puts worst-case PPS sampling error at ~5 pp near
1,000 threads. **The claim's effect size is 72 pp** — 96.2 % against 24.3 %. Fourteen times the worst
error at the thread count the mark actually needs. No other candidate has that margin.

**Cost to ship.** Lowest. One-day shape only, so S12 never triggers and the replicate weights are
never needed.

---

## 3 · Men get 48 more minutes of leisure a day. Half of it is television.

The second-shift candidate, restated to the part that survives.

On the published "Leisure and sports" major — gate-proven in ticket 03, no construct involved,
2023+2024 pooled:

| | men | women | gap | ± floor |
|---|---:|---:|---:|---:|
| everyone | 331.3 | 282.8 | **48.5** | 4.8 |
| employed full time, 25–54 | 250.1 | 212.3 | 37.8 | 6.6 |
| worked on the diary day + children < 18 | 178.8 | 136.0 | 42.8 | 7.4 |

It survives every condition tried — age, employment status, full-time, parenthood, and a spouse who
is also employed. On the wider "free time" construct the same gap reads 36.4 ± 5.0 overall, 32.1 ±
6.9 for full-time 25–54, 39.7 ± 9.5 with children, and 26.2 ± 9.8 without.

**And then the complication, which is the interesting part: 24.8 of those minutes are television** —
roughly half the gap on the published major, and two-thirds of it on the construct. Among people not
in the labour force the gap is 90.5 ± 8.8 minutes and 64.6 of them are TV. The sentence "women get
less free time" is, in this data, substantially the sentence "men watch more television."

### The objection this had to survive — and one form that did not

The unpaid-labour framing partly fails. Population-wide, **total work (paid + unpaid) is statistically
indistinguishable between the sexes: 350.8 vs 356.0 minutes, a gap of 5.1 ± 5.7.** Women do 62.7 ± 3.5
more minutes of unpaid work and 57.6 ± 5.5 fewer minutes of paid work, and those very nearly cancel.

The "women work more in total" version only appears once the slice is narrowed to full-time working
parents (+30.6 ± 10.0) or full-time working parents with an employed spouse (+31.5 ± 11.5) — a real
finding, but a conditioned one, and cell sizes are 706 and 433 sample days.

**So: if a sex-gap spine is chosen, it is a leisure gap, not a total-work gap.** The total-work
version does not survive at the population level, and a spine that needs four conditions attached is
not a five-second spine.

**Renderability.** The weakest of the four, and this is the binding problem. Every cell is above 844
(7,555 men / 8,662 women), but **48 minutes is 3.3 % of a 1440-minute day** — nearly invisible as a
length difference between two whole-day braids. On the leisure block alone it is a 15 % difference,
which is showable, but that means the mark is a zoom or a difference form, not the whole day. A
truth that has to be magnified to be seen is a hard sell against a five-second brief.

**Cost to ship.** Low — within-year group contrast, no replicate weights.

---

## 4 · Six in ten working parents of small children get under three hours to themselves.

Free time, 2023+2024 pooled:

| group | sample days | free time | share with **under 3 h** | obligated |
|---|---:|---:|---:|---:|
| everyone | 16,217 | 5 h 46 m | 26.2 % | 7 h 12 m |
| worked on the diary day | 5,382 | 3 h 30 m | 44.5 % | 10 h 22 m |
| worked + children < 18 | 1,926 | 3 h 02 m | 54.0 % | 10 h 58 m |
| **worked + children < 6** | **761** | **2 h 39 m** | **61.0 %** | 11 h 25 m |
| worked + children < 6, women | 343 | 2 h 27 m | 63.3 % | 11 h 28 m |
| single parent who worked | 443 | 3 h 21 m | 48.5 % | 10 h 05 m |
| age 65+ | 5,668 | 7 h 56 m | 8.4 % | 4 h 46 m |
| did not work, no children | 8,325 | 8 h 06 m | 8.1 % | 4 h 11 m |

**A 5 h 27 m spread between the tightest and loosest group** — the largest gap any candidate here
produces. Whole-population free time is stable across years: 5 h 55 m (2019) → 5 h 46 m (2023) →
5 h 45 m (2024), 24 % of the day.

### The objection this had to survive

*"'Free time' is your invention, not a BLS category."* Correct, and it matters. The definition used
is the Ås four-way mapped onto the published majors — necessary = personal care + eating; obligated =
work + household + care (household and non) + purchasing + education; free = leisure and sports +
org/civic/religious + phone/mail/e-mail + other. Travel is already redistributed inside each major by
ticket 03, so the commute sits inside "obligated" with no extra term.

The saving grace: **88.7 % of "free time" is just the published Leisure-and-sports major** (306.5 of
345.5 minutes), so the construct can be dropped for the published category at almost no cost to the
number. It should be. **45.7 % of it is television**, which is the same complication candidate 3 hit.

**Renderability.** Split verdict. The headline percentage is robust to any sampling (ticket 04: a
single number survives every strategy at every k). But **the punch cell holds 761 sample days and the
women's cell 343 — both under 844**, so the group whose plight is the point cannot be drawn as
traceable individual threads. It must be pre-aggregated, or the mark must be a distribution rather
than a braid.

**Cost to ship.** Low, if restated on the published major.

---

## 5 · Rest inequality — killed

The effect is not there. Across 22 groups the entire spread of average sleep is **8 h 35 m to
9 h 51 m — 76 minutes**, and the gradient runs backwards from the story it would be told as:

| | sleep | < 6 h | < 7 h |
|---|---:|---:|---:|
| everyone | 9 h 03 m | 5.2 % | 12.4 % |
| no HS diploma | 9 h 35 m | 5.0 % | 10.1 % |
| bachelor's | 8 h 46 m | 4.8 % | 13.1 % |
| advanced degree | 8 h 46 m | 4.2 % | 11.5 % |
| employed full time | 8 h 42 m | 6.2 % | 15.2 % |
| **multiple jobs** | **8 h 35 m** | **9.7 %** | 17.6 % |
| youngest child < 1 | 8 h 41 m | 7.7 % | 16.8 % |
| unemployed | 9 h 51 m | 4.9 % | 7.9 % |

Less-educated Americans sleep *more*, because the education gradient here is employment wearing a
disguise. The one cell that points the right way — 9.7 % of people with multiple jobs sleeping under
six hours, against 5.2 % overall — rests on 868 sample days and is a difference of 4.5 points.

Also worth recording so it is not rediscovered: **ATUS sleep is diary sleep** — time in bed asleep or
trying to sleep — which is why it reads ~1.5 h above self-report surveys. That is a definition, not
an error, and any sleep spine would have spent its first sentence explaining it. Near-wordless is the
standing preference. **Killed.**

---

## Runner-up, kept alive: television against everything else

Not ranked, because it is the engine underneath candidates 3 and 4 rather than a separate truth — but
it is the single most lopsided thing in the extract, so it should not be lost:

- **TV: 2 h 38 m a day** · 73.2 % of people watched · 3 h 36 m among watchers.
- **45.7 % of all free time in America is television.**
- Socializing and communicating (published leaf): **0 h 35 m**, 29.6 % engaged. TV is **4.5×** it.
- **70.4 % of American days contain zero minutes of socializing.** 78.7 % contain zero exercise.
  78.2 % contain zero care for a household member. 56.8 % contain zero paid work. Only 4.0 % contain
  zero free time.
- Weekday vs weekend, honestly weighted (2/7, not the sample's 50/50): sleep 8 h 50 m → 9 h 37 m,
  free time 5 h 12 m → 7 h 08 m, obligated 8 h 02 m → 5 h 10 m.

---

## The ranking

| # | candidate | headline number | surprise | renderability | S12 cost |
|---|---|---|---|---|---|
| 1 | The workday moved indoors | 11.6 % → 22.6 % of work minutes at home; peak stays 10:45→10:55 a.m. at ~32 % | **highest** | good, but needs a two-state mark | **replicate weights** |
| 2 | The braid: 96 % → 24 % | 96.2 % asleep at 3:27 a.m.; 24.3 % at the loosest minute | lowest | **best** — the claim is the mark | none |
| 3 | The 48-minute leisure gap | 331.3 vs 282.8 min; 24.8 of it TV | medium | **weakest** — 3.3 % of the day | none |
| 4 | Working parents' three hours | 61.0 % of workers with a child under 6 get < 3 h | medium | headline yes, threads no (n = 761) | none |
| — | Rest inequality | 76-minute total spread | none | n/a | **killed** |

Candidates 1 and 2 are the two real contenders and they trade off against each other cleanly:
**1 is the more surprising truth and the more expensive one; 2 is the cheaper truth that the mark
can carry natively.** 3 and 4 are true and survivable but each has a specific defect — 3 cannot be
seen at whole-day scale, 4 cannot be drawn thread-per-person in the cell that matters.

Ticket 06 picks one. This ticket does not.

---

## Decisions that bind later stages

| # | Decided | Why | Rejected |
|---|---|---|---|
| P1 | Every candidate number is computed on the **gate-proven published majors** or on the E4-derived `WORK_MIN` / `COMMUTE_MIN` / `WORK_AT_HOME_MIN` columns | No new category definition is introduced, so ticket 03's 639-cell gate covers these numbers too | Inventing analysis categories that the gate does not reach |
| P2 | The `±` figures in this record are **linearized SRS-with-weights floors**, not BLS replicate-weight SEs, and are for ranking only | They capture the weighting design effect but not stratification or replication (§7.5) | Printing any of them as an error bar; treating them as satisfying S12 |
| P3 | The candidates split into **one cross-year claim (1) and three one-day claims (2, 3, 4)**. Choosing 1 buys the replicate-weight acquisition; choosing 2–4 does not | S12, stated as a cost rather than a footnote | Treating the replicate-weight work as a detail to sort out later |
| P4 | **The renderability screen is 844 sample days per drawn cell** (ticket 04's traceable-thread ceiling). Cells below it must be pre-aggregated or drawn as a distribution | A mark that claims "one thread is one person" cannot make that claim from 343 people | Judging candidates on truth alone |
| P5 | If a sex-gap spine is picked it is a **leisure gap, not a total-work gap** | Total paid + unpaid work is 350.8 vs 356.0, a gap of 5.1 ± 5.7 — it does not survive at the population level. Leisure is 48.5 ± 4.8 and survives every condition tried | "Women work more in total" as a headline — it needs four conditions attached before it appears |
| P6 | The **home-vs-commuter group contrast is not usable**; candidate 1 must be told cross-year and population-wide | Working from home and working fewer hours are correlated by construction — 76.6 ± 6.7 minutes apart even with both sides held to ≥ 6 h of work | A within-year home-vs-office comparison, which would have dodged S12 |
| P7 | **Rest inequality is killed** and does not return without new evidence | 76-minute total spread across 22 groups, and the education gradient runs backwards because it is employment in disguise | Keeping it on the shortlist as a fifth option |

---

## What this hands to the next tickets

- **Ticket 06 (lock the spine):** the ranking above, with the tradeoff stated in one line — candidate
  1 is the more surprising truth and carries the replicate-weight cost; candidate 2 is the cheaper
  truth the mark carries natively. Both are live. 3 and 4 each have a named defect to put to Dustin.
- **Ticket 07 (freeze the claim):** if 1 is picked, the replicate-weight files are the first task and
  the number to error-bar is the at-home share of work minutes (11.6 % → 22.6 %). If 2 is picked, S12
  never triggers and the claim to freeze is 96.2 % / 24.3 %, with S8 language constraints. Whichever
  is picked, S9's universe wording binds the copy.
- **Tickets 08/09 (reference wall, Fable brief):** the chosen spine's mark shape is already
  constrained — 1 needs a two-state form, 2 is a braid at ≥ 844 threads with 14× margin over PPS
  error, 3 needs a zoom or difference form, 4 needs a distribution rather than individual threads.
- **The exploration layer** (map, "Not yet specified"): the group cells that are too thin to draw as
  threads — child under 6, single parents, multiple-job holders — are exactly the filters the
  exploration layer would offer. They can still be *stated* as numbers; they cannot be *drawn* as
  traceable individuals. That constraint belongs in the Fable brief.
