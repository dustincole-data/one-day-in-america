# One Day in America — Wayfinder Map

Label: `wayfinder:map` · Charted 2026-08-08

## Destination

**One Day in America live on a dustincoledata subdomain**: a near-wordless, ATUS-grounded data-art
site that lands one true gut-punch in the first five seconds and rewards exploration after it.
Beautiful and fully functional on phone *and* desktop. Visual design invented by Fable.
Portfolio-grade or not shipped — the "$10,000 site" bar.

Done = live, verified on a real phone, added to the dustincoledata project registry.

## Notes

**Domain:** US time-use data art. Source = BLS American Time Use Survey (ATUS), minute-level
respondent-day microdata. Project #1 of the three-project round from the 2026-08-08 ideas session.

**Locked at charting (2026-08-08):**

- **Destination includes execution.** This map does not stop at a spec — it carries through to a
  shipped site. (Overrides Wayfinder's plan-don't-do default.)
- **One spine + explore on top.** Default view asserts a single wordless truth; filters let the
  viewer mine it afterward. Not a pure atlas, not an it's-about-you quiz.
- **Rigor gate is in scope.** `rigor-source` on ATUS before any code; `rigor-claim` on the one
  number the spine asserts. A provably-wrong headline on a public portfolio piece is the failure
  mode being bought out.
- **Fable owns the visual design — thin anchor only.** Fable receives: the spine, the hard
  constraints, the real data shape, the render budget, and a reference wall. It receives **no
  house style, no template, and no design skill**. It invents the mark and the visual language.
  *Impeccable / Intent must not shape this design.* (They may serve as a late mobile/a11y/perf QA
  pass only, if wanted.) The reference wall still exists because anchor-before-mocks is a paid-for
  lesson — the anchor is references + positioning, not a prescribed form.
- **Data scope: years kept SEPARABLE, not pooled.** 2019 = before. 2023+2024 = the day that never
  went back. 2020 excluded with an honest note. 2021–22 optional transition frames. Full-span
  2003–2024 ruled out (see Out of scope).
  *Ticket 02 settled the 2020 note (2026-08-08):* diary days 2020-03-18→05-09 do not exist, the year
  covers **313 days** on its own weight `TU20FWGT`, and BLS states annual 2020 estimates are
  impossible. Two corrections to the charting assumption — it is **not** a separately-named file
  (normal file names, special weight variable), and 2020 is **not** unusable: BLS built `TU20FWGT`
  for 2019 as well, expressly to support a matched partial-year 2019-vs-2020 comparison. The
  exclusion stands; the honest note is now accurate.

**Standing preferences for this effort:**

- **Near-wordless.** Show, don't tell. Every word must fight to exist. Copy that does exist follows
  the never-corny rule: flat declarative, no parallel triads, no feel-something clauses.
- **Mobile parity is a hard gate**, not a nice-to-have. A desktop-only wow is a failure.
- **WebGL/3D only where depth encodes data.** This project plausibly earns it (minute × activity ×
  density is genuinely three axes) — but that is Fable's call, not a requirement. 3D purely to be
  3D reads as trying too hard.
- **Flow, not density.** The mark carries proportional volume itself. Never a table, never a legend
  standing in for the mark.
- **Authorized resources:** Chrome MCP for reference hunting, Pinterest/Awwwards, gpt-image-1 image
  generation (spend explicitly authorized for this project). No other paid API without asking.

**Lane discipline:** The Job Autopsy map runs in other sessions concurrently. Do not read, touch,
or reconcile against it. Separate effort, separate repo, separate map.

**Session rule:** one ticket per session. Claim before working.

## Decisions so far

<!-- one line per closed ticket: gist + link -->

- **02 · ATUS interrogated, provenance recorded.** Lexicon comparability closed clean (activity codes
  unchanged since 2013; only 2019→2025 change is a 2023→2024 rename, one-to-one). Weights:
  `TUFINLWGT`, person-days, same method 2006–19 and 2021–present → 2019/2023/2024 directly
  comparable. Universe: civilian, noninstitutional, **15+**, households, 50 states + DC. Diary day
  runs **4 a.m.→4 a.m.**. **No time-zone convention documented → no simultaneity claim.** Public
  domain, but the BLS emblem is trademarked. 12 decisions bind tickets 03–07.
  → [ticket 02](issues/02-atus-source-interrogation.md) ·
  [findings](../../../research/02-atus-source/findings.md)

## Not yet specified

- **Implementation breakdown.** Cannot be sliced until Fable's design lands. Expect: data bake,
  desktop build, phone build, perf hardening, deploy verify, project card.
- **The exploration layer.** What filters exist (parents / renters / night shift / remote / age),
  how deep they go, and whether they are a control surface or something you brush through the mark.
  Depends on the spine and on Fable's form.
- **Whether 3D is used at all**, and if so what depth encodes. Fable's call under thin-anchor.
- **The interaction grammar on touch** — first-tap-is-hover and pointercancel traps apply; can't be
  designed before the mark exists.
- **Launch surface:** OG card, subdomain DNS, registry entry, any Data Nerve / LinkedIn writeup.
- **Whether 2021–22 transition frames earn their weight**, once the spine is picked.
- **Whether 2025 appears at all.** Ticket 02 found ATUS **2025 exists** (released 2026-06-25) — the
  map was charted assuming 2024 was latest. But 2025 has a 43-day hole (2025-09-30→11-11, Oct 2025
  shutdown), Q4 weights that were **not** adjusted for it, a 25.7% response rate, and a BLS statement
  that the effect "is not possible to quantify." Recommendation: keep **2023+2024** as the "after"
  frame; 2025 may appear as a later frame with an honest note, but must not carry the headline.
  **Dustin's ruling needed.**

## Out of scope

- **Full-span 2003–2024 ATUS.** Ruled out at charting: multi-year weighting trap, activity-lexicon
  revisions across 20 years, much larger payload — cost not justified by the added gasp. Returns
  only if the destination is redrawn.
- **The other two projects in the round** — *What Actually Kills You* (#2) and *The Job Autopsy*
  (#3). Separate efforts, separate maps.
- **Native app, user accounts, saved state, print/poster export.** Web only, stateless.
