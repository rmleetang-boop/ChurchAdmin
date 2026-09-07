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

## Anonymous prayer requests (2026-09-07, session 3)
- Schema: `prayer_requests.isAnonymous` (migration `drizzle/0006_round_leper_queen.sql`). Run `pnpm db:push` against the DB when DATABASE_URL is available.
- tRPC `member.submitPrayer` accepts `isAnonymous` (forces private). `admin.prayerRequests` redacts `memberId` (→ 0) for anonymous rows.
- Member app: "Send anonymously" checkbox + explainer + Anonymous badge on own requests. Admin Care inbox: "Anonymous member" with badge, "Identity hidden by request", and anonymous count in summary.

## Prayer replies (2026-09-07, session 4)
- New table `prayer_replies` (migration `0007_needy_grandmaster.sql`). `admin.replyToPrayer` inserts reply, creates a `member_notifications` (type care) row for the request owner server-side (leader never sees memberId for anonymous), auto-moves status new→praying. `admin.prayerRequests` / `member.prayerRequests` now include `replies[]`.
- Care inbox extracted to `client/src/components/CareInbox.tsx`: "Send encouragement" → inline composer with quick replies, privacy note for anonymous, reply thread bubbles, "awaiting a reply" counter.
- Member app: reply bubbles under each request + Care-type notification.

## Blank-page investigation and repair (2026-09-07, current session)

### Original request and user choices
Original problem statement: "https://heirsofpromise-sanctuary.fly.dev/\n\nNot loading, repo attached".
User: "Start the task now". Clarification: "A blank page".
Latest user instruction: "No testing needed for now". No further testing was performed after that instruction.

### Findings
- The live homepage loaded successfully in a fresh browser; a universal live outage was not reproduced.
- The live `churchflow-shell-v1` service worker permanently cached HTML, scripts, API responses and errors, and returned the homepage for failed asset requests. The server also returned HTML with status 200 for missing JavaScript assets.
- Reproduced a completely blank page by simulating a returning browser whose cached HTML referenced an asset removed by a newer release. This demonstrates a concrete cause consistent with the report, not proof of the user's exact browser state.
- The attached repository is a Node/Express/tRPC + Vite/React application, not the default FastAPI template. Existing template supervisor processes could not start because `/app/backend` and `/app/frontend` do not exist.

### Implemented changes (repository and preview only)
- `client/public/sw.js`: v2 worker deletes obsolete ChurchFlow caches, claims and navigates existing tabs after migration (works even if React never loads), fetches navigation from the network, caches only successful fingerprinted same-origin build assets, excludes APIs and external requests, and never substitutes HTML for JavaScript.
- `client/public/offline.html`: privacy-safe offline screen with a retry action, no cached church/member data.
- `client/public/boot.js` and `client/index.html`: visible startup fallback, timeout/script-failure recovery, retry action, JavaScript-disabled notice, worker registration independent of the application bundle with HTTP-cache bypass for worker updates.
- `client/src/main.tsx`: removed duplicate late worker registration.
- `server/_core/vite.ts`: no-store HTML/worker/bootstrap, immutable fingerprinted assets, proper 404 for missing assets/APIs, content-type sniffing protection, fail startup if the built HTML is missing.
- `server/_core/index.ts`: require a valid configured port and fail rather than silently selecting an unreachable port; return a failing exit status for startup exceptions.
- Existing UI and feature behavior preserved. No new integrations, database credentials, or user accounts were added.
- Local preview runs the built Node app using `scripts/churchflow-supervisor.conf` (web at configured PORT, API at configured API_PORT). Root `.env` holds preview URL/ports and is git-ignored. Supervisor configuration copied into `/etc/supervisor/conf.d/churchflow.conf`; re-copy if this environment is recreated. Existing read-only template supervisor configuration was not edited.
- Installed dependencies using Yarn with `SKIP_YARN_COREPACK_CHECK=1` for the repository's pnpm packageManager field. Original package.json and pnpm-lock.yaml retained; incidental yarn.lock removed to avoid introducing a second lockfile.

### Verification already completed before the user stopped testing
- Production build successful; `yarn run check` TypeScript check passed; 8 existing Vitest tests passed.
- Preview browser rendered Overview and People; repeat visit rendered successfully. Screenshots were captured.
- Full worker-migration/offline/failure-recovery regression testing and a deployment health audit have NOT been completed. User requested no further testing.
- No change was applied to the public Fly site. It still serves the v1 worker as last observed. No Fly credential is available in this session.

### Prioritized backlog / next tasks
- P0: Apply these repository changes to the public site through the user's existing release workflow when authorized; the live fix is not yet applied.
- P1: When requested, verify real v1-to-v2 worker migration, offline/reconnect flow, script-download failure recovery, and API cache exclusion; add automated regression coverage.
- P2: Add lightweight loading-failure monitoring so blank-screen errors are visible to maintainers.
- Existing database/OAuth setup and feature backlogs above remain outside this bug-fix scope.
