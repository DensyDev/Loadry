import { Router } from "express";
import { createProjectsRouter } from "./routes/index.js";
import type { ProjectCatalog } from "../../project.catalog.js";

type ApiV1Options = {
  versionsPageSize: number;
  versionsPageSizeStep: number;
};

export function createApiV1Router(projectCatalog: ProjectCatalog, options: ApiV1Options) {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({ status: "ok", version: "v1" });
  });

  router.use("/projects", createProjectsRouter(projectCatalog, options));

  return router;
}
