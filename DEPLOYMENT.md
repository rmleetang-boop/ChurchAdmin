# Fly.io deployment

The repository is prepared for a Docker-based Fly.io deployment. The app listens on Fly's internal port `3000`, serves the compiled Vite client from `dist/public`, and exposes `GET /healthz` for Fly health checks.

## 1. Create or select the Fly app

Install and authenticate the Fly CLI, then replace the placeholder `app` value in `fly.toml` with a globally unique name:

```bash
fly auth login
fly apps create YOUR_UNIQUE_APP_NAME
```

Set the same name in `fly.toml`.

## 2. Configure runtime secrets

Set the server-side values as Fly secrets. Do not commit them to the repository:

```bash
fly secrets set \
  DATABASE_URL='mysql://...' \
  JWT_SECRET='generate-a-long-random-secret' \
  VITE_APP_ID='...' \
  OAUTH_SERVER_URL='https://...' \
  OWNER_OPEN_ID='...' \
  BUILT_IN_FORGE_API_URL='https://...' \
  BUILT_IN_FORGE_API_KEY='...'
```

`DATABASE_URL` must point to an externally managed MySQL-compatible database; the app does not provision a database on Fly. `JWT_SECRET`, OAuth, owner, and Forge values are consumed by the server at runtime.

## 3. Provide browser build arguments

The browser bundle reads these values through Vite and therefore needs them at image build time:

```bash
fly deploy \
  --build-arg VITE_APP_ID="$VITE_APP_ID" \
  --build-arg VITE_OAUTH_PORTAL_URL="$VITE_OAUTH_PORTAL_URL" \
  --build-arg VITE_FRONTEND_FORGE_API_URL="$VITE_FRONTEND_FORGE_API_URL" \
  --build-arg VITE_FRONTEND_FORGE_API_KEY="$VITE_FRONTEND_FORGE_API_KEY"
```

These values are intentionally `ARG`s in the `Dockerfile`; Vite embeds them into the client assets. Treat the frontend Forge key as public browser configuration, not as a server secret.

## 4. Apply the schema and deploy

Run the Drizzle migration command against the configured database from a trusted environment, then deploy:

```bash
pnpm install --frozen-lockfile
DATABASE_URL='mysql://...' pnpm db:push
fly deploy
```

The Fly health check polls `/healthz` every 30 seconds. Confirm the deployed service with:

```bash
fly status
fly checks list
fly logs
```

## OAuth callback

Register the production callback URL with the OAuth provider using this form:

```text
https://YOUR_UNIQUE_APP_NAME.fly.dev/api/oauth/callback
```

If a custom domain is used, register the custom-domain equivalent instead.
