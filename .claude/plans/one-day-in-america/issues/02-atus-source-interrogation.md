# 02 · Interrogate ATUS before any code touches it

Type: research
Status: **resolved 2026-08-08** · claude (opus)
Blocked by: —

## Resolution

Provenance record: [research/02-atus-source/findings.md](../../../../research/02-atus-source/findings.md)

Every question below is answered there. Headlines:

- **Files/joins.** Spine = Activity file (30 cols, schema *identical* 2019↔2024) joined to Respondent
  file on `TUCASEID`. Activity Summary is a trap — its `t######` column set is year-specific
  (410/398/396/377 cols for 2019/23/24/25; 33 cols in 2019 missing from 2024, 19 the other way) and
  it carries no time-of-day. Row counts verified against BLS's own stated counts.
- **Weights.** `TUFINLWGT`, units = **person-days**. Unweighted is not noisy, it is *biased by
  design*: weekend days are sampled at 2.5× the weekday rate. Method unchanged 2006–2019 and
  2021–present → **2019/2023/2024 directly comparable, pooling 2023+24 valid on the same weight.**
- **Universe.** Civilian, noninstitutional, **15+**, in households, 50 states + DC. Day-of-week is
  *assigned* (10% per weekday, 25% per weekend day), which is why the weight is mandatory.
- **Lexicon — closed clean.** Activity codes unchanged since **2013**. Only 2019→2025 change is a
  2023→2024 *rename* (`130122`/`130220`), one-to-one, codes untouched. No crosswalk needed.
- **2020 — settled, map was two-thirds right.** Diary days 2020-03-18→05-09 do not exist; year covers
  **313 days** on its own weight `TU20FWGT`; annual estimates impossible. Corrections: it is *not* a
  separately-named file (normal names, special weight), and it is *not* unusable — BLS built
  `TU20FWGT` for 2019 too, explicitly to support a matched partial-year 2019-vs-2020 comparison.
- **NEW — 2025 exists** (released 2026-06-25) and should **not** carry the headline: 43-day hole
  (2025-09-30→11-11) from the Oct 2025 shutdown, Q4 weights *not* adjusted for it, 25.7% response
  rate, effect "not possible to quantify" per BLS.
- **Temporal reference.** Diary day runs **4:00 a.m. → 4:00 a.m.**; use `TUACTDUR24` (max 1440).
  **No document states any time-zone convention** → local wall clock only, **no simultaneity claim**.
- **Licence.** Public domain, redistribution fine, cite BLS. The **BLS emblem is trademarked — do not
  put the logo on the site.** No embedded third-party data.

12 numbered decisions (S1–S12) bind tickets 03–07. 6 unanswerables recorded with their cost.

## Question

What does ATUS actually contain, and what makes a number computed from it correct?

Run the `rigor-source` skill against ATUS and produce the provenance record. Read the publisher's
prose (BLS ATUS User's Guide + file layouts), not just the column headers. Must answer:

- **The files.** Which of the 4–5 linked files (respondent, activity, roster, summary, CPS-linked)
  are needed, and on what keys they join. Row counts per year.
- **Weights.** Which final weight applies (`TUFINLWGT` / `TU06FWGT` family), what it weights *to*,
  and what happens to a number computed without it. What weighting is correct when **pooling
  multiple years** vs comparing years side by side.
- **The universe.** Who is in the sample, what a "respondent-day" is, how days-of-week are
  represented and why that matters for any daily average.
- **The activity lexicon.** How many codes, the tier structure, and — critically — **whether the
  lexicon changed between 2019 and 2024** such that categories are comparable across the
  pre/post-COVID split.
- **The 2020 question.** Confirm or refute: BLS suspended collection Mar–mid-May 2020 and published
  2020 as a special partial-year file with its own weights, not comparable to other years. This is
  currently an assumption on the map — settle it.
- **Temporal reference point.** What "one day" means: diary day, reference day, time zone handling.
- **Licence** and any embedded third-party data.

Write findings to `research/02-atus-source/findings.md` and link it from the resolution.
