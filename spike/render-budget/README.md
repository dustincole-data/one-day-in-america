# THROWAWAY — render feasibility spike (ticket 04)

Not the build. Ugly on purpose. Nothing here ships: Astro only builds `src/` + `public/`,
so this directory is never deployed.

Answers one question: **what render budget must Fable design inside?**

```
node spike/render-budget/bake.mjs      # data/extract/*.csv -> packed .bin + payload report
node spike/render-budget/decimate.mjs  # weighted sampling fidelity vs the full population
node spike/render-budget/serve.mjs     # http://127.0.0.1:4399/?tech=webgl&n=8000&mode=anim
```

The answer lives in [`research/04-render-budget/findings.md`](../../research/04-render-budget/findings.md).
Once ticket 09 hands Fable the brief, delete this directory.

## Harness params

`tech` `c2d_rect` · `c2d_batched` · `c2d_baked` · `webgl` · `cpuburn` (throttle canary)
`n` threads (or `ns=` ladder) · `layout` `rows|ribbon` · `blend` `alpha|multiply`
`alpha` per-thread opacity · `rep` scene redraws per frame · `msaa` 0|1
`frames` measured frames · `year` 2019|2023|2024|all · `probe=blend`

Every run animates — the ceiling reported is the animated one, worst case.
The one-off static draw is reported separately as `firstDrawMs`.

`node spike/render-budget/drive.mjs --matrix=matrixN.json --out=resultsN.json`

| matrix | results | what it settled |
|---|---|---|
| `matrix.json` | `results.json` | first pass — superseded: `gl.finish()` did not block, so its WebGL `drawMs` is CPU submit time only |
| `matrix2.json` | `results2.json` | real GPU timing (readPixels sync) · MSAA-on ribbon ladder · the context-loss kill · corrected blend probe |
| `matrix3.json` | `results3.json` | CPU-throttle control (flat → GPU-bound) · MSAA on/off · noise triplicate · desktop · screenshots |
| `matrix4.json` | `results4.json` | the derated (`rep=4`) budget, MSAA off — the table in the findings |
| `matrix5/6.json` | `results5/6.json` | DPR lever; 6 is the interleaved A/B that overturned 5's outlier |
| — | `decimation.json` | `decimate.mjs` output: PPS vs head/strided/random |
