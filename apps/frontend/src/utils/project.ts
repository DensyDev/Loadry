export function createProjectPath(projectId: string) {
  return `/project/${encodeURIComponent(projectId)}`;
}

export function normalizeDomain(domain: string) {
  return domain.toLowerCase().replace(/\.$/, "");
}
