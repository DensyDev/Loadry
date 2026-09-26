import assert from "node:assert/strict";
import test from "node:test";
import type { VersionEntry, VersionProviderSource } from "../src/types.ts";
import { VersionService } from "../src/version.service.ts";

function entry(id: string, branch: string, series: string, showInAllBranches = true): VersionEntry {
  return {
    branch,
    branchLabel: `branches.${branch}`,
    checksumUrl: null,
    downloadUrl: `https://example.com/${id}.jar`,
    fileName: `${id}.jar`,
    id,
    logicalVersion: id,
    modifiedAt: null,
    properties: null,
    providerId: branch,
    providerLabel: branch,
    series,
    showInAllBranches,
    sourceText: null,
    sourceUrl: null,
    version: id,
  };
}

function provider(entries: VersionEntry[]): VersionProviderSource {
  return {
    branch: "stable",
    branchLabel: "branches.stable",
    id: "test",
    label: "Test",
    loadEntries: async () => entries,
    showInAllBranches: true,
  };
}

test("paginate returns one server-sized page and metadata", async () => {
  const service = new VersionService([
    provider([
      entry("1.3.0", "stable", "1.3"),
      entry("1.2.0", "stable", "1.2"),
      entry("1.1.0", "stable", "1.1"),
      entry("legacy", "legacy", "legacy", false),
    ]),
  ]);

  const result = await service.paginate({}, 2, 2);

  assert.deepEqual(result.items.map(item => item.id), ["1.1.0"]);
  assert.deepEqual(result.series, ["1.3", "1.2", "1.1"]);
  assert.deepEqual(result.pagination, {
    page: 2,
    pageSize: 2,
    totalItems: 3,
    totalPages: 2,
  });
});

test("paginate applies branch and series filters before slicing", async () => {
  const service = new VersionService([
    provider([
      entry("stable", "stable", "1.0"),
      entry("dev-2", "dev", "2.0"),
      entry("dev-1", "dev", "1.0"),
    ]),
  ]);

  const result = await service.paginate(
    { branches: ["dev"], versions: ["1.0"] },
    1,
    50
  );

  assert.deepEqual(result.items.map(item => item.id), ["dev-1"]);
  assert.deepEqual(result.series, ["2.0", "1.0"]);
  assert.equal(result.pagination.totalItems, 1);
});

test("paginate searches across version metadata and properties", async () => {
  const searchable = {
    ...entry("1.6.8", "stable", "1.6"),
    fileName: "Lumi-1.6.8.jar",
    properties: {
      "git.commit.id": "abc123",
      "git.commit.message.short": "Fix portal rendering",
    },
    sourceText: "fix: portal rendering",
  };
  const service = new VersionService([
    provider([searchable, entry("1.6.7", "stable", "1.6")]),
  ]);

  const bySource = await service.paginate({ query: "portal fix" }, 1, 50);
  const byProperty = await service.paginate(
    { propertyKey: "commit.id", propertyValue: "ABC" },
    1,
    50
  );

  assert.deepEqual(bySource.items.map(item => item.id), ["1.6.8"]);
  assert.deepEqual(byProperty.items.map(item => item.id), ["1.6.8"]);
});

test("paginate filters entries by modified date range", async () => {
  const older = {
    ...entry("older", "stable", "1.0"),
    modifiedAt: Date.parse("2026-01-01T12:00:00Z"),
  };
  const newer = {
    ...entry("newer", "stable", "1.0"),
    modifiedAt: Date.parse("2026-02-01T12:00:00Z") / 1000,
  };
  const service = new VersionService([provider([newer, older])]);

  const result = await service.paginate(
    {
      modifiedAfter: "2026-01-15T00:00:00.000Z",
      modifiedBefore: "2026-02-28T23:59:59.999Z",
    },
    1,
    50
  );

  assert.deepEqual(result.items.map(item => item.id), ["newer"]);
});

test("version entries are reused between page requests", async () => {
  let loads = 0;
  const providers: VersionProviderSource[] = [
    {
      ...provider([entry("1.0.0", "stable", "1.0")]),
      loadEntries: async () => {
        loads += 1;
        return [entry("1.0.0", "stable", "1.0")];
      },
    },
  ];

  await new VersionService(providers).paginate({}, 1, 50);
  await new VersionService(providers).paginate({}, 2, 50);

  assert.equal(loads, 1);
});
