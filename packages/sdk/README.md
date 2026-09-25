# @densy/loadry-sdk

Type-safe SDK for the public Loadry API.

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
