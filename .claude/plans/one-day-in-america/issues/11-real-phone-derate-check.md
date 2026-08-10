# 11 · Is the ×4 phone derate right?

Type: task (HITL — needs Dustin's actual phone)
Status: **resolved 2026-08-09** · claude (sonnet)
Blocked by: 04

## Resolution

**No — it was too conservative.** Measured directly on Dustin's iPhone 16+ (LAN, `rep=1`, no
stand-in): dead even with the laptop's own real-time draw on opaque fill (9 ms vs 9.0 ms, ratio
1.00×) and **~2× faster** on blended overdraw — the case the budget is actually denominated in (3–6 ms
measured vs 9.6–25.7 ms the `rep=4` prediction gave). Every config tested held 58.8 fps with 45–65% of
frame budget unused.

**The ≤2.5-screens/60fps budget loosens, it does not tighten.** But the device's real ceiling was not
found — nothing here was pushed hard enough to miss 60 fps — so the existing number stands as a safe
floor, not a re-measured ceiling. Full numbers, the derate-ratio math, and two caveats (iPhone 16+ is
flagship-tier, not "mid-range"; iOS's `performance.now()` reads in whole milliseconds) are in
[research/04-render-budget/findings.md](../../../../research/04-render-budget/findings.md), new
subsection under "The measured ceiling, derated." R3 updated there and in the map.

**Not run this pass:** the `antialias:false` parity check and the R6 watchdog-wall (~500 ms) check
ticket 11 also flagged — both need dedicated configs (`msaa=1` comparison; `rep=8`/`16` stress) that
weren't part of the three the budget turns on. Open.

## Question

Does a real mid-range phone hit the numbers ticket 04 predicts for it?

Ticket 04 measured the render budget on a laptop GPU (Intel Iris Xe, via ANGLE/D3D11) and found that
**CPU throttling does not touch the GPU** — the same WebGL scene ran 22.1 / 19.0 / 20.9 / 18.1 ms at
CPU ×1 / ×2 / ×4 / ×6. So every GPU number in that budget describes a laptop, and the mid-range-phone
figures are a stated ×4 derate (`rep=4` — redrawing the scene four times per frame, which is the work
a 4×-slower GPU does drawing it once).

That factor is the largest uncertainty in the budget, and it is cheap to close. The spike already
serves over the network and self-measures; nothing new has to be built.

- Serve the spike on the LAN (`node spike/render-budget/serve.mjs`, bind beyond loopback), open it on
  Dustin's phone, read `window.__RESULT` off the on-page HUD.
- Run the three configs the budget turns on, at `rep=1` and native DPR:
  `?tech=webgl&year=all&n=25652&layout=rows&msaa=0`
  `?tech=webgl&year=all&ns=500,1000,2500&layout=ribbon&alpha=0.08&bandH=6&msaa=0`
  `?tech=webgl&year=all&n=2500&layout=ribbon&alpha=0.08&bandH=6&msaa=0&dprCap=2`
- Compare each against the `rep=4` laptop figure in
  [research/04-render-budget/findings.md](../../../../research/04-render-budget/findings.md).

Answer: the true derate factor, and whether the overdraw budget (≤ 2.5 screens at 60 fps) survives,
tightens, or loosens. If it tightens, R3 in that record changes and the Fable brief changes with it —
so this wants closing before ticket 09 hands the brief over.

Also worth catching on a real device, since no emulator shows them: whether iOS Safari honours
`antialias: false` the same way, and whether the ~500 ms watchdog wall (R6) is stricter on mobile.
