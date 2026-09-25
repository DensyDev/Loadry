# Loadry

Loadry is a self-hostable download platform for projects with configurable build providers. It is
developed by [Densy](https://github.com/densydev).

The repository is an npm workspace monorepo:

- `apps/frontend` — React, Vite, and HeroUI website
- `apps/backend` — Express API, download handlers, and provider implementations
- `packages/contracts` — public API DTOs and runtime schemas
- `packages/sdk` — framework-independent JavaScript SDK
- `api` — thin Vercel adapter for the shared Express application

Lumi is the first configured project and uses the Reposilite provider. Additional projects and
providers can be added without changing the frontend.

## Development

```bash
npm install
npm run dev
```

The Vite development server mounts the same Express application used in production.

## Validation

```bash
npm run typecheck
npm test
npm run build
```

## SDK

```ts
import { DownloadsClient } from "@densy/loadry-sdk/v1";

const downloads = new DownloadsClient({
  baseUrl: "https://dl.lumi.su",
});

const projects = await downloads.projects.list();
const versions = await downloads.versions.list("lumi", {
  branches: ["dev"],
  limit: 10,
});
```

See `API.md` and `DEPLOYMENT.md` for the public API and deployment architecture.
