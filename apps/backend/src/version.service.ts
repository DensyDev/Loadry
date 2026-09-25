import type { VersionEntry, VersionProviderSource } from "./types.js";
import { sortEntries } from "./versioning.js";

export type VersionFilters = {
  branches?: string[];
  limit?: number | null;
  versions?: string[];
};

export const versionLookupFields = [
  "branch",
  "branchLabel",
  "checksumUrl",
  "downloadUrl",
  "fileName",
  "id",
  "logicalVersion",
  "modifiedAt",
  "providerId",
  "providerLabel",
  "series",
  "showInAllBranches",
  "sourceText",
  "sourceUrl",
  "version",
] as const satisfies readonly Exclude<keyof VersionEntry, "properties">[];

export type VersionLookupField =
  | (typeof versionLookupFields)[number]
  | `properties.${string}`;

export type VersionLookupFilter = {
  field: VersionLookupField;
  value: string;
};

function normalizeTimestamp(timestamp: number) {
  const milliseconds = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  return new Date(milliseconds).toISOString();
}

function matchesLookupFilter(entry: VersionEntry, filter: VersionLookupFilter) {
  if (filter.field.startsWith("properties.")) {
    const property = filter.field.slice("properties.".length);
    return entry.properties?.[property] === filter.value;
  }

  const field = filter.field as (typeof versionLookupFields)[number];
  const entryValue = entry[field];

  if (field === "modifiedAt" && typeof entryValue === "number") {
    return filter.value === String(entryValue) || filter.value === normalizeTimestamp(entryValue);
  }

  return entryValue !== null && String(entryValue) === filter.value;
}

export class VersionService {
  constructor(private readonly providers: VersionProviderSource[]) {}

  async loadAll() {
    const result = await Promise.all(this.providers.map(provider => provider.loadEntries()));

    return sortEntries(
      result.flat(),
      this.providers.map(provider => provider.branch)
    );
  }

  async load(filters: VersionFilters = {}) {
    const entries = await this.loadAll();
    const branches = this.normalizeFilter(filters.branches);
    const versions = this.normalizeFilter(filters.versions);
    const filteredEntries = entries.filter(entry => {
      const matchesBranch = branches.length
        ? branches.includes(entry.branch)
        : entry.showInAllBranches;
      const matchesVersion = versions.length ? versions.includes(entry.series) : true;
      return matchesBranch && matchesVersion;
    });

    return filters.limit ? filteredEntries.slice(0, filters.limit) : filteredEntries;
  }

  async lookup(branch: string, filters: VersionLookupFilter[]) {
    const branchEntries = (await this.loadAll()).filter(entry => entry.branch === branch);
    const matches = branchEntries.filter(entry =>
      filters.every(filter => matchesLookupFilter(entry, filter))
    );

    return {
      branchEntries,
      matches,
    };
  }

  private normalizeFilter(values: string[] | undefined) {
    return Array.from(new Set(values?.filter(value => value && value !== "all") ?? []));
  }
}
