import { healthSchema } from "@densy/loadry-contracts";
import type { HttpClient } from "../common/http-client.js";

export class HealthResource {
  constructor(private readonly http: HttpClient) {}

  check(options: { signal?: AbortSignal } = {}) {
    return this.http.get("/api/v1/health", healthSchema, options);
  }
}
