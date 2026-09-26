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
