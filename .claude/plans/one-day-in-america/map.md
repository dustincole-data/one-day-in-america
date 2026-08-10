# One Day in America — Wayfinder Map

Label: `wayfinder:map` · Charted 2026-08-08

## Destination

> ### ⚠ REDRAWN 2026-08-10 by Dustin — read this before anything below
>
> **Three premium interactive sites, not one wordless mark.** Verbatim: *"I don't want a reference
> wall… we want to fully explore the data and take all of the understandable pieces and present it to
> users in a way that makes sense, but it also has to be interactive and premium… beautiful and
> eye-popping and easily understandable."* Then: *"give Fable the data and findings and let him
> present it in the best possible way… freedom to create the most premium thing that he can."*
>
> **Done = 3 different variations, 3 iteration passes each, all live on Vercel, built autonomously
> by Fable with no approvals.** The whole ask, the data, every finding and the five unbreakable
> constraints are in **[fable-brief.md](fable-brief.md)** — that file is now the operative spec.
>
> **Superseded by this:** the near-wordless five-second single-mark destination · the 2024-only draw
> (L3 — cross-year is wanted now) · thin-anchor / reference-wall (ticket 08, dead) · tickets 09 and
> 10 as written. **Still binding:** every *truth* constraint — C3, C10, C11, no error bars, no
> minute-level numbers, PPS on `TUFINLWGT`, and the ticket-04 render budget.
>
> His live references now: **The Shape of Help** (structure), **Cause of Death / Ember** (object
> quality), **Bremer** (colour).

*Original charting (2026-08-08), kept for the record:* One Day in America live on a dustincoledata
subdomain — a near-wordless, ATUS-grounded data-art site that lands one true gut-punch in the first
five seconds and rewards exploration after it. Beautiful and fully functional on phone *and* desktop.
Visual design invented by Fable. Portfolio-grade or not shipped — the "$10,000 site" bar.

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
  *Superseded in scope by ticket 06 (L3, 2026-08-10):* the years remain separable **in the extract**,
  but **only 2024 is drawn**. The spine asserts the shape of one day, so no year is compared, no
  transition frame ships, and 2025 never enters. 2019 and 2023 stay built and unused.

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
- **06 · The spine is locked: the braid.** *Everyone's 3 a.m. looks the same. Nobody's noon does.* The
  comparison is within one day — the tightest minute against the loosest: **96.2 % asleep at 3:27 a.m.
  against 24.3 % working at 12:02 p.m.**, a 72 pp effect at **14× the worst PPS error**. Pre-touch the
  viewer sees a rope of **7,669 threads, one per real 2024 diary day**, 4 a.m.→4 a.m., coloured by
  activity: solid at night, frayed through the middle of the day, nothing else on screen. The
  possessive in the headline binds the claim to each respondent's own clock, so **S8 is satisfied with
  no footnote**. Exploration = **filter the rope + pull one thread**. Candidate 1 (the workday moved
  indoors) was the real contender and **lost on the wordless test** — its claim lives inside the work
  colour, so it needs a legend, a toggle and a re-encode, and its surprise is a null result. Dropped,
  not deferred. **2024 only is drawn**; year deltas are ~1 % of the day so a toggle would be an
  anticlimax, and pooling adds no density because decimation binds at any year count. **S12 is off the
  board — no replicate weights, no error bars, ever, on this build.** 7 decisions L1–L7 bind 07–10.
  → [ticket 06](issues/06-lock-the-spine.md)
- **07 · The claim is frozen and the headline survives unchanged.** **96.5 % → 25.8 %, a 70.8 pp
  gap** — 2024, n = 7,669, `TUFINLWGT`, S9 universe, 12 published majors, **at the hour**: the median
  specification of a 60-spec curve, and the resolution the copy's own words assert. Register
  associational, kind exploratory, 146 ledger cells. **"3 a.m." stays** — it costs 0.21 pp against a
  ± 0.72 pp floor, and the *minute* is the indefensible statistic: the peak wanders 2:55 → 3:11 →
  3:34 a.m. across three annual samples while the 3:00 value moves 0.64 pp, on an axis where **85.3 %
  of reported episode starts land on a multiple of five minutes**. The real object is a **120-minute
  ≥95 % plateau, 2:00–3:59 a.m.**; "3:27 a.m." and "12:02 p.m." are now forbidden, as is any error
  bar and the personal-care/asleep swap (96.5 % vs 96.0 %). **The gate's binding surprise: the claim
  is partition-dependent** — under a coarse three-way scale the loosest hour moves to 6 p.m. (39.1 %)
  and the headline becomes *false* (trough stability 40/40 on a fine partition, 0/20 on the coarse
  one), so a simplified palette is forbidden. **Job 2 closed the map's open item: "worked that day"
  tightens noon to 57.4 %** (65.4 % at 6 h+, peaking **86.4 % at 2 p.m.**) and moves every worker
  slice's loosest minute to **6:00–6:22 p.m.** — 2.20× a rotation null, so coordination, not the
  filter or the tautology. The adversarial pass caught two causal leaks D1's keyword scan had passed,
  and one real framing defect: the estimand is a modal **maximum**, so "Nobody's" asserts a dispersion
  it cannot carry — safe over the mark, unsafe in text, hence a mandatory standing sentence for any
  surface quoting the claim without the picture. 11 decisions C1–C11 bind 08–10; ticket 09 inherits
  six verbatim.
  → [ticket 07](issues/07-freeze-the-claim.md) ·
  [record](../../../research/07-claim/findings.md) ·
  [adversarial pass](../../../research/07-claim/adversarial-pass.md) ·
  [harness](../../../spike/claim)
- **08 · The anchor exists and it points at nothing.** 22 real references in five zones (a rope made of
  individual records · one record pulled from the mass · twelve categories that stay separable · ground, ink and
  density · the first five seconds), 4 gpt-image-1 mood frames, 3 anti-references — with **no mark, palette,
  ground, layout, type or dimensionality prescribed anywhere**. Thin anchor intact; Impeccable/Intent untouched.
  **The positioning ruling: this plays the *beautiful object*, and the difference is that the object's
  coming-apart _is_ the finding** — no shipped project has a mark whose structural failure carries the claim. It
  borrows the scale gasp's *timing* (one instant, no interaction) but not its subject. Not a rerun of Climate
  Fingerprint (atlas of per-city posters, comparison *across* objects), Where America Moves (explore-first),
  Why Do They (its punch is words), Deep Time (magnitude), or Namesake / By Example (both need input). Only
  **C3/C10/C11** are quoted on the wall; render budget and data shape stay in the 09 brief. Mood frames are
  labelled synthetic and each carries a **defect line** — m1's spectrum ramp would violate C3 if read as a spec.
  Anti-references are justified by locked decisions, not taste; the canonical **2009 NYT ATUS interactive is a
  dead Flash object and is captured as dead**. 6 decisions W1–W6 bind 09.
  → [ticket 08](issues/08-reference-wall.md) ·
  [wall](../../../research/08-reference-wall/wall.html) ·
  [findings](../../../research/08-reference-wall/findings.md)
  **← REJECTED the same day. Dustin: *"I don't want a reference wall."* Do not read it or feed it to
  Fable.**
- **09 · The Fable brief is written, and it carries the whole project.** Rewritten to the redrawn
  destination: three variations, three iteration passes each, live on Vercel, fully autonomous, no
  approvals. It carries the ask verbatim, the tool + credential block (gpt-image-1 script and key
  path, Higgsfield with a credit check first, Pinterest login, the puppeteer fallback for anything
  scripted), the extract's schema and location, **all nine findings with real weighted numbers**
  (the 96.5→25.8 headline, the 1,440-minute ledger, work-moved-indoors, free time by group, the
  48-minute leisure gap and the total-work tie that kills its usual framing, television against
  everything, weekday/weekend, and rest-inequality-is-dead so it is not rediscovered), the five
  unbreakable truth constraints, the measured render budget, the anti-references, and the nine
  deploy/verification traps already paid for in earlier tickets.
  → [ticket 09](issues/09-fable-design-prompt.md) · **[the brief](fable-brief.md)**

## Not yet specified

- **Implementation breakdown.** Cannot be sliced until Fable's design lands. Expect: data bake,
  desktop build, phone build, perf hardening, deploy verify, project card.
- **The exploration layer — narrowed by 06 and 07, not closed.** *What* it does is settled (L5) and
  *which groups* is now settled too (C8, the 2024-only drawable set: worked/didn't, worked 6 h+, sex,
  weekday/weekend, 65+, 25–54, children <18 — **school enrolment is out at n = 466**). Still open:
  how the controls are surfaced (a control strip vs brushing the mark itself) and the touch grammar
  for pulling a thread. Binding constraints: **L6/P4's 844-sample-day line** applied to 2024 alone;
  **per-thread hit testing on touch**, where first-tap-is-hover and pointercancel traps apply; and
  **C11 — the layer must be discoverable without instruction**, because it is what shows noon is
  stratified rather than scattered.
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
*(Closed by ticket 06, by consequence of L3 — **2024 only is drawn**: whether 2021–22 transition
frames earn their weight (no), and whether 2025 appears at all (no, so its 43-day hole and 25.7 %
response rate never have to be adjudicated).)*

## Out of scope

- **Full-span 2003–2024 ATUS.** Ruled out at charting: multi-year weighting trap, activity-lexicon
  revisions across 20 years, much larger payload — cost not justified by the added gasp. Returns
  only if the destination is redrawn.
- **The other two projects in the round** — *What Actually Kills You* (#2) and *The Job Autopsy*
  (#3). Separate efforts, separate maps.
- **Native app, user accounts, saved state, print/poster export.** Web only, stateless.
