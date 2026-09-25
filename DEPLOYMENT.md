# Loadry deployment

Loadry is structured as a monorepo but deployed as one application by default.

## Workspaces

- `apps/frontend` — Vite static application
- `apps/backend` — platform-neutral Express application
- `packages/contracts` — public DTOs and runtime schemas
- `packages/sdk` — API client used by the frontend and external consumers
- `api/server.ts` — Vercel-specific adapter

The frontend does not import providers or backend configuration. It loads projects and versions
through `@densy/loadry-sdk/v1`.

## Projects and providers

Projects are configured at runtime with `LOADRY_CONFIG_JSON` or `LOADRY_CONFIG_URL`. The JSON shape
is documented by `loadry.config.example.json`. Each project defines:

- a unique ID;
- a display name and description;
- ordered forwarding domains;
- version provider instances.

If the same domain is assigned more than once, the first matching project wins. The repository has
no built-in project, so a stock deployment starts with an empty catalog. The example configuration
shows Lumi using Reposilite release, snapshot, and legacy providers.

Inline JSON takes precedence over the remote URL. Remote configuration is cached for 60 seconds by
default and may be protected with the bearer token in `LOADRY_CONFIG_TOKEN`. Change the refresh
interval with `LOADRY_CONFIG_CACHE_TTL_SECONDS`.

## Routes

Frontend:

- `/project/:projectId`
- `/p/:projectId`

API:

- `/api/v1/*`

Downloads:

- `/download/:projectId/:branch/latest`
- `/download/:projectId/:branch/:fileName`
- `/download/:branch/latest`
- `/download/:branch/:fileName`

## Local development

```bash
npm install
npm run dev
```

`apps/frontend/vite.config.ts` mounts the Express application as Vite middleware, so local routes
behave like production without a separate backend process.

An external frontend can set `VITE_LOADRY_API_URL`. The default is the current origin.

## Vercel

The repository is one Vercel Project:

```text
/                 -> apps/frontend/dist
/api/*            -> Express Vercel Function
/download/*       -> Express Vercel Function
```

`vercel.json` builds all workspaces and publishes `apps/frontend/dist`. API and download rewrites
target the thin `api/server.ts` adapter, which imports the shared Express application from
`apps/backend`.

The Vercel adapter uses redirect delivery for large provider files. Vite and other Node hosts use
stream delivery. Provider files are never fully buffered before being sent to the client.

## Other Node hosts

`createServerApp()` is exported from `@densy/loadry-backend`. A Node, container, or serverless
adapter can mount it without depending on Vercel:

```ts
import { createServerApp } from "@densy/loadry-backend";

const app = createServerApp(process.env);
app.listen(3000);
```

Public read-only CORS headers are applied to `/api` and `/download`, allowing the SDK to be used
from browser applications hosted on other domains.
