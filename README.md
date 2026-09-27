# Loadry

Loadry is a self-hostable download platform for projects with configurable build providers. It is
developed by [Densy](https://github.com/densydev).

The repository is an npm workspace monorepo:

- `apps/frontend` — React, Vite, and HeroUI website
- `apps/backend` — Express API, download handlers, and provider implementations
- `packages/contracts` — public API DTOs and runtime schemas
- `packages/sdk` — framework-independent JavaScript SDK
- `api` — thin Vercel adapter for the shared Express application

Projects are loaded at runtime from JSON configuration. The repository can be deployed unchanged,
then configured through environment variables without maintaining a fork.

## Development

```bash
git clone --recurse-submodules https://github.com/DensyDev/Loadry.git
npm install
npm run dev
```

For an existing checkout, initialize the localization submodule with
`git submodule update --init --recursive`. Translation files and their metadata come from
[`DensyDev/Loadry-Languages`](https://github.com/DensyDev/Loadry-Languages). The frontend validates
the catalog and requires every locale to contain the same keys as `en_US.json`.

After publishing translation changes, update the pinned revision with
`git submodule update --remote apps/frontend/src/locales/data` and commit the changed submodule
pointer in Loadry.

The Vite development server mounts the same Express application used in production.

Copy `loadry.config.example.json` to a compact JSON string and set it as
`LOADRY_CONFIG_JSON`, or publish the document at an HTTP endpoint and set
`LOADRY_CONFIG_URL`. Inline configuration takes precedence. A remote endpoint can optionally use
the bearer token from `LOADRY_CONFIG_TOKEN` and is refreshed every
`LOADRY_CONFIG_CACHE_TTL_SECONDS` seconds.

With neither setting present, Loadry starts normally with an empty project catalog and shows setup
instructions instead of serving a built-in project.

The optional top-level `site` object customizes the browser title, header brand, and footer at
runtime. Text may be a string or a locale map such as `{ "en_US": "Downloads", "ru_RU":
"Загрузки" }`. Templates support `{site.name}`, `{project.name}`, `{project.id}`, and `{year}`.
See `loadry.config.example.json` for a complete example.

Paginated version lists contain 50 builds by default. Set `LOADRY_VERSIONS_PAGE_SIZE` to a value
from `1` to `1000` to change the server-controlled page size. The page-size control increments by
5; set `LOADRY_VERSIONS_PAGE_SIZE_STEP` to another positive divisor of the page size to change it.

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
