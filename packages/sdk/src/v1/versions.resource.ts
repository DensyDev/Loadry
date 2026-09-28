import {
  type ListVersionsOptions,
  type ListVersionPageOptions,
  type LookupVersionOptions,
  versionLookupResultSchema,
  versionSchema,
  versionPageSchema,
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
    appendTags(query, filters.tags);
    appendList(query, "versions", filters.versions);
    appendSearchFilters(query, filters);

    if (filters.limit !== undefined) {
      query.set("limit", String(filters.limit));
    }

    return this.http.get(
      withQuery(`/api/v1/projects/${encodeURIComponent(projectId)}/versions`, query),
      z.array(versionSchema),
      options
    );
  }

  page(
    projectId: string,
    filters: ListVersionPageOptions = {},
    options: RequestOptions = {}
  ) {
    const query = new URLSearchParams({ page: String(filters.page ?? 1) });
    appendList(query, "branches", filters.branches);
    appendTags(query, filters.tags);
    appendList(query, "versions", filters.versions);
    appendSearchFilters(query, filters);

    if (filters.limit !== undefined) {
      query.set("limit", String(filters.limit));
    }

    return this.http.get(
      withQuery(`/api/v1/projects/${encodeURIComponent(projectId)}/versions`, query),
      versionPageSchema,
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

function appendTags(
  query: URLSearchParams,
  selections?: Readonly<Record<string, readonly string[]>>
) {
  const tags = Object.entries(selections ?? {}).flatMap(([group, values]) =>
    values.map(value => `${group}:${value}`)
  );
  appendList(query, "tags", tags);
}

function appendSearchFilters(
  query: URLSearchParams,
  filters: Pick<
    ListVersionsOptions,
    "modifiedAfter" | "modifiedBefore" | "propertyKey" | "propertyValue" | "query"
  >
) {
  for (const key of [
    "query",
    "modifiedAfter",
    "modifiedBefore",
    "propertyKey",
    "propertyValue",
  ] as const) {
    const value = filters[key]?.trim();

    if (value) {
      query.set(key, value);
    }
  }
}

function withQuery(path: string, query: URLSearchParams) {
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}
