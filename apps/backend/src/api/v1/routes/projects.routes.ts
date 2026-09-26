import { Router } from "express";
import type { ProjectCatalog } from "../../../project.catalog.js";
import { VersionService } from "../../../version.service.js";
import {
  asyncHandler,
  parseQuery,
  routeParam,
} from "../../../shared/http.js";
import { serializeProject, serializeVersion } from "../serializers.js";
import { versionLookupQuerySchema, versionsQuerySchema } from "../validation.js";

function requestOrigin(protocol: string, host: string | undefined) {
  return `${protocol}://${host ?? "localhost"}`;
}

type ProjectsRouterOptions = {
  versionsPageSize: number;
  versionsPageSizeStep: number;
};

export function createProjectsRouter(
  projectCatalog: ProjectCatalog,
  options: ProjectsRouterOptions
) {
  const projectsRouter = Router();

  projectsRouter.get("/", asyncHandler(async (request, response) => {
    const projectService = await projectCatalog.getService();
    const origin = requestOrigin(request.protocol, request.get("host"));
    response.setHeader("Cache-Control", "no-store");
    response.json(projectService.projects.map(project => serializeProject(project, origin)));
  }));

  projectsRouter.get(
    "/:projectId/versions/lookup",
    asyncHandler(async (request, response) => {
      const projectService = await projectCatalog.getService();
      const project = projectService.findById(routeParam(request.params.projectId));

      if (!project) {
        response.status(404).json({ message: "Project not found" });
        return;
      }

      const lookup = parseQuery(versionLookupQuerySchema, request.query);
      const result = await new VersionService(project.providers).lookup(
        lookup.branch,
        lookup.filters
      );

      if (result.matches.length === 0) {
        response.status(404).json({ message: "Version not found" });
        return;
      }

      if (result.matches.length > 1) {
        response.status(409).json({
          matches: result.matches.length,
          message: "More than one version matched the lookup filters",
        });
        return;
      }

      const entry = result.matches[0];
      const index = result.branchEntries.indexOf(entry);
      const origin = requestOrigin(request.protocol, request.get("host"));
      const serializeEntry = (candidate: typeof entry | undefined) =>
        candidate ? serializeVersion(project, candidate, origin) : null;

      response.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
      response.json({
        neighbors: {
          newer: serializeEntry(result.branchEntries[index - 1]),
          older: serializeEntry(result.branchEntries[index + 1]),
        },
        position: {
          index,
          newerCount: index,
          olderCount: result.branchEntries.length - index - 1,
          total: result.branchEntries.length,
        },
        version: serializeVersion(project, entry, origin),
      });
    })
  );

  projectsRouter.get(
    "/:projectId/versions",
    asyncHandler(async (request, response) => {
      const projectService = await projectCatalog.getService();
      const projectId = routeParam(request.params.projectId);
      const project = projectService.findById(projectId);

      if (!project) {
        response.status(404).json({ message: "Project not found" });
        return;
      }

      const filters = parseQuery(versionsQuerySchema, request.query);
      const origin = requestOrigin(request.protocol, request.get("host"));

      response.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120");

      if (filters.page !== undefined) {
        const pageSize = Math.min(
          filters.limit ?? options.versionsPageSize,
          options.versionsPageSize
        );
        const result = await new VersionService(project.providers).paginate(
          filters,
          filters.page,
          pageSize
        );
        response.json({
          items: result.items.map(entry => serializeVersion(project, entry, origin)),
          pagination: {
            ...result.pagination,
            maxPageSize: options.versionsPageSize,
            pageSizeStep: options.versionsPageSizeStep,
          },
          series: result.series,
        });
        return;
      }

      const entries = await new VersionService(project.providers).load(filters);
      response.json(entries.map(entry => serializeVersion(project, entry, origin)));
    })
  );

  projectsRouter.get("/:projectId", asyncHandler(async (request, response) => {
    const projectService = await projectCatalog.getService();
    const project = projectService.findById(routeParam(request.params.projectId));

    if (!project) {
      response.status(404).json({ message: "Project not found" });
      return;
    }

    const origin = requestOrigin(request.protocol, request.get("host"));
    response.setHeader("Cache-Control", "no-store");
    response.json(serializeProject(project, origin));
  }));

  return projectsRouter;
}
