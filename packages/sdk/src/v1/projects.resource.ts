import { projectSchema } from "@densy/loadry-contracts";
import { z } from "zod";
import type { HttpClient } from "../common/http-client.js";

export class ProjectsResource {
  constructor(private readonly http: HttpClient) {}

  list(options: { signal?: AbortSignal } = {}) {
    return this.http.get("/api/v1/projects", z.array(projectSchema), options);
  }

  get(projectId: string, options: { signal?: AbortSignal } = {}) {
    return this.http.get(
      `/api/v1/projects/${encodeURIComponent(projectId)}`,
      projectSchema,
      options
    );
  }
}
