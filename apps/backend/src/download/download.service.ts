import type { ProjectCatalog } from "../project.catalog.js";
import type { VersionEntry } from "../types.js";
import { VersionService } from "../version.service.js";

export class DownloadService {
  constructor(private readonly projectCatalog: ProjectCatalog) {}

  async resolve(
    projectId: string | null,
    branch: string,
    target: string
  ): Promise<VersionEntry | null> {
    const projectService = await this.projectCatalog.getService();
    const project = projectId
      ? projectService.findById(projectId)
      : projectService.getDefault();

    if (!project) {
      return null;
    }

    const entries = await new VersionService(project.providers).loadAll();

    if (target === "latest") {
      return entries.find(entry => entry.branch === branch) ?? null;
    }

    const candidates = entries.filter(
      entry => entry.branch === branch && entry.fileName === target
    );
    return candidates.length === 1 ? candidates[0] : null;
  }
}
