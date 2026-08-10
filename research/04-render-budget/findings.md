# The render budget — what the device can actually carry

Ticket 04 · measured 2026-08-09 · claude (opus)

Builds on the ticket-03 extract ([`../03-extract/findings.md`](../03-extract/findings.md)). Decisions
**E1–E7** were the input contract; none was re-decided here.

**Headline: the GPU is not what stops this piece.** All 475,635 episodes — every respondent-day in
all three years — draw in a single WebGL2 instanced call at 60 fps on an emulated phone, and the
entire dataset is **507 KB brotli** over the wire at full fidelity. Two things bind instead, and
neither is throughput:

1. **Blended overdraw.** ~2.5 full-screen layers per frame at 60 fps, derated to a mid-range phone.
2. **Weighting.** Drawing every respondent-day with equal ink is wrong by **8.67 percentage points**
   — and drawing *all* of them is exactly as wrong as drawing a random 500. Only
   probability-proportional-to-size sampling fixes it.

The one-page budget for the Fable brief is the last section, and is meant to be lifted verbatim.

---

## The budget (lift this into the Fable brief)

Phone 390×844 CSS. Numbers derated to a mid-range phone (method below). MSAA **off**.

| | Budget |
|---|---|
| **Technique** | WebGL2, instanced quads, one draw call. Canvas2D cannot animate this data. |
| **Context flags** | `antialias: false` (2–8× faster), `premultipliedAlpha: true`, `alpha: false` |
| **Backing store** | cap at **DPR 2**, not the device's 3 — measured 2.05× faster, 11.3 MB → 5.0 MB resident |
| **Primitives** | ~**2 million/frame** free. All 475,635 episodes cost ~3 ms. Do not decimate for this. |
| **Blended overdraw** | **≤ 2.5 screens/frame at 60 fps · ≤ 6 screens at 30 fps** (a "screen" = 2.96 Mpx) |
| **Opaque fill** | one screen of it is ~10 ms; all 25,652 threads as 1-px rows hold **30 fps** |
| **Hard wall** | never let a frame exceed **~500 ms** — the driver watchdog kills the context, permanently |
| **Blend mode** | **alpha only.** Multiply reaches black at 8 overlaps (a=1) or 64 (a=0.1). Any opacity. |
| **Payload** | **≤ 800 KB brotli** for all data. Full three-year fidelity is 507 KB + 88 KB of weights. |
| **Resident** | ~30 MB total on phone (5–11 MB canvas + 3.6 MB instance buffer + ~15 MB heap) |
| **Sampling** | if drawing < 25,652 threads, **systematic PPS on cumulative `TUFINLWGT`** — never head-N, strided, or uniform-random |
| **Legibility ceiling** | **844 threads** on a phone if an individual thread must be traceable (3 device px each); 2,532 at 1 device px; beyond that pre-aggregate in data, don't let the rasteriser sample |

---

## How this was measured, and why the numbers are trustworthy

Spike: [`spike/render-budget/`](../../spike/render-budget) — throwaway, ugly on purpose, never
deployed (Astro builds only `src/` and `public/`). `bake.mjs` → packed binaries, `serve.mjs` → the
harness, `drive.mjs` → a headful Chrome across a config matrix, `decimate.mjs` → the sampling check.
Raw numbers in [`spike/render-budget/results/`](../../spike/render-budget/results).

Chrome is driven **headful** on purpose: headless falls back to SwiftShader for WebGL, which would
understate the GPU by an order of magnitude. The driver reads the unmasked renderer string on every
run and aborts if it sees a software rasteriser. Every run here reports
`ANGLE (Intel, Intel(R) Iris(R) Xe Graphics, Direct3D11)`.

**The harness was proven able to fail, not merely observed passing.** Four defects were found by
building the check first and only then trusting the number:

| Check | What it caught |
|---|---|
| CPU canary — a fixed 3×10⁶-iteration JS loop in every matrix | Throttling is real: 31.8 ms at ×1 → 246.8 ms at ×4. (Chrome over-throttles; nominal ×4 measured 7.8×.) A silently no-oped emulation would have read flat. |
| 1-pixel `readPixels` after each draw | `gl.finish()` **does not block under ANGLE/D3D11**. Before the readback, WebGL `drawMs` read ~1 ms at every load including ones running at 2.5 fps — pure CPU submit time. |
| `webglcontextlost` listener + `isContextLost()` | The rep-16 stress appeared *faster* than rep-8 (59.9 vs 0.4 fps). The context was dead and drawing was a no-op. Both stress runs now report `contextLost: true`. |
| Interleaved A/B instead of sequential runs | A DPR-2 run came back *slower* than DPR-3, contradicting DPR-1. Three interleaved pairs showed the real effect (2.05×) and exposed the first result as a bad run. |

A fifth defect was in the blend probe itself: the ground fill inherited the previous iteration's
`globalAlpha`, so every reading after the first in each group was contaminated by the previous
stack. Fixed, re-run; the numbers below are from the corrected probe.

**Precision.** The same config measured three times inside one run: 20.4 / 20.9 / 21.1 ms (±1.7%).
The same config across runs: 15.8 → 21.1 ms (±15%, laptop thermal/load drift). Budget figures are
therefore stated to one or two significant figures with conservative thresholds. Do not read
precision into them that the machine did not deliver.

### The one thing that could not be measured here

**CPU throttling does not touch the GPU.** The same WebGL scene measured 22.1 / 19.0 / 20.9 / 18.1 ms
at CPU ×1 / ×2 / ×4 / ×6 — flat. So the WebGL path is entirely GPU-bound, and those timings describe
*this laptop's integrated GPU*, not a phone. CDP has no GPU throttle.

The workaround is `rep=R`: redraw the whole scene R times per frame, which is exactly the work an
R×-slower GPU does drawing it once. **All derated figures in the budget are `rep=4` measurements** —
an explicit, stated stand-in for a mid-range phone GPU roughly a quarter the speed of an Iris Xe.

**That factor is an assumption, not a measurement**, and it is the single largest uncertainty in this
budget. It is cheap to close: the spike serves over LAN and Dustin can open it on his phone. See
ticket 11 — **resolved below**: the real derate is ~1× on opaque fill and ~0.5× (i.e. the phone is
*faster*) on blended overdraw, not ×4.

---

## Payload — the whole dataset is smaller than one photograph

The packed layout exploits what ticket 03 proved: every day chains from 0 and sums to exactly 1440
minutes, so **the start minute is free** — it is the running total of the durations. Storing it would
cost 2 bytes an episode to say nothing.

Per year: episode-count per day (`u8`) · duration (`u16`) · major category (`u8`) = **3.05 bytes per
episode**.

| | raw | gzip | brotli |
|---|---:|---:|---:|
| 2019 (182,980 episodes) | 545.3 KB | 219.1 KB | 195.6 KB |
| 2023 (153,120) | 457.0 KB | 182.8 KB | 162.8 KB |
| 2024 (139,535) | 416.3 KB | 166.0 KB | 148.1 KB |
| **all three years (475,635)** | **1,418.6 KB** | **567.9 KB** | **506.5 KB** |
| + `TUFINLWGT` per day (25,652) | 100.2 KB | | 87.9 KB |
| *(the source CSV, for scale)* | *21.9 MB* | | *2.53 MB* |

Two variants measured and rejected:

- **Packing the major into 4 bits** (12 categories fit): 1,186.3 KB raw but **498.8 KB brotli** —
  saves 8 KB compressed for real decode complexity. Brotli already finds that redundancy. Not worth it.
- **Adding `TEWHERE`** (needed only if a location view exists): 634.3 KB brotli, +128 KB.

At 1.09 bytes/episode compressed, **decimation buys nothing on payload.** Any decision to draw fewer
threads is a legibility or honesty decision, never a bandwidth one.

---

## Technique — Canvas2D is out

Phone viewport, CPU ×4, `rows` layout (each thread one row; the episodes of a day tile its row
exactly, so total fill is one screen regardless of thread count).

| technique | threads / episodes | draw ms | fps |
|---|---|---:|---:|
| Canvas2D, `fillRect` per episode | 250 / 4,652 | 21.2 | 30 |
| Canvas2D, `fillRect` per episode | 4,000 / 74,017 | 355.6 | 2.7 |
| Canvas2D, batched into 12 colour paths | 4,000 / 74,017 | 174.4 | 5.5 |
| Canvas2D, baked once then `drawImage` | 25,652 / 475,635 | 0.7 | 60 |
| **WebGL2 instanced, MSAA on** | 25,652 / 475,635 | 18.3 | 60 |
| **WebGL2 instanced, MSAA off** | **25,652 / 475,635** | **9.9** | **60** |

Canvas2D's animated ceiling is roughly **200 threads / 4,000 episodes** at 60 fps. Batching by colour
(12 paths, one `fill()` each, instead of a `fillStyle` change per rect) buys about 2× — real, but not
two orders of magnitude. Canvas2D is viable only for the bake-once-then-composite path, which draws
at 60 fps but cannot animate anything per-thread.

WebGL2 draws the entire dataset in **one** `drawArraysInstanced` call, with per-instance
`(startMin, dur, row, major)` as four `uint16`s = 8 bytes, a 3.63 MB static buffer. All layout maths
lives in the vertex shader, so animating costs the CPU nothing.

The Canvas2D and WebGL paths run the *same* layout function so the comparison is fair.

### The two costs, separated

- **Primitives are nearly free.** Rows, MSAA off: 2,532 threads (46,429 episodes) = 6.2 ms; 25,652
  threads (475,635 episodes) = 9.0 ms. That is 2.8 ms for 429,000 extra primitives — **~6.5 ms per
  million**. The entire three-year dataset costs about 3 ms of primitive setup.
- **Fill is everything else.** Which is why the budget is denominated in screens of overdraw.

### MSAA is the single biggest lever

| case | MSAA on | MSAA off | ratio |
|---|---:|---:|---:|
| rows, 25,652 threads | 18.3 ms | 9.9 ms | 1.85× |
| rows, 2,532 threads | 14.1 ms | 6.4 ms | 2.2× |
| ribbon, 2,500 threads | 83.1 ms | 11.5 ms | **7.2×** |
| ribbon, 5,000 threads | 124.8 ms | 15.0 ms | **8.3×** |

`antialias: true` is the WebGL default. On thin, overlapping, translucent geometry — exactly what
this piece is made of — it costs up to 8×. Turn it off. The cost of turning it off is that sub-pixel
geometry aliases instead of averaging, which matters, but is the wrong fix for that problem anyway
(see legibility below).

### DPR is the second biggest lever

Interleaved A/B, three pairs, ribbon 2,500 threads, rep=4, MSAA off:

| | run A | run B | run C |
|---|---:|---:|---:|
| DPR 3 (1170×2532) | 30.7 ms | 31.5 ms | 31.1 ms |
| DPR 2 (780×1688) | 14.3 ms | 15.0 ms | 15.5 ms |

**2.05×**, and it moves that case from 30 fps to 60. DPR 1 at 5,000 threads is 15.1 ms against 58.8 ms
at DPR 3 (3.9×). Capping the backing store at DPR 2 also halves resident canvas memory. On a mark
made of colour fields rather than fine type, the visual cost is close to nothing.

---

## The measured ceiling, derated

`rep=4` — the mid-range-phone stand-in. MSAA off, CPU ×4, phone viewport. A "screen" is 2.96 Mpx.

| mark shape | threads | overdraw | derated ms | fps |
|---|---:|---:|---:|---:|
| rows (opaque, one screen of fill) | 2,532 | 1.0 screen | 9.7 | 60 |
| rows | 10,000 | 1.0 | 14.4 | 60 |
| rows | **25,652 (all)** | 1.0 | 25.9 | **~38** |
| rows @ DPR 2 | 25,652 | 1.0 | 24.3 | 30 |
| ribbon (blended, 6 px band) | 250 | 0.6 screens | 7.0 | 60 |
| ribbon | 500 | 1.2 | 9.6 | 60 |
| ribbon | **1,000** | **2.4** | **13.0** | **60** |
| ribbon | 2,500 | 5.9 | 25.7 | 30 |
| ribbon @ DPR 2 | 2,500 | 3.9 | 15.0 | 60 |
| ribbon @ DPR 1 | 5,000 | 2.0 | 15.1 | 60 |

Read down the overdraw column, not the thread column — the threshold is the same at ~2.5 screens
however you reach it. Confirmed independently: 2,500 threads at a 24 px band (70 Mpx) and 10,000
threads at a 6 px band (70 Mpx) cost 179.5 ms and 193.7 ms — the same, from four times the thread
count. **Fill is the currency; thread count is not.**

### The watchdog is a wall, not a slope

Pushed to `rep=8` and `rep=16` on the ribbon case (≈1.4 and 2.9 Gpx/frame), the page did not merely
run slowly. `webglcontextlost` fired, and Chrome then refused to create a WebGL2 context **for the
rest of the browser session** — seven subsequent configs returned "no webgl2" and had to be re-run in
a fresh browser. A frame in the ~1 s range trips the driver's TDR watchdog.

This is a black screen, not a slow one, and it does not recover on its own. Two build rules follow:
never let a frame exceed ~500 ms even transiently (a load spike, a filter change, a resize), and ship
a `webglcontextlost` handler with a static fallback.

### Desktop is harder than the phone

Desk 1440×900 at DPR 2 = 5.18 Mpx, 1.75× the phone's pixels. CPU ×1, MSAA on: rows 25,652 = 36.0 ms
(30 fps); ribbon 2,500 = 148.4 ms; ribbon 25,652 = 874 ms.

The map assumed mobile parity was the binding constraint. On fill-bound work it is not — **a retina
desktop is the harder target**, purely on pixel count. Budget against the desktop and the phone comes
free; the reverse does not hold.

### Ticket 11 — the ×4 derate, measured for real

`rep=4` was the single largest assumption in this budget — CDP has no GPU throttle, so `rep=4` stood
in for "roughly a quarter the speed of an Iris Xe," untested. Ticket 11 closed it: the three configs
the budget turns on, run at `rep=1` — no stand-in, the device's real GPU — on Dustin's iPhone 16+, over
LAN, native DPR except where noted.

| config | n | draw (phone) | frame | fps | draw (laptop, `rep=4` prediction) |
|---|---:|---:|---:|---:|---:|
| rows, all 25,652 | 25,652 | 9 ms | 17 ms | 58.8 | 25.9 ms |
| ribbon | 500 | 3 ms | 17 ms | 58.8 | 9.6 ms |
| ribbon | 1,000 | 4 ms | 17 ms | 58.8 | 13.0 ms |
| ribbon | 2,500 | 6 ms | 17 ms | 58.8 | 25.7 ms |
| ribbon @ DPR 2 | 2,500 | 6 ms | 17 ms | 58.8 | 15.0 ms |

Every config lands at 58.8 fps (frame = 17 ms, essentially the 60 Hz vsync ceiling) with 45–65% of the
frame budget unused. **The true derate is not ×4.** Measured against the laptop's own *undivided*
(`rep=1`) numbers — the fair comparison, not the `rep=4` stand-in — the phone is dead even on opaque
fill (rows: 9 ms vs 9.0 ms, ratio **1.00×**) and roughly **2× faster** on blended overdraw, the case the
budget is actually denominated in (ribbon: 3/7.1, 4/7.5, 6/11.5 → ratios **0.42–0.53×**). Apple's
tile-based deferred renderer appears to eat translucent overdraw more cheaply than the Iris Xe's
architecture does — the overdraw-screens cost curve measured on the laptop is not guaranteed to
transfer 1:1 across GPU architectures.

**The ≤2.5-screens/60fps budget loosens. It does not tighten.** Every number ticket 04 flagged as
uncertain came back better than assumed, by 2–4×. But the device's real ceiling was **not found** —
nothing here was pushed hard enough to miss 60 fps — so ≤2.5 screens stands as a safe, conservative
floor, not a re-measured ceiling. Extrapolating a new number (e.g. "~16 screens" from the 2.78× of
headroom the 5.9-screen ribbon config showed) would be modeling, not measuring — the thing this record
has avoided everywhere else.

**Scope caveat.** iPhone 16+ is a current-generation flagship, not the "mid-range phone" the derate
was meant to model. No low- or mid-tier Android was tested. This result licenses more confidence the
budget is *not too tight* on modern hardware; it says nothing about a genuinely cheap device, where
the untested ×4 assumption could still be closer to true.

**A precision note.** iOS Safari's `performance.now()` reads in whole milliseconds here — every
`frame` value across five different configs and loads reads exactly `17`, and `fps` is exactly
`1000/17 = 58.8` every time — consistent with WebKit's known timer-resolution coarsening, not a
coincidence of the workload. Sub-millisecond claims from this device should not be trusted. It does
not change the conclusion: the gaps between measured and predicted (9 vs 25.9 ms, 6 vs 25.7 ms) are
15–20× the ±1 ms rounding noise.

**Not run.** Ticket 11 also flagged `antialias:false` parity and the R6 watchdog wall (~500 ms) as
worth checking on real iOS — neither was tested this pass (would need an `msaa=1` comparison and a
`rep=8`/`rep=16` stress run). Open, not closed.

---

## Blending — multiply reaches black at every opacity

Ground `#f4f2ee` (244,242,238), ink (76,114,191), N stacked translucent copies, centre pixel read
back from the canvas.

| overlaps | alpha, a=0.1 | multiply, a=0.1 | alpha, a=1 | multiply, a=1 |
|---:|---|---|---|---|
| 1 | 227,229,232 | 226,227,231 | 76,114,191 | 73,108,178 |
| 4 | 184,197,218 | 181,188,211 | 76,114,191 | 3,10,75 |
| 8 | 146,167,205 | 135,147,187 | 76,114,191 | 1,1,24 |
| 16 | 105,136,192 | 75,90,149 | 76,114,191 | 1,1,4 |
| 32 | 79,118,187 | 26,37,95 | 76,114,191 | 1,1,3 |
| 64 | **78,118,187** | **13,15,47** | 76,114,191 | 1,1,3 |

- **Alpha converges to the ink and stops.** By 32 overlaps it *is* the ink colour, and stays there. It
  cannot go darker than the ink at any overlap count. That is the property a dense mark needs.
- **Multiply passes through the ink and keeps falling to black.** Black by 8 overlaps at a=1, by 32 at
  a=0.25, by 64 at a=0.1 — and a=0.05 is on the same curve, just slower.
- **Lowering opacity does not save multiply. It only postpones black.**
- The two agree within ~5% up to **4 overlaps** and diverge visibly by 8.

Rule: alpha blending, premultiplied (`blendFunc(ONE, ONE_MINUS_SRC_ALPHA)`, fragment outputs
`vec4(rgb * a, a)`). Multiply is available only where overlaps are provably capped at ≤ 4 — which,
with thousands of threads on a phone, they never are.

The screenshots make the point without a table: `ribbon-2500-multiply.png` is **64 KB** because it is
almost uniform black; `ribbon-2500-alpha.png` is **1.19 MB** of actual structure. The file size is the
evidence.

*(Aside: multiply measured 61.5 ms against alpha's 82.1 ms — `blendFunc(DST_COLOR, ZERO)` is cheaper.
It is still unusable. Speed is not the reason to pick a blend mode here.)*

---

## Decimation — the finding that actually binds the design

`TUFINLWGT` across all 25,652 respondent-days: min 0.82 M · p05 2.65 M · median 8.39 M · p95 30.67 M ·
max **194.37 M**. A **237× spread**, coefficient of variation **93%**. One respondent-day is emphatically
not one respondent-day.

Truth = all 25,652 days weighted by `TUFINLWGT`. Measured against the picture actually drawn — each
drawn thread contributing one unit of ink — on the 1440-minute × 12-category share grid, which is what
the eye reads off a time-of-day mark. Max absolute deviation, percentage points:

| threads drawn | head-N | strided | uniform random | **PPS** |
|---:|---:|---:|---:|---:|
| 500 | 6.85 | 12.42 | 9.85 | **4.51** |
| 1,000 | 8.75 | 10.86 | 8.62 | **4.99** |
| 2,532 | 8.58 | 8.40 | 7.15 | **2.17** |
| 5,000 | 8.10 | 8.66 | 9.80 | **1.12** |
| 10,000 | 8.16 | 8.61 | 8.18 | **0.94** |
| **25,652 (all of them)** | **8.67** | **8.67** | **8.67** | **0.32** |

Read the last row. **The unweighted error does not go away when you draw everything.** It sits at 8.67
pp whether you draw 500 threads or all 25,652. It is not a sampling error — it is a weighting error,
and no amount of drawing more threads touches it.

**Where the lie lands:** at **2:57 p.m.**, the weighted truth is **31.7% of Americans working**. Drawn
one-thread-per-respondent-day it reads **23.1%**. Eight and a half points missing from the middle of
the workday. The cause is ticket 03's measured weekend bias made visible: **49.93% of the raw sample
is a weekend day; only 28.56% of real person-days are.**

Worst cell per category: work **8.67 pp** (2:57 p.m.) · leisure and sports **6.00** (2:59 p.m.) ·
household **3.38** (10:57 a.m.) · personal care **2.82** (6:59 a.m.) · education **2.60** (10:56 a.m.).

**The fix: systematic probability-proportional-to-size sampling** on the cumulative `TUFINLWGT` line —
walk the cumulative weight in equal steps and take the day you land on. Every drawn thread then stands
for the same slice of the population, so **equal ink becomes correct rather than a distortion**. PPS at
5,000 threads holds max error at ~1 pp; at 2,532, ~2 pp.

The comparison that should decide it: **PPS at 2,532 threads (2.17 pp) is four times more truthful
than drawing all 25,652 unweighted (8.67 pp).** Fewer threads, chosen right, beats every thread chosen
wrong.

**One caveat in the other direction.** The *headline number* survives everything: average personal-care
minutes per day lands within ~10 minutes of truth under every strategy at every k. If the spine asserts
a single number, sampling cannot hurt it. If the spine asserts a *shape across the day* — and a
time-of-day mark inevitably does — only PPS is safe.

---

## Legibility, not the GPU, is the real ceiling

The phone canvas is 2,532 device px tall.

| threads | px per thread | what it is |
|---:|---|---|
| 25,652 | 0.099 device px | ~10 threads compete for each pixel row. MSAA off: one arbitrary thread wins (noise). MSAA on: 4–8 of the ~10 get averaged. **Neither is honest aggregation** — the rasteriser is doing statistics badly. |
| 2,532 | 1 device px | one thread per physical pixel, the maximum that can be individually addressed |
| **844** | 3 device px (1 CSS px) | the density at which an individual thread is traceable by eye |

Screenshots: [`rows-25652-msaa-on.png`](../../spike/render-budget/results/rows-25652-msaa-on.png) ·
[`rows-25652-msaa-off.png`](../../spike/render-budget/results/rows-25652-msaa-off.png) ·
[`rows-844.png`](../../spike/render-budget/results/rows-844.png).

So the ceiling depends on what the mark claims:

- **"One thread is one person, and you can follow one"** → ~**844** on a phone. Set by pixels, not the GPU.
- **Aggregate texture** → aggregate *in the data*, to one row per pixel, and draw that. Do not hand
  25,652 sub-pixel quads to the rasteriser and call whatever comes out the distribution.

The threads in those screenshots read as noise because they are in `TUCASEID` (date) order and nothing
is sorted. That is an ordering problem and it belongs to Fable — it is not a feasibility result.

---

## Resident memory

- **Canvas backing store = w × h × 4, whatever is drawn on it.** Phone at DPR 3 = 11.3 MB; at DPR 2 =
  5.0 MB; desk 1440×900 at DPR 2 = 19.8 MB. Only fewer pixels reduce it.
- **GPU instance buffer** for all 475,635 episodes at 8 bytes each = 3.63 MB.
- **JS heap** observed 6–22 MB across configs.

Total ≈ 30 MB on a phone. Not a constraint, and not worth designing around.

---

## Decisions that bind later stages

| # | Decided | Why | Rejected |
|---|---|---|---|
| R1 | **WebGL2 instanced quads, one draw call**, per-instance `(start, dur, row, major)` as four `uint16` | Canvas2D animates ~200 threads; WebGL animates all 25,652. Primitives cost ~6.5 ms per million. | Canvas2D per-rect (2.7 fps at 4,000 threads); Canvas2D batched by colour (only 2× better) |
| R2 | **`antialias: false`, backing store capped at DPR 2** | Measured 1.85–8.3× and 2.05× respectively — the two largest levers by a wide margin | The WebGL default (`antialias: true`) at native DPR 3 |
| R3 | **The budget is denominated in screens of blended overdraw: ≤ 2.5 at 60 fps, ≤ 6 at 30 fps** | Confirmed independently — 70 Mpx costs the same from 2,500 threads or 10,000. Thread count is not the currency. Ticket 11: real iPhone 16+ ran the same configs 2–4× *better* than the `rep=4` laptop stand-in predicted — the number is a safe floor, not a measured ceiling. | A thread-count ceiling, which is layout-dependent and misleading |
| R4 | **Alpha blending only**, premultiplied | Multiply reaches black at every opacity tested; lowering opacity only postpones it. Alpha saturates at the ink and stops. | Multiply (measurably faster, visually unusable past ~4 overlaps) |
| R5 | **If fewer than all 25,652 threads are drawn, choose them by systematic PPS on cumulative `TUFINLWGT`** | Equal ink is only correct when every thread stands for an equal slice. PPS at 2,532 (2.17 pp) beats all 25,652 unweighted (8.67 pp). | Head-N, strided, uniform random — all pinned at ~8.7 pp regardless of k |
| R6 | **Never let a frame exceed ~500 ms; ship a `webglcontextlost` handler with a static fallback** | The driver watchdog kills the context permanently — a black screen that survives until reload. Reproduced twice. | Treating slow frames as merely slow |
| R7 | **Ship the full three-year episode stream uncompressed-in-fidelity; payload ceiling 800 KB brotli** | 507 KB + 88 KB weights at full fidelity, because ticket 03's 1440-minute invariant makes start minutes free. 4-bit packing saves 8 KB compressed. | Decimating for bandwidth; a denormalised or per-year-lazy payload |

---

## What this hands to the next tickets

- **Ticket 08 (reference wall) / 09 (Fable brief):** the budget table at the top goes in verbatim. It
  is the whole render constraint, and it is deliberately expressed in design units — screens of
  overdraw, threads that can be traced, blend mode — not in API terms.
- **Tickets 05/06 (spines):** two hard limits on what a mark can assert. A time-of-day *shape* is only
  honest under PPS sampling (R5). A single headline *number* is robust to any sampling.
- **Ticket 07 (freeze the claim):** unaffected. S12 still stands — a 2019-vs-2024 change still needs
  the replicate weights before it is printed.
- **Ticket 11, resolved.** The ×4 mid-range-phone derate was the one assumption in this budget that
  was not measured. Real iPhone 16+: true derate ~1× on opaque fill, ~0.5× (faster) on blended
  overdraw. The budget loosens; see the subsection above.
