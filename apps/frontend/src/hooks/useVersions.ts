import type { Project, TagSelections } from "@densy/loadry-contracts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { downloads } from "../services/downloads";
import { sortSeries } from "../utils/versioning";
import { useAsync } from "./useAsync";

export type BranchFilter = Array<"all" | string>;

export type VersionSearchFilters = {
  modifiedFrom: string;
  modifiedTo: string;
  propertyKey: string;
  propertyValue: string;
  query: string;
};

const pageSizeStorageKey = "loadry.versions.pageSize";

function parseMultiValue(value: string | null) {
  const values = value?.split(",").map(item => item.trim()).filter(Boolean) ?? [];
  return values.length > 0 && !values.includes("all") ? values : ["all"];
}

function parsePage(value: string | null) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function serializeFilter(values: string[]) {
  const normalizedValues = values.filter(value => value !== "all");
  return normalizedValues.length > 0 ? normalizedValues.join(",") : null;
}

function parseTagFilter(value: string | null, project: Project): TagSelections {
  const knownTags = new Set(
    project.tagGroups.flatMap(group => group.values.map(tag => `${group.id}:${tag.id}`))
  );
  const selections: Record<string, string[]> = {};

  for (const tag of value?.split(",") ?? []) {
    const normalized = tag.trim();

    if (!knownTags.has(normalized)) continue;
    const separator = normalized.indexOf(":");
    const group = normalized.slice(0, separator);
    const tagValue = normalized.slice(separator + 1);
    selections[group] = Array.from(new Set([...(selections[group] ?? []), tagValue]));
  }

  return selections;
}

function serializeTags(selections: TagSelections) {
  const tags = Object.entries(selections)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([group, values]) => [...values].sort().map(value => `${group}:${value}`));
  return tags.length ? tags.join(",") : null;
}

function readStoredPageSize() {
  const storedValue = window.localStorage.getItem(pageSizeStorageKey);
  const value = Number.parseInt(storedValue ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function toBoundaryISOString(value: string, endOfDay = false) {
  if (!value) return undefined;
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`).toISOString();
}

export function useVersions(project: Project) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reloadToken, setReloadToken] = useState(0);
  const [requestedPageSize, setRequestedPageSize] = useState(readStoredPageSize);
  const branchFilter = (
    project.branches.length === 1
      ? [project.branches[0]!.id]
      : parseMultiValue(searchParams.get("branches"))
  ) as BranchFilter;
  const seriesFilter = parseMultiValue(searchParams.get("versions"));
  const tagFilter = parseTagFilter(searchParams.get("tags"), project);
  const searchFilters: VersionSearchFilters = {
    modifiedFrom: searchParams.get("from") ?? "",
    modifiedTo: searchParams.get("to") ?? "",
    propertyKey: searchParams.get("propertyKey") ?? "",
    propertyValue: searchParams.get("propertyValue") ?? "",
    query: searchParams.get("q") ?? "",
  };
  const page = parsePage(searchParams.get("page"));
  const serializedBranches = serializeFilter(branchFilter);
  const serializedVersions = serializeFilter(seriesFilter);
  const serializedTags = serializeTags(tagFilter);
  const requestKey = [
    project.id,
    serializedBranches,
    serializedVersions,
    serializedTags,
    searchFilters.query,
    searchFilters.modifiedFrom,
    searchFilters.modifiedTo,
    searchFilters.propertyKey,
    searchFilters.propertyValue,
    page,
    requestedPageSize,
  ].join(":");

  const loadEntries = useCallback(
    async () => ({
      requestKey,
      value: await downloads.versions.page(project.id, {
        branches: serializedBranches?.split(","),
        limit: requestedPageSize,
        modifiedAfter: toBoundaryISOString(searchFilters.modifiedFrom),
        modifiedBefore: toBoundaryISOString(searchFilters.modifiedTo, true),
        page,
        propertyKey: searchFilters.propertyKey || undefined,
        propertyValue: searchFilters.propertyValue || undefined,
        query: searchFilters.query || undefined,
        tags: tagFilter,
        versions: serializedVersions?.split(","),
      }),
    }),
    [
      page,
      project.id,
      requestKey,
      requestedPageSize,
      searchFilters.modifiedFrom,
      searchFilters.modifiedTo,
      searchFilters.propertyKey,
      searchFilters.propertyValue,
      searchFilters.query,
      serializedBranches,
      serializedTags,
      serializedVersions,
    ]
  );

  const asyncState = useAsync(loadEntries, [loadEntries, reloadToken]);
  const data =
    asyncState.data?.requestKey === requestKey ? asyncState.data.value : null;
  const hasCurrentData = data !== null;
  const isLoading = asyncState.isLoading || !hasCurrentData;
  const { error } = asyncState;

  useEffect(() => {
    const resolvedPage = data?.pagination.page;

    if (isLoading || resolvedPage === undefined || resolvedPage === page) {
      return;
    }

    setSearchParams(current => {
      const nextParams = new URLSearchParams(current);

      if (resolvedPage <= 1) {
        nextParams.delete("page");
      } else {
        nextParams.set("page", String(resolvedPage));
      }

      return nextParams;
    });
  }, [data?.pagination.page, isLoading, page, setSearchParams]);

  const branchOptions = useMemo(
    () => [
      { id: "all", labelKey: "filters.allBranches" },
      ...project.branches.map(branch => ({
        id: branch.id,
        label: branch.id,
        labelKey: branch.labelKey,
      })),
    ],
    [project.branches]
  );

  const seriesOptions = useMemo(
    () => [
      { id: "all", label: null },
      ...sortSeries(data?.series ?? []).map(series => ({ id: series, label: series })),
    ],
    [data?.series]
  );
  const propertyKeys =
    data?.propertyKeys ?? asyncState.data?.value.propertyKeys ?? [];

  const updateFilterParam = (key: string, values: string[]) => {
    setSearchParams(current => {
      const nextParams = new URLSearchParams(current);
      const serializedValue = serializeFilter(values);

      if (serializedValue) {
        nextParams.set(key, serializedValue);
      } else {
        nextParams.delete(key);
      }

      nextParams.delete("page");
      return nextParams;
    });
  };

  const setPage = (nextPage: number) => {
    setSearchParams(current => {
      const nextParams = new URLSearchParams(current);

      if (nextPage <= 1) {
        nextParams.delete("page");
      } else {
        nextParams.set("page", String(nextPage));
      }

      return nextParams;
    });
  };

  const setTagFilter = (value: TagSelections) => {
    setSearchParams(current => {
      const nextParams = new URLSearchParams(current);
      const serializedValue = serializeTags(value);

      if (serializedValue) nextParams.set("tags", serializedValue);
      else nextParams.delete("tags");
      nextParams.delete("page");
      return nextParams;
    });
  };

  const setPageSize = (nextPageSize: number) => {
    window.localStorage.setItem(pageSizeStorageKey, String(nextPageSize));
    setRequestedPageSize(nextPageSize);
    setSearchParams(current => {
      const nextParams = new URLSearchParams(current);
      nextParams.delete("page");
      return nextParams;
    });
  };

  const setSearchFilters = (filters: VersionSearchFilters) => {
    setSearchParams(current => {
      const nextParams = new URLSearchParams(current);
      const values = {
        from: filters.modifiedFrom,
        propertyKey: filters.propertyKey,
        propertyValue: filters.propertyValue,
        q: filters.query,
        to: filters.modifiedTo,
      };

      for (const [key, value] of Object.entries(values)) {
        const normalizedValue = value.trim();

        if (normalizedValue) {
          nextParams.set(key, normalizedValue);
        } else {
          nextParams.delete(key);
        }
      }

      nextParams.delete("page");
      return nextParams;
    });
  };

  const pagination = data?.pagination ?? {
    maxPageSize: requestedPageSize ?? 50,
    page,
    pageSize: requestedPageSize ?? 50,
    pageSizeStep: 5,
    totalItems: 0,
    totalPages: 1,
  };

  return {
    branchFilter,
    branchOptions,
    entries: data?.items ?? [],
    error,
    isLoading,
    pagination: isLoading ? { ...pagination, page } : pagination,
    propertyKeys,
    reload: () => setReloadToken(current => current + 1),
    searchFilters,
    seriesFilter,
    seriesOptions,
    setBranchFilter: (value: BranchFilter) => updateFilterParam("branches", value),
    setPage,
    setPageSize,
    setSearchFilters,
    setSeriesFilter: (value: string[]) => updateFilterParam("versions", value),
    setTagFilter,
    tagFilter,
  };
}
