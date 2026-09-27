import { Router } from "express";
import { createProjectsRouter } from "./routes/index.js";
import { requestOrigin } from "./routes/projects.routes.js";
import { serializeProject } from "./serializers.js";
import type { ProjectCatalog } from "../../project.catalog.js";
import { asyncHandler } from "../../shared/http.js";

type ApiV1Options = {
  versionsPageSize: number;
  versionsPageSizeStep: number;
};

export function createApiV1Router(projectCatalog: ProjectCatalog, options: ApiV1Options) {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({ status: "ok", version: "v1" });
  });

  router.get("/catalog", asyncHandler(async (request, response) => {
    const projectService = await projectCatalog.getService();
    const origin = requestOrigin(request.protocol, request.get("host"));
    response.setHeader("Cache-Control", "no-store");
    response.json({
      projects: projectService.projects.map(project => serializeProject(project, origin)),
      site: projectService.site,
    });
  }));

  router.use("/projects", createProjectsRouter(projectCatalog, options));

  return router;
}
