import type { Project, Version } from "@densy/loadry-contracts";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { downloads } from "../services/downloads";
import { sortSeries } from "../utils/versioning";
import { useAsync } from "./useAsync";

export type BranchFilter = Array<"all" | string>;

function matchesSelection(values: string[], value: string) {
  return values.includes("all") || values.includes(value);
}

function parseMultiValue(value: string | null) {
  const values =
    value
      ?.split(",")
      .map(item => item.trim())
      .filter(Boolean) ?? [];

  return values.length > 0 && !values.includes("all") ? values : ["all"];
}

function parseLimit(value: string | null) {
  if (!value) {
    return null;
  }

  const limit = Number.parseInt(value, 10);
  return Number.isFinite(limit) && limit > 0 ? limit : null;
}

function serializeFilter(values: string[]) {
  const normalizedValues = values.filter(value => value !== "all");
  return normalizedValues.length > 0 ? normalizedValues.join(",") : null;
}

function matchesBranchSelection(values: string[], entry: Version, project: Project) {
  if (!values.includes("all")) {
    return values.includes(entry.branch.id);
  }

  return (
    project.branches.find(branch => branch.id === entry.branch.id)?.showInAllBranches === true
  );
}

export function useVersions(project: Project) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reloadToken, setReloadToken] = useState(0);
  const branchFilter = parseMultiValue(searchParams.get("branches")) as BranchFilter;
  const seriesFilter = parseMultiValue(searchParams.get("versions"));
  const limit = parseLimit(searchParams.get("limit"));
  const branchIds = useMemo(
    () => project.branches.map(branch => branch.id),
    [project.branches]
  );

  const loadEntries = useCallback(
    () => downloads.versions.list(project.id, { branches: branchIds }),
    [branchIds, project.id]
  );

  const { data, error, isLoading } = useAsync(loadEntries, [loadEntries, reloadToken]);
  const entries = data ?? [];

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
      ...sortSeries(Array.from(new Set(entries.map(entry => entry.series)))).map(series => ({
        id: series,
        label: series,
      })),
    ],
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const nextEntries = entries.filter(
      entry =>
        matchesBranchSelection(branchFilter, entry, project) &&
        matchesSelection(seriesFilter, entry.series)
    );

    return limit ? nextEntries.slice(0, limit) : nextEntries;
  }, [branchFilter, entries, limit, project, seriesFilter]);

  const updateFilterParam = (key: string, values: string[]) => {
    setSearchParams(current => {
      const nextParams = new URLSearchParams(current);
      const serializedValue = serializeFilter(values);

      if (serializedValue) {
        nextParams.set(key, serializedValue);
      } else {
        nextParams.delete(key);
      }

      return nextParams;
    });
  };

  return {
    branchFilter,
    branchOptions,
    entries: filteredEntries,
    error,
    isLoading,
    reload: () => setReloadToken(current => current + 1),
    seriesFilter,
    seriesOptions,
    setBranchFilter: (value: BranchFilter) => updateFilterParam("branches", value),
    setSeriesFilter: (value: string[]) => updateFilterParam("versions", value),
  };
}
