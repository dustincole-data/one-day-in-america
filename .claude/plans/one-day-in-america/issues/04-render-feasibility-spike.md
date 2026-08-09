# 04 · How many threads can a phone actually draw?

Type: prototype
Status: open
Blocked by: 03

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
