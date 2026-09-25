import {
  type ListVersionsOptions,
  type LookupVersionOptions,
  versionLookupResultSchema,
  versionSchema,
} from "@densy/loadry-contracts";
import { z } from "zod";
import type { HttpClient } from "../common/http-client.js";

type RequestOptions = {
  signal?: AbortSignal;
};

export class VersionsResource {
  constructor(private readonly http: HttpClient) {}

  list(projectId: string, filters: ListVersionsOptions = {}, options: RequestOptions = {}) {
    const query = new URLSearchParams();
    appendList(query, "branches", filters.branches);
    appendList(query, "versions", filters.versions);

    if (filters.limit !== undefined) {
      query.set("limit", String(filters.limit));
    }

    return this.http.get(
      withQuery(`/api/v1/projects/${encodeURIComponent(projectId)}/versions`, query),
      z.array(versionSchema),
      options
    );
  }

  lookup(projectId: string, lookup: LookupVersionOptions, options: RequestOptions = {}) {
    const query = new URLSearchParams({ branch: lookup.branch });

    for (const [field, value] of Object.entries(lookup.fields)) {
      query.set(field, String(value));
    }

    return this.http.get(
      withQuery(`/api/v1/projects/${encodeURIComponent(projectId)}/versions/lookup`, query),
      versionLookupResultSchema,
      options
    );
  }
}

function appendList(query: URLSearchParams, key: string, values?: readonly string[]) {
  if (values?.length) {
    query.set(key, values.join(","));
  }
}

function withQuery(path: string, query: URLSearchParams) {
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}
