# One Day in America

A near-wordless data-art piece about the shape of a single American day, built from BLS **American
Time Use Survey** minute-level respondent-day microdata.

**Live:** [oneday.dustincoledata.com](https://oneday.dustincoledata.com) · part of
[dustincoledata.com](https://dustincoledata.com)

> **Status: shell only.** The page live today is a placeholder that exists to prove the deploy path.
> The piece itself is not built. Plan and progress: [`.claude/plans/one-day-in-america/map.md`](.claude/plans/one-day-in-america/map.md).

## Stack

| | |
|---|---|
| Framework | **Astro 7**, `output: 'static'`, no adapter |
| Host | **Vercel**, static output from `dist/` |
| Language | TypeScript (strict), vanilla client JS — no UI framework |
| Tests | vitest |
| Node | ≥22 local; Vercel builds on its default 22.x |

Chosen to match the four most recent projects (Where America Moves, Deep Time, Climate Fingerprint,
Namesake), which share this exact shape: a build-time data bake plus one heavy custom mark. No
runtime, no database, no serverless.

## Develop

```bash
npm ci
npm run dev      # Astro dev server
npm run build    # static build → dist/
npm run test     # vitest
```

> If `astro dev` misbehaves, it is inheriting agent/tooling env vars — launch a clean shell.

## Deploy

`git push origin main` → **Vercel auto-deploys.** The Vercel project `one-day-in-america` is linked
to this GitHub repo, so a push to `main` is a production deploy; `npx vercel --prod --yes` is not
needed and should not be used. (Several sibling projects were created CLI-first with no git link and
do need the manual command — this one is not one of them.)

Verify a deploy landed by fetching the live URL and grepping for a marker in the HTML, not by
trusting the push.

## Data

BLS American Time Use Survey — **U.S. public domain**, redistribution permitted, cite BLS as source.
The **BLS emblem is a registered trademark and must not appear on the site.**

The source was interrogated before any code:
[`research/02-atus-source/findings.md`](research/02-atus-source/findings.md) — file/join semantics,
weights, universe, lexicon comparability, the 4 a.m. day boundary, licence, and **12 numbered
decisions (S1–S12) that bind the build**. Read it before touching the data.

Raw ATUS downloads are fetched by the pipeline at build time and never committed; their URLs, byte
sizes, and SHA-256s are pinned in that record and re-verified on every fetch.

## What's checked in vs generated

- **Checked in:** app source, styles, fonts, the pipeline scripts, the plan (`.claude/plans/`), and
  the provenance record (`research/`).
- **Gitignored + generated at build:** `data/raw/` (ATUS downloads), `src/data/` and `public/data/`
  (baked JSON payload), `public/og/` (OG cards).
