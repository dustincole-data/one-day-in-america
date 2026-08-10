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

- **01 · Repo, stack and subdomain set up; deploy path proven.** Own repo at
  `C:\Users\dusti\Projects\One_Day_In_America\`, remote `dustincole-data/one-day-in-america` (SSH),
  Vercel project `one-day-in-america` **git-linked to `main`**. Stack = **Astro 7 static → Vercel**,
  matching the four most recent projects. **`git push` auto-deploys** — measured on a real push, no
  `npx vercel --prod`. Verify on `one-day-in-america.vercel.app`, never the per-deployment URL (it
  serves the SSO page under a 200). Subdomain **`oneday.dustincoledata.com`**, attached and verified
  in Vercel; **one manual step left for Dustin** — Namecheap CNAME `oneday` →
  `3e4803086c51b69e.vercel-dns-017.com.` (Vercel mints a per-domain target; it is not the shared
  `cname.vercel-dns.com`).
  → [ticket 01](issues/01-repo-stack-domain.md)
- **02 · ATUS interrogated, provenance recorded.** Lexicon comparability closed clean (activity codes
  unchanged since 2013; only 2019→2025 change is a 2023→2024 rename, one-to-one). Weights:
  `TUFINLWGT`, person-days, same method 2006–19 and 2021–present → 2019/2023/2024 directly
  comparable. Universe: civilian, noninstitutional, **15+**, households, 50 states + DC. Diary day
  runs **4 a.m.→4 a.m.**. **No time-zone convention documented → no simultaneity claim.** Public
  domain, but the BLS emblem is trademarked. 12 decisions bind tickets 03–07.
  → [ticket 02](issues/02-atus-source-interrogation.md) ·
  [findings](../../../research/02-atus-source/findings.md)
- **03 · Weighted extract built and proved against BLS.** Gate passed: **637 of 639 published Table
  A-1 cells reproduce exactly** for 2019/2023/2024 × total/men/women × three statistics (the two
  misses are 0.09 pp and 22 seconds in one leaf's women slice, documented and pinned). All nine ZIPs
  re-fetched byte-identical to the ticket-02 hashes. Everything BLS only asserted is now verified in
  the bytes — `TUCASEID` unique, **every** respondent-day sums to exactly 1440 minutes, episodes
  chain from the 4 a.m. origin, and per-code minutes match BLS's own pre-summed file on ~8.5 M
  cells. BLS's published category map is in **no** document and had to be recovered from Table A-1's
  arithmetic (travel redistributed; tier 1 `10` splits at **tier 3**). Extract =
  `data/extract/{episodes,respondents}-<year>.csv`, gitignored, `npm run data` rebuilds and
  re-verifies. 475,635 episodes · 25,652 respondent-days. 7 decisions E1–E7 bind 04–07.
  → [ticket 03](issues/03-build-validated-extract.md) ·
  [findings](../../../research/03-extract/findings.md)
- **04 · Render budget measured; the GPU is not the constraint.** All 475,635 episodes draw in **one**
  WebGL2 instanced call at 60 fps on an emulated phone, and the full three-year payload is **507 KB
  brotli** (start minutes are free — ticket 03's 1440 invariant). Canvas2D animates ~200 threads and is
  out. Two levers dwarf the rest: `antialias:false` (up to 8.3×) and capping the backing store at DPR 2
  (2.05×). **The budget is screens of blended overdraw — ≤2.5 at 60 fps, ≤6 at 30 — not thread count**
  (70 Mpx costs the same from 2,500 threads or 10,000). **Multiply is out at every opacity** (black by
  8 overlaps at a=1, by 64 at a=0.1; low opacity only postpones it). The binding finding is
  **decimation as a truth problem**: weights span 237×, so equal ink per respondent-day is wrong by
  **8.67 pp at every k including all 25,652** — 23.1% shown working at 2:57 p.m. against a weighted
  31.7% — and only systematic PPS on `TUFINLWGT` fixes it. Real ceiling is **pixels, not the GPU**: 844
  traceable threads on a phone. Frames near 1 s kill the WebGL context permanently. **Desktop is the
  harder target, not the phone.** 7 decisions R1–R7 bind 05–09.
  → [ticket 04](issues/04-render-feasibility-spike.md) ·
  [findings](../../../research/04-render-budget/findings.md) ·
  [spike](../../../spike/render-budget)
- **05 · Candidate spines mined: four survive, one killed.** Ranked, with real weighted numbers and
  a renderability verdict each. **(1) The workday moved indoors** — peak working minute holds at
  10:45→10:55 a.m. and ~32 % of the 15+ population while the at-home share of *every paid-work minute*
  goes **11.6 % → 22.6 %**; 11.8 M fewer commuters a day from a population that grew, and those still
  commuting go 47.1 → 49.3 min. The 1440 ledger confirms the map's suspicion — the time went to
  housework and personal care, **not** leisure. **(2) The braid** — 96.2 % asleep at 3:27 a.m. against
  24.3 % at the loosest minute, stable across all three years, and in the 840 waking minutes the most
  common activity holds under a third of the country for 522 of them. **(3) A 48.5 ± 4.8 min leisure
  gap by sex, half of it television** — but total paid + unpaid work does *not* differ (5.1 ± 5.7), so
  a sex-gap spine is a leisure gap, never a total-work gap. **(4) 61 % of workers with a child under 6
  get under three hours free.** **Killed: rest inequality** (76-min total spread; the education
  gradient runs backwards). **The ranking turns on two axes:** candidate 1 is the only one that asserts
  a *change*, so it alone buys the S12 replicate-weight work; and **844 sample days per drawn cell** is
  now a hard renderability screen — candidates 1 and 2 clear it everywhere, 4's punch cell (761) and
  3's whole-day legibility (48 min = 3.3 % of a day) do not. 7 decisions P1–P7 bind 06–09.
  → [ticket 05](issues/05-candidate-spines.md) ·
  [findings](../../../research/05-spines/findings.md) ·
  [harness](../../../spike/spines)
- **11 · Real-phone check: the ×4 derate was too conservative, not too loose.** Ticket 04's `rep=4`
  laptop stand-in was the largest untested assumption in the render budget. Measured directly on
  Dustin's iPhone 16+ over LAN: the phone is dead even with the laptop's own real-time draw on opaque
  fill (9 ms vs 9.0 ms) and **~2× faster** on blended overdraw, the case the budget is actually
  denominated in (3–6 ms measured vs 9.6–25.7 ms predicted). **The ≤2.5-screens/60fps budget
  loosens** — every config tested held 58.8 fps with 45–65% of frame budget unused, and nothing pushed
  hard enough to find the device's real ceiling. Caveat: iPhone 16+ is flagship-tier, not the
  "mid-range" device the derate was meant to model — no low/mid Android was tested, and the
  `antialias:false` parity / R6 watchdog-wall checks ticket 11 also flagged remain unrun.
  → [ticket 11](issues/11-real-phone-derate-check.md) ·
  [findings](../../../research/04-render-budget/findings.md)

## Not yet specified

- **Implementation breakdown.** Cannot be sliced until Fable's design lands. Expect: data bake,
  desktop build, phone build, perf hardening, deploy verify, project card.
- **The exploration layer.** What filters exist (parents / renters / night shift / remote / age),
  how deep they go, and whether they are a control surface or something you brush through the mark.
  Depends on the spine and on Fable's form. Ticket 05 adds one binding constraint: the most
  interesting filter cells are **too thin to draw as traceable threads** — worked + child under 6 is
  761 sample days, single parents who worked 443, women in the under-6 cell 343, all under the 844
  ceiling. Those groups can be *stated* as numbers; they cannot be *drawn* as individuals.
- **Whether 3D is used at all**, and if so what depth encodes. Fable's call under thin-anchor.
  Ticket 04 narrows what the answer costs: geometry is nearly free (~6.5 ms per *million* primitives,
  so the whole dataset is ~3 ms), but **translucent overdraw is the entire budget** — and depth
  without opaque occlusion is exactly overdraw. A 3D form that occludes is affordable; one that
  layers translucently is not.
- **The interaction grammar on touch** — first-tap-is-hover and pointercancel traps apply; can't be
  designed before the mark exists.
- **Launch surface:** OG card, registry entry, any Data Nerve / LinkedIn writeup. (Subdomain DNS is
  no longer open-ended — ticket 01 pinned the exact Namecheap record; it just needs Dustin to add it,
  and the placeholder page stays `noindex` until the piece ships.)
- **Whether 2021–22 transition frames earn their weight**, once the spine is picked. Ticket 04 removes
  cost from that argument: a year is ~150–200 KB brotli, so two more frames are ~350 KB against an
  800 KB ceiling. It is now purely a question of whether they say anything.
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
