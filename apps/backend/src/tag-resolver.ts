import type { TagCondition, TagResolver } from "./providers/definition.js";
import type { VersionEntry, VersionTag } from "./types.js";

function normalizedTimestamp(timestamp: number) {
  const milliseconds = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  return new Date(milliseconds).toISOString();
}

function readField(entry: VersionEntry, field: string): string | null {
  if (field.startsWith("properties.")) {
    return entry.properties?.[field.slice("properties.".length)] ?? null;
  }

  const fields: Record<string, string | number | boolean | null | undefined> = {
    "branch.id": entry.branch,
    "branch.label": entry.branchLabel,
    checksumUrl: entry.checksumUrl,
    downloadUrl: entry.downloadUrl,
    fileName: entry.fileName,
    id: entry.id,
    logicalVersion: entry.logicalVersion,
    "maven.artifactId": entry.maven?.artifactId,
    "maven.classifier": entry.maven?.classifier,
    "maven.extension": entry.maven?.extension,
    "maven.groupId": entry.maven?.groupId,
    "maven.repository.id": entry.maven?.repository.id,
    "maven.repository.name": entry.maven?.repository.name,
    "maven.repository.url": entry.maven?.repository.url,
    "maven.version": entry.maven?.version,
    modifiedAt: entry.modifiedAt === null ? null : normalizedTimestamp(entry.modifiedAt),
    "provider.id": entry.providerId,
    "provider.label": entry.providerLabel,
    series: entry.series,
    "source.text": entry.sourceText,
    "source.url": entry.sourceUrl,
    version: entry.version,
  };
  const value = fields[field];
  return value === null || value === undefined ? null : String(value);
}

export function matchesTagCondition(entry: VersionEntry, condition: TagCondition): boolean {
  if ("all" in condition) {
    return condition.all.every(child => matchesTagCondition(entry, child));
  }

  if ("any" in condition) {
    return condition.any.some(child => matchesTagCondition(entry, child));
  }

  if ("not" in condition) {
    return !matchesTagCondition(entry, condition.not);
  }

  const actual = readField(entry, condition.field);

  if (condition.operator === "exists") {
    return actual !== null;
  }

  if (actual === null) {
    return condition.operator === "notEquals";
  }

  const expected = condition.value ?? "";
  const comparableActual = condition.caseSensitive ? actual : actual.toLocaleLowerCase();
  const comparableExpected = condition.caseSensitive ? expected : expected.toLocaleLowerCase();

  switch (condition.operator) {
    case "contains":
      return comparableActual.includes(comparableExpected);
    case "endsWith":
      return comparableActual.endsWith(comparableExpected);
    case "equals":
      return comparableActual === comparableExpected;
    case "matches":
      return new RegExp(expected, condition.caseSensitive ? "" : "i").test(actual);
    case "notEquals":
      return comparableActual !== comparableExpected;
    case "startsWith":
      return comparableActual.startsWith(comparableExpected);
  }
}

export function resolveTags(entry: VersionEntry, resolvers: TagResolver[]): VersionTag[] {
  const tags = new Map((entry.tags ?? []).map(tag => [`${tag.group}:${tag.value}`, tag]));

  for (const resolver of resolvers) {
    if (matchesTagCondition(entry, resolver.when)) {
      const tag = { group: resolver.group, value: resolver.value };
      tags.set(`${tag.group}:${tag.value}`, tag);
    }
  }

  return Array.from(tags.values());
}
