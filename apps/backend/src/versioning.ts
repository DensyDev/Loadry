import type { VersionEntry } from "./types.js";

function compareNumericParts(aParts: number[], bParts: number[]) {
  const length = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < length; index += 1) {
    const left = aParts[index] ?? 0;
    const right = bParts[index] ?? 0;

    if (left !== right) {
      return left - right;
    }
  }

  return 0;
}

export function normalizeSeries(version: string) {
  const normalized = version.replace(/-SNAPSHOT$/, "").split("-")[0];
  const [major = "0", minor = "0"] = normalized.split(".");
  return `${major}.${minor}`;
}

export function compareVersions(left: string, right: string) {
  const leftNormalized = left.replace(/-SNAPSHOT$/, "").split("-")[0];
  const rightNormalized = right.replace(/-SNAPSHOT$/, "").split("-")[0];
  const leftParts = leftNormalized.split(".").map(part => Number.parseInt(part, 10) || 0);
  const rightParts = rightNormalized.split(".").map(part => Number.parseInt(part, 10) || 0);
  const partsResult = compareNumericParts(leftParts, rightParts);

  if (partsResult !== 0) {
    return partsResult;
  }

  const leftSnapshot = left.includes("SNAPSHOT");
  const rightSnapshot = right.includes("SNAPSHOT");

  if (leftSnapshot === rightSnapshot) {
    return 0;
  }

  return leftSnapshot ? -1 : 1;
}

export function sortEntries(entries: VersionEntry[], branchOrder: string[] = []) {
  const branchPriority = new Map(branchOrder.map((branch, index) => [branch, index]));

  return [...entries].sort((left, right) => {
    const versionResult = compareVersions(right.version, left.version);

    if (versionResult !== 0) {
      return versionResult;
    }

    const modifiedAtResult = (right.modifiedAt ?? 0) - (left.modifiedAt ?? 0);

    if (modifiedAtResult !== 0) {
      return modifiedAtResult;
    }

    if (left.branch !== right.branch) {
      return (
        (branchPriority.get(left.branch) ?? Number.MAX_SAFE_INTEGER) -
        (branchPriority.get(right.branch) ?? Number.MAX_SAFE_INTEGER)
      );
    }

    return left.providerLabel.localeCompare(right.providerLabel);
  });
}

export function sortSeries(series: string[]) {
  return [...series].sort((left, right) => {
    const leftParts = left.split(".").map(part => Number.parseInt(part, 10) || 0);
    const rightParts = right.split(".").map(part => Number.parseInt(part, 10) || 0);
    return compareNumericParts(rightParts, leftParts);
  });
}
