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

Translations are provided by the `apps/frontend/src/locales/data` Git submodule. Initialize it with
`git submodule update --init --recursive` before local or custom builds. Git-based Vercel builds
require the submodule repository to be publicly accessible over HTTPS.

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

Loadry also includes standard Maven and manually configured static providers. Every provider has
the common fields `type`, `id`, `label`, and `branch`. `branchLabel` defaults to
`branches.<branch>`, while `showInAllBranches` defaults to `true`.

### Reposilite provider

The `reposilite` provider uses Reposilite's details API, so it can discover every deployed JAR,
its precise modification time, checksums, and optional adjacent `.properties` files. Its complete
shape is demonstrated in `loadry.config.example.json`.

### Maven provider

The `maven` provider works with repositories using the standard Maven 2 layout. It discovers
versions through `maven-metadata.xml` and resolves timestamped snapshots through their
version-level metadata.

```json
{
  "type": "maven",
  "id": "maven-releases",
  "label": "Maven releases",
  "branch": "stable",
  "baseUrl": "https://repo.example.com/releases",
  "groupId": "com.example",
  "artifactId": "example",
  "extension": "jar",
  "classifier": null,
  "checksumAlgorithm": "sha1",
  "includeProperties": true
}
```

`extension` defaults to `jar`. Set `classifier` when the downloadable artifact has one. Set
`fileArtifactId` when the coordinate used for metadata and the artifact file prefix differ.
`checksumAlgorithm` may be `md5`, `sha1`, `sha256`, `sha512`, or `null`; Loadry only exposes the
checksum action when that file exists. When `includeProperties` is enabled, Loadry looks for an
adjacent file with the artifact extension replaced by `.properties` and uses Git properties to
build source links.

Maven and Reposilite builds expose their repository and artifact coordinates in the API. The
download menu uses them to generate ready-to-copy Maven, Gradle Kotlin, Gradle Groovy, and SBT
repository and dependency declarations, including snapshot versions and classifiers.

### Static provider

The `static` provider accepts entries directly in the Loadry configuration. It is useful for files
hosted on a website, object storage, or a release service without a supported discovery API.

```json
{
  "type": "static",
  "id": "manual-releases",
  "label": "Manual releases",
  "branch": "stable",
  "entries": [
    {
      "version": "1.4.0",
      "fileName": "example-1.4.0.jar",
      "downloadUrl": "https://downloads.example.com/example-1.4.0.jar",
      "modifiedAt": "2026-09-27T12:00:00Z",
      "sourceText": "Release 1.4.0",
      "sourceUrl": "https://github.com/example/project/releases/tag/1.4.0",
      "properties": {
        "git.commit.id": "abc123"
      }
    }
  ]
}
```

Only `version`, `fileName`, and `downloadUrl` are required for each entry. `logicalVersion`
defaults to `version`, `series` is derived from the logical version, and a stable entry ID is
generated automatically. `modifiedAt` accepts an ISO 8601 timestamp or a Unix timestamp.

Provider implementations register their schema and factory together in
`apps/backend/src/providers/registry.ts`. Adding a built-in provider requires a provider module and
one registry entry; `project.config.ts` does not contain provider-specific schemas or factory
branches.

Inline JSON takes precedence over the remote URL. Remote configuration is cached for 60 seconds by
default and may be protected with the bearer token in `LOADRY_CONFIG_TOKEN`. Change the refresh
interval with `LOADRY_CONFIG_CACHE_TTL_SECONDS`.

`LOADRY_VERSIONS_PAGE_SIZE` controls how many builds the website requests per page. It defaults to
`50` and accepts values from `1` to `1000`. `LOADRY_VERSIONS_PAGE_SIZE_STEP` controls the increment
of the page-size selector, defaults to `5`, and must evenly divide the configured page size.

## Site appearance

The optional top-level `site` object controls the public frontend without rebuilding it:

- `name` is the site name and the fallback browser title;
- `title` is the browser-title template used on project pages;
- `header.brand` and `header.url` configure the header link;
- `footer.enabled`, `footer.text`, and `footer.links` configure the footer.

All visible text fields accept either one string or an object keyed by locale code. When the
active locale is absent, Loadry falls back to English and then to the first configured value.
Strings and URLs may contain `{site.name}`, `{project.name}`, `{project.id}`, and `{year}`.
Footer link icons are optional and may be `github`, `book-open`, `globe`, `external-link`, or
`message-circle`. Public links accept relative paths plus `http`, `https`, and `mailto` URLs.
Omitting `site` preserves the standard Loadry title and enables a minimal GitHub footer.

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
