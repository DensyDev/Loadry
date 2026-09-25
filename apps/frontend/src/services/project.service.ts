import type { Project } from "@densy/loadry-contracts";
import { normalizeDomain } from "../utils/project.js";

export class ProjectService {
  readonly projects: Project[];

  constructor(projects: Project[]) {
    this.projects = projects;
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
