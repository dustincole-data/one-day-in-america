# 06 · Lock the spine

Type: grilling
Status: **resolved 2026-08-10** · claude (opus) — Dustin ruled, four explicit picks
Blocked by: 05

## Resolution

**The spine is candidate 2 — the braid.** Ticket 05's other three are dead for this build. Four
rulings, each an explicit pick, not a "sure".

### The four answers ticket 06 asked for

**The truth, in one sentence:**

> **Everyone's 3 a.m. looks the same. Nobody's noon does.**

Nine words, no numbers, no chart literacy. The possessive is load-bearing — it places the claim on
each respondent's own local clock, which is exactly what the data is, so **S8 is satisfied without a
footnote**. "America at 3 a.m." as a single nationwide instant stays forbidden.

**The comparison that carries it:** within one day, the **tightest minute against the loosest minute**.
Not pre/after, not group vs group. 2024: **96.2 % asleep at 3:27 a.m.** (96.6 % on personal care at
3:34 a.m.) against **24.3 % working at 12:02 p.m.** — a 4.0× swing, and a **72 pp effect against
ticket 04's ~5 pp worst-case PPS error, a 14× margin**.

**What the viewer sees before touching anything:** a rope of ~7,669 threads, one per real diary day,
running 4 a.m. → 4 a.m., each thread coloured by what that person is doing minute by minute. At the
night end it is one solid block of colour. Through the middle of the day it frays into everything at
once. Nothing else on screen. Form, orientation, and whether it animates on load are **Fable's call**
— thin-anchor holds.

**What exploration is for:** the two questions the punch creates — *who is in the frayed part* and
*which one is me*. Filter the rope by group and it re-forms from just those people; tap any single
thread to follow one anonymous person's 1,440 minutes end to end.

### Why the other three died

- **Candidate 1 (the workday moved indoors)** was the real contender and lost on the wordless test.
  Its claim is a sub-distinction *inside* the work colour — invisible under colour-by-activity, so it
  needs a legend, a toggle, and a re-encode. Its most surprising component ("the peak didn't move")
  is a null result, which cannot punch wordlessly. **Not deferred, not a second beat — dropped.**
- **Candidate 3 (48-min leisure gap)** — 3.3 % of a 1440-minute day. Needs a zoom to be seen at all.
- **Candidate 4 (working parents' three hours)** — punch cell is 761 sample days, under the 844 line.

### What this ruling closes elsewhere

Two of the map's open questions are now settled **by consequence**, not separately:

- **"Whether 2021–22 transition frames earn their weight"** — no. No year is drawn but 2024.
- **"Whether 2025 appears at all"** (was marked *Dustin's ruling needed*) — no. Same reason. The
  2025 response-rate and shutdown-hole problems never have to be adjudicated.

And **S12 is off the board for this build.** No change is asserted, so the replicate-weight files are
never acquired and no error bars are needed. That was the single largest cost on the table.

### Open items this ruling creates

- **The copy says "3 a.m." but the measured peak is 3:27 a.m.** The share asleep at 3:00 a.m. sharp
  has not been computed. Ticket 07 must verify the rounded word is defensible or move it.
- **"Noon" is clean** — the trough is 12:02 p.m.
- **The allowed filter set needs sample-size verification** before it is offered. Cleared: sex,
  worked/didn't, weekday/weekend, 65+, children under 18. **Fails 844**: child under 6 (761), single
  parents who worked (443), women with a child under 6 (343) — statable as numbers, not drawable as
  people.
- **Unverified and worth computing:** filtering to "worked that day" may *tighten* noon rather than
  fray it — some groups may never unravel. If true it is the strongest payoff in the exploration
  layer. Nobody has measured it.
- **Pull-a-thread is per-thread hit testing on touch** — first-tap-is-hover and pointercancel traps
  apply. Belongs in the Fable brief as a constraint, not a design.

## Decisions that bind later stages

| # | Decided | Why | Rejected |
|---|---|---|---|
| L1 | **The spine is the braid**: the tightest minute of the American day against the loosest, drawn as one thread per real diary day | The claim *is* the mark — 72 pp effect at 14× the worst PPS error, and it reads with no words and no legend | Candidate 1 (needs a legend, a toggle and a re-encode), 3 (3.3 % of a day), 4 (n = 761 < 844) |
| L2 | **Headline copy: "Everyone's 3 a.m. looks the same. Nobody's noon does."** | The possessive binds the claim to each respondent's own local clock, satisfying S8 with no footnote | "At 3 a.m. America is one country" — reads as one nationwide instant, the exact claim S8 forbids |
| L3 | **2024 only is drawn.** 7,669 diary days. 2019 and 2023 stay in the extract, unused and undrawn | Under colour-by-activity the year deltas are ~1 % of the day (work −11.3, household +13.8 of 1440) — a year toggle would be an anticlimax. Pooling adds no visible density either: 7,669 × 3 device px is already ~23,000 px against a ~1,200 px phone, so decimation binds at any year count | A 2019 toggle; 2023+2024 pooled; 2021–22 frames; 2025 |
| L4 | **S12 never triggers for this build.** No replicate weights, no error bars | The spine asserts the shape of one day, not a change | Buying the replicate-weight work "just in case" |
| L5 | **Exploration = filter the rope + pull one thread.** Filters re-form the rope from a group; a tap follows one anonymous person's 1,440 minutes | The punch creates exactly two questions — who frays, and which one is me. Pull-a-thread also *proves* the mark's premise that one thread is one person | Scrub-the-clock as the interaction; filter-only |
| L6 | **P4's 844 line governs which filters exist.** A group below it may be stated as a number, never drawn as traceable threads | A mark claiming one-thread-one-person cannot make that claim from 343 people | Offering the most interesting slices (child under 6, single parents) as drawn groups |
| L7 | **Form, orientation, animation and whether 3D is used remain Fable's** | Thin-anchor: this ticket fixes the truth and the constraints, not the visual language | Specifying the mark's geometry here |

## Question

Which single truth does this site assert in its first five seconds?

Put the ticket-05 shortlist to Dustin with the real numbers and grill toward one choice. Settle:

- **The truth**, in one sentence a stranger understands with no chart literacy.
- **The comparison that carries it** — pre vs after, group vs group, or the whole braid vs a slice.
- **What the viewer sees before touching anything**, in plain words. If that can't be stated
  without a paragraph, the spine is wrong.
- **What the exploration layer is then FOR** — what question a viewer has after the punch lands.

The spine constrains everything downstream: the extract that ships, the reference wall, the Fable
brief, the whole build. Do not leave this ticket with two candidates alive.

"Sure" is not a ruling — get an explicit pick.
