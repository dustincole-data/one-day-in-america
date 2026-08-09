# 01 · Repo, stack, and subdomain

Type: task
Status: **claimed 2026-08-09** · claude (opus)
Blocked by: —

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
