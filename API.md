# Loadry Public API

The public API is implemented by the Express application in `apps/backend` and versioned
independently from the website and SDK. The current base path is `/api/v1`.

All API endpoints support cross-origin `GET`, `HEAD`, and `OPTIONS` requests.

## SDK

The official client is available from `@densy/loadry-sdk/v1`:

```ts
import { DownloadsClient } from "@densy/loadry-sdk/v1";

const downloads = new DownloadsClient({
  baseUrl: "https://dl.lumi.su",
});

const projects = await downloads.projects.list();
const versions = await downloads.versions.list("lumi", {
  branches: ["dev"],
  versions: ["1.6"],
  limit: 10,
});
```

The SDK uses the platform `fetch` implementation and works in modern browsers and Node.js.

## Health

```http
GET /api/v1/health
```

```json
{
  "status": "ok",
  "version": "v1"
}
```

SDK:

```ts
await downloads.health.check();
```

## Projects

```http
GET /api/v1/projects
GET /api/v1/projects/{projectId}
```

Projects contain public metadata, branches, forwarded domains, providers, and links.

SDK:

```ts
await downloads.projects.list();
await downloads.projects.get("lumi");
```

## Versions

```http
GET /api/v1/projects/{projectId}/versions
```

| Parameter | Description |
| --- | --- |
| `branches` | Branch IDs separated by commas or passed multiple times |
| `versions` | Version series separated by commas or passed multiple times |
| `limit` | Maximum result count from `1` to `1000` |

Examples:

```http
GET /api/v1/projects/lumi/versions?branches=dev
GET /api/v1/projects/lumi/versions?branches=stable,dev&versions=1.6,1.5
GET /api/v1/projects/lumi/versions?branches=dev&versions=1.6&limit=1
```

Without `branches`, the endpoint returns only entries configured for the all-branches view.
Passing a branch explicitly also makes hidden branches available. Version responses can include
provider-specific build metadata in `properties`.

SDK:

```ts
await downloads.versions.list("lumi", {
  branches: ["stable", "dev"],
  versions: ["1.6"],
  limit: 20,
});
```

## Version lookup

```http
GET /api/v1/projects/{projectId}/versions/lookup
```

`branch` and at least one exact-match field are required:

```http
GET /api/v1/projects/lumi/versions/lookup?branch=dev&properties.git.commit.id=34306164cd295823eb701f3ea8d4aa71de79e6ab
GET /api/v1/projects/lumi/versions/lookup?branch=dev&fileName=Lumi-1.6.4-20260624.173236-4.jar
GET /api/v1/projects/lumi/versions/lookup?branch=dev&providerId=dev-snapshots&version=1.6.4-20260624.173236-4
```

Primitive version fields and arbitrary `properties.{key}` values are searchable. Multiple filters
are combined with logical AND. A unique result contains the version, neighboring builds, and its
position in the selected branch.

SDK:

```ts
await downloads.versions.lookup("lumi", {
  branch: "dev",
  fields: {
    "properties.git.commit.id": "34306164cd295823eb701f3ea8d4aa71de79e6ab",
  },
});
```

The endpoint returns `404` when nothing matches and `409` when the lookup is not unique.

## Downloads

```http
GET /download/{projectId}/{branch}/latest
GET /download/{projectId}/{branch}/{fileName}
```

Legacy routes without a project ID resolve against the first configured project:

```http
GET /download/{branch}/latest
GET /download/{branch}/{fileName}
```

SDK:

```ts
const url = downloads.downloads.getLatestUrl("lumi", "dev");
const response = await downloads.downloads.fetchFile("lumi", "dev", "Lumi-1.6.4.jar");
```

## Errors

Errors contain at least a message:

```json
{
  "message": "Project not found"
}
```

Invalid query parameters return `400` with validation details. The SDK throws
`DownloadsApiError` for non-success responses and `InvalidApiResponseError` when a response does
not match the published contract.

Future incompatible APIs can be mounted under `apps/backend/src/api/v2` and exposed through
`@densy/loadry-sdk/v2` without changing v1.
