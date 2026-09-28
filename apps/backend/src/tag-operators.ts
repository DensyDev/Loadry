export const tagComparisonOperators = [
  "after",
  "afterOrAt",
  "before",
  "beforeOrAt",
  "contains",
  "endsWith",
  "equals",
  "exists",
  "greaterThan",
  "greaterThanOrEqual",
  "lessThan",
  "lessThanOrEqual",
  "matches",
  "notEquals",
  "startsWith",
] as const;

export type TagComparisonOperator = (typeof tagComparisonOperators)[number];
export type TagComparisonValue = string | number;

const numericOperators = new Set<TagComparisonOperator>([
  "greaterThan",
  "greaterThanOrEqual",
  "lessThan",
  "lessThanOrEqual",
]);

const timestampOperators = new Set<TagComparisonOperator>([
  "after",
  "afterOrAt",
  "before",
  "beforeOrAt",
]);

function parseNumber(value: TagComparisonValue) {
  if (typeof value === "string" && !value.trim()) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUnixTimestamp(value: number) {
  return Math.abs(value) < 1_000_000_000_000 ? value * 1000 : value;
}

function parseTimestamp(value: TagComparisonValue) {
  const numericValue = parseNumber(value);

  if (numericValue !== null) {
    return normalizeUnixTimestamp(numericValue);
  }

  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

export function validateTagComparisonValue(
  operator: TagComparisonOperator,
  value: TagComparisonValue | undefined,
  caseSensitive: boolean
) {
  if (operator === "exists") {
    return value === undefined ? null : "The exists operator does not accept a value";
  }

  if (value === undefined) {
    return `The ${operator} operator requires a value`;
  }

  if (numericOperators.has(operator) && parseNumber(value) === null) {
    return `The ${operator} operator requires a finite number`;
  }

  if (timestampOperators.has(operator) && parseTimestamp(value) === null) {
    return `The ${operator} operator requires an ISO 8601 date or Unix timestamp`;
  }

  if (operator === "matches") {
    try {
      new RegExp(String(value), caseSensitive ? "" : "i");
    } catch {
      return "Invalid regular expression";
    }
  }

  return null;
}

export function compareTagValue(
  actual: string | null,
  operator: TagComparisonOperator,
  expected: TagComparisonValue | undefined,
  caseSensitive: boolean
) {
  if (operator === "exists") {
    return actual !== null;
  }

  if (actual === null) {
    return operator === "notEquals";
  }

  if (expected === undefined) {
    return false;
  }

  if (numericOperators.has(operator)) {
    const actualNumber = parseNumber(actual);
    const expectedNumber = parseNumber(expected);

    if (actualNumber === null || expectedNumber === null) return false;

    switch (operator) {
      case "greaterThan":
        return actualNumber > expectedNumber;
      case "greaterThanOrEqual":
        return actualNumber >= expectedNumber;
      case "lessThan":
        return actualNumber < expectedNumber;
      case "lessThanOrEqual":
        return actualNumber <= expectedNumber;
    }
  }

  if (timestampOperators.has(operator)) {
    const actualTimestamp = parseTimestamp(actual);
    const expectedTimestamp = parseTimestamp(expected);

    if (actualTimestamp === null || expectedTimestamp === null) return false;

    switch (operator) {
      case "after":
        return actualTimestamp > expectedTimestamp;
      case "afterOrAt":
        return actualTimestamp >= expectedTimestamp;
      case "before":
        return actualTimestamp < expectedTimestamp;
      case "beforeOrAt":
        return actualTimestamp <= expectedTimestamp;
    }
  }

  const expectedText = String(expected);
  const comparableActual = caseSensitive ? actual : actual.toLocaleLowerCase();
  const comparableExpected = caseSensitive
    ? expectedText
    : expectedText.toLocaleLowerCase();

  switch (operator) {
    case "contains":
      return comparableActual.includes(comparableExpected);
    case "endsWith":
      return comparableActual.endsWith(comparableExpected);
    case "equals":
      return comparableActual === comparableExpected;
    case "matches":
      try {
        return new RegExp(expectedText, caseSensitive ? "" : "i").test(actual);
      } catch {
        return false;
      }
    case "notEquals":
      return comparableActual !== comparableExpected;
    case "startsWith":
      return comparableActual.startsWith(comparableExpected);
    default:
      return false;
  }
}
