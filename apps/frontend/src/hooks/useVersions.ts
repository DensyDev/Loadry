import type { Project } from "@densy/loadry-contracts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { downloads } from "../services/downloads";
import { sortSeries } from "../utils/versioning";
import { useAsync } from "./useAsync";

export type BranchFilter = Array<"all" | string>;

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

function readStoredPageSize() {
  const storedValue = window.localStorage.getItem(pageSizeStorageKey);
  const value = Number.parseInt(storedValue ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

export function useVersions(project: Project) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reloadToken, setReloadToken] = useState(0);
  const [requestedPageSize, setRequestedPageSize] = useState(readStoredPageSize);
  const branchFilter = parseMultiValue(searchParams.get("branches")) as BranchFilter;
  const seriesFilter = parseMultiValue(searchParams.get("versions"));
  const page = parsePage(searchParams.get("page"));
  const serializedBranches = serializeFilter(branchFilter);
  const serializedVersions = serializeFilter(seriesFilter);
  const requestKey = [
    project.id,
    serializedBranches,
    serializedVersions,
    page,
    requestedPageSize,
  ].join(":");

  const loadEntries = useCallback(
    async () => ({
      requestKey,
      value: await downloads.versions.page(project.id, {
        branches: serializedBranches?.split(","),
        limit: requestedPageSize,
        page,
        versions: serializedVersions?.split(","),
      }),
    }),
    [
      page,
      project.id,
      requestKey,
      requestedPageSize,
      serializedBranches,
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

  const setPageSize = (nextPageSize: number) => {
    window.localStorage.setItem(pageSizeStorageKey, String(nextPageSize));
    setRequestedPageSize(nextPageSize);
    setSearchParams(current => {
      const nextParams = new URLSearchParams(current);
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
    reload: () => setReloadToken(current => current + 1),
    seriesFilter,
    seriesOptions,
    setBranchFilter: (value: BranchFilter) => updateFilterParam("branches", value),
    setPage,
    setPageSize,
    setSeriesFilter: (value: string[]) => updateFilterParam("versions", value),
  };
}
