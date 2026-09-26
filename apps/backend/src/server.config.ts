type ServerEnvironment = Record<string, string | undefined>;

export const defaultVersionsPageSize = 50;
export const defaultVersionsPageSizeStep = 5;
export const maximumVersionsPageSize = 1000;

export function getVersionsPageSize(env: ServerEnvironment) {
  const value = Number(env.LOADRY_VERSIONS_PAGE_SIZE);

  if (!Number.isInteger(value) || value < 1 || value > maximumVersionsPageSize) {
    return defaultVersionsPageSize;
  }

  return value;
}

export function getVersionsPageSizeStep(
  env: ServerEnvironment,
  pageSize = getVersionsPageSize(env)
) {
  const value = Number(env.LOADRY_VERSIONS_PAGE_SIZE_STEP);
  const preferredFallback = Math.min(defaultVersionsPageSizeStep, pageSize);
  const fallback = pageSize % preferredFallback === 0 ? preferredFallback : 1;

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > pageSize ||
    pageSize % value !== 0
  ) {
    return fallback;
  }

  return value;
}
