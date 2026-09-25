import { HttpClient, type DownloadsClientOptions } from "../common/http-client.js";
import { DownloadsResource } from "./downloads.resource.js";
import { HealthResource } from "./health.resource.js";
import { ProjectsResource } from "./projects.resource.js";
import { VersionsResource } from "./versions.resource.js";

export class DownloadsClient {
  readonly downloads: DownloadsResource;
  readonly health: HealthResource;
  readonly projects: ProjectsResource;
  readonly versions: VersionsResource;

  constructor(options: DownloadsClientOptions = {}) {
    const http = new HttpClient(options);
    this.downloads = new DownloadsResource(http);
    this.health = new HealthResource(http);
    this.projects = new ProjectsResource(http);
    this.versions = new VersionsResource(http);
  }
}
