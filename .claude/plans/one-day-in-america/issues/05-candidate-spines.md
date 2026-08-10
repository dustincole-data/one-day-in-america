# 05 · Mine the data for candidate spines

Type: research
Status: **resolved 2026-08-09** · claude (opus)
Blocked by: 03

## Resolution

**Four survive, one killed, one runner-up kept.** Full record with every number, every objection test
and decisions P1–P7 in [research/05-spines/findings.md](../../../../research/05-spines/findings.md);
reproduce with `node spike/spines/mine.mjs --json`.

Ranked, with the renderability verdict that ticket 05 asked for:

1. **The workday did not move — it moved indoors.** Peak working minute holds at 10:45 → 10:55 a.m.
   and ~32 % of the 15+ population, while the share of *every paid-work minute in America* done at
   home goes **11.6 % → 22.6 %**. 11.8 M fewer commuters a day out of a population that grew, and the
   ones still commuting go **47.1 → 49.3 min**. The 1440 ledger confirms the map's suspicion: the
   recovered time went to housework (+13.8 ± 2.7) and personal care (+10.4 ± 3.0), **not** leisure —
   though "leisure fell" (−7.2 ± 4.6) is not itself survivable, only "leisure did not gain".
   *Render:* good, but the mark must hold two states. *Cost:* the only candidate that triggers S12.
2. **At 3 a.m. America is one country; by noon it is a hundred.** 96.2 % asleep at 3:27 a.m. against
   24.3 % doing the single most common thing at 12:02 p.m. — a 4.0× swing, stable across all three
   years. Survives the "that's just sleep" objection: in the 840 waking minutes the most common
   activity holds under a third of the country for **522 of them**. *Render:* **best** — the claim is
   the mark, and its 72-pp effect is 14× the worst PPS error at the thread count needed. *Cost:* none.
3. **Men get 48.5 ± 4.8 more minutes of leisure a day — and 24.8 of them are television.** Survives
   age, employment, full-time and parenthood conditioning. But the unpaid-labour framing fails:
   **total paid + unpaid work is 350.8 vs 356.0, a gap of 5.1 ± 5.7.** *Render:* weakest — 48 min is
   3.3 % of the day, so it needs a zoom or difference form, not a whole-day braid.
4. **61.0 % of people who worked and have a child under 6 got under three hours of free time**, against
   8.4 % of over-65s — a 5 h 27 m spread. *Render:* headline robust, but the punch cell is 761 sample
   days and the women's cell 343 — both under the 844 traceable-thread line.
5. **Rest inequality — killed.** 76-minute total spread across 22 groups and the education gradient
   runs backwards (employment in disguise).

Kept alive but unranked: **television**. 45.7 % of all American free time, 4.5× socializing, and
**70.4 % of American days contain zero minutes of socializing.**

Winner not picked — that is ticket 06.

## Question

What are the three-to-five *true* things in this data worth building a whole site around?

Not brainstorming — computing. Using the validated extract, find the candidate gut-punches and
attach the real weighted number to each. Known starting candidates, none privileged:

- **The vanished commute** — 2019 vs 2023–24. Where did the recovered minutes go? (Suspicion: not
  to leisure.) This is the reason the years were kept separable.
- **The second shift** — unpaid caregiving and household work, by sex, among people who both work.
- **Sleep and rest inequality** — who gets rest, by income proxy / shift / caregiving load.
- **Time poverty** — the share of the day nobody chose: work + commute + care + chores.
- Anything the data itself surfaces that beats these.

For each: the weighted number, the population it applies to, how big the effect actually is, and
whether it survives an obvious objection. Kill the ones that don't.

**Also judge each on renderability** — a truth the braided-thread mark cannot show is not a spine
for this site, however true.

Output a ranked shortlist with numbers. Do not pick the winner — that is ticket 06, and it is
Dustin's call.
