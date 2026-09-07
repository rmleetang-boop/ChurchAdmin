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
