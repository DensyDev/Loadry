import { catalogSchema } from "@densy/loadry-contracts";
import type { HttpClient } from "../common/http-client.js";

export class CatalogResource {
  constructor(private readonly http: HttpClient) {}

  get(options: { signal?: AbortSignal } = {}) {
    return this.http.get("/api/v1/catalog", catalogSchema, {
      ...options,
      cache: "no-store",
    });
  }
}
