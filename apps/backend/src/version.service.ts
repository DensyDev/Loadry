import type { VersionEntry, VersionProviderSource } from "./types.js";
import { sortEntries } from "./versioning.js";

type VersionCacheEntry = {
  expiresAt: number;
  promise: Promise<VersionEntry[]>;
};

const versionCache = new WeakMap<VersionProviderSource[], VersionCacheEntry>();
const versionCacheTtlMilliseconds = 30_000;

export type VersionFilters = {
  branches?: string[];
  limit?: number | null;
  page?: number;
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
    const cached = versionCache.get(this.providers);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.promise;
    }

    const promise = Promise.all(this.providers.map(provider => provider.loadEntries()))
      .then(result =>
        sortEntries(
          result.flat(),
          this.providers.map(provider => provider.branch)
        )
      );
    const cacheEntry = {
      expiresAt: Date.now() + versionCacheTtlMilliseconds,
      promise,
    };
    versionCache.set(this.providers, cacheEntry);

    try {
      return await promise;
    } catch (error) {
      if (versionCache.get(this.providers) === cacheEntry) {
        versionCache.delete(this.providers);
      }

      throw error;
    }
  }

  async load(filters: VersionFilters = {}) {
    const entries = await this.loadAll();
    const branches = this.normalizeFilter(filters.branches);
    const versions = this.normalizeFilter(filters.versions);
    const filteredEntries = this.filterByVersions(
      this.filterByBranches(entries, branches),
      versions
    );

    return filters.limit ? filteredEntries.slice(0, filters.limit) : filteredEntries;
  }

  async paginate(filters: VersionFilters, requestedPage: number, pageSize: number) {
    const entries = await this.loadAll();
    const branches = this.normalizeFilter(filters.branches);
    const versions = this.normalizeFilter(filters.versions);
    const branchEntries = this.filterByBranches(entries, branches);
    const series = Array.from(new Set(branchEntries.map(entry => entry.series)));
    const filteredEntries = this.filterByVersions(branchEntries, versions);
    const totalItems = filteredEntries.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const start = (page - 1) * pageSize;

    return {
      items: filteredEntries.slice(start, start + pageSize),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
      series,
    };
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

  private filterByBranches(entries: VersionEntry[], branches: string[]) {
    return entries.filter(entry =>
      branches.length ? branches.includes(entry.branch) : entry.showInAllBranches
    );
  }

  private filterByVersions(entries: VersionEntry[], versions: string[]) {
    return entries.filter(entry =>
      versions.length ? versions.includes(entry.series) : true
    );
  }
}
