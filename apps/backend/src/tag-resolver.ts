import type { TagCondition, TagResolver } from "./providers/definition.js";
import type { VersionEntry, VersionTag } from "./types.js";

function normalizedTimestamp(timestamp: number) {
  const milliseconds = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  return new Date(milliseconds).toISOString();
}

function buildResolverContext(entry: VersionEntry): Record<string, unknown> {
  return {
    ...entry,
    branch: { id: entry.branch, label: entry.branchLabel },
    modifiedAt: entry.modifiedAt === null ? null : normalizedTimestamp(entry.modifiedAt),
    provider: { id: entry.providerId, label: entry.providerLabel },
    source: { text: entry.sourceText, url: entry.sourceUrl },
  };
}

function readPathValue(root: Record<string, unknown>, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = root;

  for (let index = 0; index < segments.length; index += 1) {
    if (typeof current !== "object" || current === null || Array.isArray(current)) {
      return null;
    }

    const object = current as Record<string, unknown>;
    const remainingPath = segments.slice(index).join(".");

    // Property maps and provider-specific objects may use dots inside an exact key.
    if (Object.hasOwn(object, remainingPath)) {
      return object[remainingPath];
    }

    const segment = segments[index]!;

    if (!Object.hasOwn(object, segment)) {
      return null;
    }

    current = object[segment];
  }

  return current;
}

function readField(context: Record<string, unknown>, field: string): string | null {
  const value = readPathValue(context, field);
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    ? String(value)
    : null;
}

function matchesCondition(
  context: Record<string, unknown>,
  condition: TagCondition
): boolean {
  if ("all" in condition) {
    return condition.all.every(child => matchesCondition(context, child));
  }

  if ("any" in condition) {
    return condition.any.some(child => matchesCondition(context, child));
  }

  if ("not" in condition) {
    return !matchesCondition(context, condition.not);
  }

  const actual = readField(context, condition.field);

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

export function matchesTagCondition(entry: VersionEntry, condition: TagCondition): boolean {
  return matchesCondition(buildResolverContext(entry), condition);
}

export function resolveTags(entry: VersionEntry, resolvers: TagResolver[]): VersionTag[] {
  const tags = new Map((entry.tags ?? []).map(tag => [`${tag.group}:${tag.value}`, tag]));
  const context = buildResolverContext(entry);

  for (const resolver of resolvers) {
    if (matchesCondition(context, resolver.when)) {
      const tag = { group: resolver.group, value: resolver.value };
      tags.set(`${tag.group}:${tag.value}`, tag);
    }
  }

  return Array.from(tags.values());
}
