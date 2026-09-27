import type { Site } from "@densy/loadry-contracts";
import type { DownloadProject } from "./types.js";
import { normalizeDomain } from "./project.js";

export class ProjectService {
  readonly projects: DownloadProject[];
  readonly site: Site;

  constructor(projects: DownloadProject[], site: Site) {
    this.projects = projects;
    this.site = site;
  }

  findById(projectId: string | undefined) {
    return this.projects.find(project => project.id === projectId) ?? null;
  }

  findByDomain(hostname: string) {
    const normalizedHostname = normalizeDomain(hostname);

    for (const project of this.projects) {
      if (project.domains.some(domain => normalizeDomain(domain) === normalizedHostname)) {
        return project;
      }
    }

    return null;
  }

  getDefault() {
    return this.projects[0] ?? null;
  }
}
