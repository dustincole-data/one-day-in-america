# 04 · How many threads can a phone actually draw?

Type: prototype
Status: **resolved 2026-08-09** · claude (opus)
Blocked by: 03

## Resolution

Budget + evidence: [research/04-render-budget/findings.md](../../../../research/04-render-budget/findings.md) ·
spike: [spike/render-budget/](../../../../spike/render-budget) (throwaway, never deployed)

**The GPU is not what stops this piece.** All 475,635 episodes draw in one WebGL2 instanced call at
60 fps on an emulated phone, and the whole three-year dataset is **507 KB brotli** at full fidelity.
Two other things bind, and seven decisions **R1–R7** come out of it.

- **Technique settled.** WebGL2 instanced quads, one draw call. Canvas2D animates ~200 threads before
  missing 60 fps (355 ms/frame at 4,000); batching by colour buys only 2×. Primitives are nearly free
  — ~6.5 ms per million, so the entire dataset costs ~3 ms.
- **Two levers dwarf everything else:** `antialias: false` (1.85–8.3×) and capping the backing store
  at DPR 2 (2.05×, verified with interleaved A/B after a first result contradicted itself).
- **The budget is screens of blended overdraw, not thread count:** ≤ 2.5 screens/frame at 60 fps,
  ≤ 6 at 30 fps, derated. Confirmed independently — 70 Mpx costs the same whether it comes from
  2,500 threads or 10,000.
- **Multiply is out at every opacity.** It reaches black by 8 overlaps at a=1 and by 64 at a=0.1;
  lowering opacity only postpones black. Alpha saturates at the ink and stops.
- **Decimation is a truth question, not a bandwidth one.** Weights span 237× (CV 93%), so drawing
  every respondent-day with equal ink is wrong by **8.67 pp — at every k, including all 25,652.** At
  2:57 p.m. it shows 23.1% of Americans working against a weighted truth of 31.7%, because half the
  raw sample is a weekend day and only 28.6% of real person-days are. Systematic PPS on cumulative
  `TUFINLWGT` fixes it: 2,532 PPS threads (2.17 pp) are four times more truthful than all 25,652
  unweighted.
- **The real ceiling is pixels.** 844 threads on a phone if one must be traceable; 2,532 at one device
  px each. Past that the rasteriser is doing the aggregation, badly — aggregate in the data instead.
- **A hard wall, not a slope:** frames near ~1 s trip the driver watchdog, `webglcontextlost` fires and
  Chrome refuses WebGL2 for the rest of the session. Reproduced twice.
- **Desktop is the harder target**, not the phone — a retina desktop is 1.75× the phone's pixels on
  fill-bound work. The map's mobile-parity assumption inverts here.
- **The harness was proven able to fail.** A CPU canary (31.8 → 246.8 ms) proves the throttle bites; a
  1-px `readPixels` proves `gl.finish()` does not block under ANGLE; context-loss detection caught a
  run where rep-16 looked *faster* than rep-8 because the context was dead; an interleaved A/B caught
  a bad DPR run; and a `globalAlpha` leak in the blend probe was found and fixed before its numbers
  were used.
- **One assumption left open:** CPU throttling does not touch the GPU, so the mid-range-phone figure
  is a stated ×4 derate (`rep=4`), not a measurement. → ticket 11.

## Question

What is the hard render budget Fable must design inside?

Fable cannot be asked to invent a mark without knowing what the device can carry. Build a throwaway
spike — no design intent, no polish, ugly on purpose — that answers:

- **Thread count.** How many respondent-day threads (1,440 minutes wide, colored by activity) can
  be drawn and animated at a usable frame rate on a mid-range phone? Find the ceiling, don't guess.
- **Technique.** Canvas2D vs WebGL vs instanced geometry. What actually changes the answer.
- **Blending.** Overlapping translucent threads on a light ground compound to black under multiply
  — alpha blending and per-thread opacity need real numbers, not theory.
- **Decimation.** If the ceiling is below the true N, what is the honest sampling strategy, and does
  sampling change the picture? (Weighted sampling that preserves the distribution, not head-N.)
- **Payload.** Bytes over the wire for the shipped data at that thread count. Set a budget.
- **Resident memory.** Decoded canvas/texture memory at phone viewport sizes.

Output: a one-page budget — max threads, technique, payload ceiling, blend mode, decimation rule —
that goes verbatim into the Fable brief. Link the spike; it is disposable, not the build.
