# 01 · Repo, stack, and subdomain

Type: task
Status: **resolved 2026-08-09** · claude (opus) · one open manual step (DNS)
Blocked by: —

## Resolution

Shell exists, builds, and **is live** — the deploy path was proven end to end, not assumed.

| | |
|---|---|
| Repo (local) | `C:\Users\dusti\Projects\One_Day_In_America\` — `git init -b main`, first commit `abe14ef` |
| Remote | `git@github.com:dustincole-data/one-day-in-america.git` (public, SSH). Push with `GIT_SSH_COMMAND="ssh -o BatchMode=yes"` |
| Vercel project | `one-day-in-america` · `prj_BlGr6IDC79zXOAP16ifpEaaFK70u` · team `dustincole-datas-projects` |
| Git link | GitHub → Vercel, production branch `main` |
| Live (alias) | https://one-day-in-america.vercel.app — **verified 200, real HTML** |
| Live (custom) | https://oneday.dustincoledata.com — **not resolving yet, DNS pending (below)** |

**Stack: Astro 7 static → Vercel.** `output: 'static'`, no adapter, TypeScript strict, vanilla
client JS, vitest. Chosen by matching, not by picking fresh: the four most recent projects
(Where America Moves, Deep Time, Climate Fingerprint, Namesake) are all exactly this, and the one
this most resembles — Where America Moves — is a build-time data bake plus one heavy custom mark,
which is this project's shape too. Nothing here constrains Fable's design: canvas, SVG, or WebGL
all ship fine out of a static Astro page.

**Subdomain: `oneday.dustincoledata.com`** (Dustin's pick, 2026-08-09; alternatives offered were
`onedayinamerica.`, `1440.`, `aday.`). Attached to the Vercel project already, `verified: true`
(the apex is verified team-side, so the subdomain needs no TXT challenge).

**Deploy reality — the true answer, measured:**

- **`git push origin main` auto-deploys to production.** Measured: pushed `ef4064a`, polled the
  Vercel API, a `production` deployment for that exact SHA reached `READY` with no CLI involvement.
  **Do not run `npx vercel --prod --yes` on this project** — that is the workaround for the
  sibling projects that were created CLI-first with no git link (statistical-illusions,
  why-do-they, redraft-*). This one is git-linked from birth, which is why it behaves.
- Linking a repo does **not** deploy retroactively — after project creation, deployments were 0
  until the next push.
- **Verify on the alias, never the per-deployment URL.** `one-day-in-america.vercel.app` returns the
  real page; `one-day-in-america-<hash>-dustincole-datas-projects.vercel.app` returns **HTTP 200
  carrying the Vercel SSO login page**. A naïve status check on that URL passes while showing
  nothing. Grep the HTML for a marker.

**DNS — the one manual step, Dustin's to do.** `dustincoledata.com` sits on Namecheap BasicDNS
(`dns1/dns2.registrar-servers.com`), so Vercel cannot write the record. Add at Namecheap → Advanced
DNS:

> Type `CNAME` · Host `oneday` · Value `3e4803086c51b69e.vercel-dns-017.com.` · TTL automatic

Non-obvious and worth keeping: Vercel mints a **per-domain** CNAME target — the siblings resolve to
`d90d5b329ae0d868…`, `7e6cbd6a7a2ff269…`, `8ad01233828fbe3f….vercel-dns-017.com`, all different. It
is *not* the shared `cname.vercel-dns.com` (offered only as rank-2 fallback). So the domain must be
added in Vercel *first*, then the value read back — the record cannot be written ahead of time.
Nothing is linked to the subdomain yet, so this can wait; the page it will serve is a placeholder
and is `noindex` until the piece ships.

**What is checked in:** app shell (`src/pages/index.astro`, one placeholder page), `astro.config.mjs`,
`vercel.json`, `tsconfig.json`, `.gitignore`, `README.md`, plus the plan (`.claude/plans/`) and the
ticket-02 provenance record (`research/`). Gitignored and build-generated: `data/raw/` (ATUS
downloads), `src/data/` + `public/data/` (baked payload), `public/og/`.

**Not done, deliberately:** no data pipeline, no mark, no OG card, no fonts, no registry entry on
dustincoledata.com. The ticket says set up the shell, not build.

## Question

Where does this project physically live and what does it get built with, so every later ticket has
a home to write into?

Decide and set up:

- **Repo:** own repo at `C:\Users\dusti\Projects\One_Day_In_America\` (this plan folder already
  sits there), or somewhere else. Git remote + whether push auto-deploys.
- **Stack:** framework and deploy target. Check what the last four projects used and why — the
  answer is probably "match the one whose shape this most resembles", not "pick fresh".
- **Subdomain:** name it. `oneday.` / `onedayinamerica.` / something better. Confirm the DNS path
  (Namecheap CNAME → Vercel) and whether that is a manual step Dustin must do.
- **Deploy reality:** does `git push` actually deploy, or is `npx vercel --prod --yes` required?
  This has bitten three prior projects. Record the true answer in the resolution.

Do not build anything. Set up the shell and record the facts later tickets depend on.
