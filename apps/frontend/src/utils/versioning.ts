function compareNumericParts(leftParts: number[], rightParts: number[]) {
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const left = leftParts[index] ?? 0;
    const right = rightParts[index] ?? 0;

    if (left !== right) {
      return left - right;
    }
  }

  return 0;
}

export function sortSeries(series: string[]) {
  return [...series].sort((left, right) => {
    const leftParts = left.split(".").map(part => Number.parseInt(part, 10) || 0);
    const rightParts = right.split(".").map(part => Number.parseInt(part, 10) || 0);
    return compareNumericParts(rightParts, leftParts);
  });
}
