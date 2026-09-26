export function createDownloadLatestPath(projectId: string, branch: string) {
  return `/download/${encodeURIComponent(projectId)}/${encodeURIComponent(branch)}/latest`;
}

export function createDownloadFilePath(projectId: string, branch: string, fileName: string) {
  return `/download/${encodeURIComponent(projectId)}/${encodeURIComponent(branch)}/${encodeURIComponent(fileName)}`;
}
