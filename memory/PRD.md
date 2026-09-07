# ChurchFlow Admin (Heirs of Promise Sanctuary) — Fly.io deployment

## Problem statement
https://heirsofpromise-sanctuary.fly.dev/ was not launching. Fix it (Fly token provided).

## Stack
Node 22 + Express + tRPC + Drizzle (MySQL) server, Vite/React 19 client, pnpm 10.4.1, Docker on Fly.io (app `heirsofpromise-sanctuary`, region iad).

## Root cause (fixed 2026-09-07)
`dist/index.js` statically imported `vite` (devDependency) via `server/_core/vite.ts`; the runtime image only installs prod deps -> `ERR_MODULE_NOT_FOUND`, crash loop, machine stopped.

## Fix
- Split `server/_core/vite.ts` -> `serveStatic` only; new `server/_core/viteDev.ts` holds `setupVite`.
- `server/_core/index.ts` lazy-loads `./viteDev` only when NODE_ENV=development.
- `package.json` build adds `--splitting` so esbuild emits viteDev as a separate chunk.
- Redeployed via `fly deploy --remote-only`. Health check passing, root 200.

## Notes / backlog
- No Fly secrets set (DATABASE_URL, JWT_SECRET, OAUTH_SERVER_URL, etc.). App runs with mock/empty data; login (OAuth) and DB-backed features will not work until secrets are configured.
- Fly token stored temporarily at /tmp/flytoken (non-persistent).

## Premium redesign + features (2026-09-07, session 2)
- Dark luxe theme: ink backgrounds, gold accents, Fraunces serif display + Albert Sans + IBM Plex Mono; grain overlay, glass topbar, staggered entrance motion. All existing views re-skinned via `client/src/index.css`.
- Demo data layer `client/src/data/demo.ts` (56 seeded members, funds, pledges, teams). DEMO DATA ONLY — no DB.
- People directory (`components/people/PeopleDirectory.tsx`): search + filters (branch, status, department, age group, gender, joined range, last attendance, tags), CSV export, profile drawer (`MemberDrawer.tsx`: contact, 12-week attendance, streak, giving history, tags, notes).
- Overview: Birthdays & anniversaries widget (one-tap greet), attendance heat-map by branch, retention alerts (missed 3+ Sundays → Reach out opens profile).
- Giving insights: per-fund sparklines, top funds ranking, pledge tracking.
- ⌘K / Ctrl+K command palette (sections, people, events, giving).
- Volunteers section: serving teams roster + 4-Sunday schedule with confirm/swap/remind.
- Not deployed (user request). User to push via "Save to GitHub".

## Backlog
- Wire People/Volunteers/Giving to real MySQL via tRPC once DATABASE_URL is provided.
- Fly secrets (DATABASE_URL, JWT_SECRET, OAUTH_*) still unset.
