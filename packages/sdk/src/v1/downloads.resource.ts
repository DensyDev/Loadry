import type { HttpClient } from "../common/http-client.js";

type DownloadRequestOptions = Omit<RequestInit, "method">;

export class DownloadsResource {
  constructor(private readonly http: HttpClient) {}

  getLatestUrl(projectId: string, branch: string) {
    return this.http.createUrl(this.getLatestPath(projectId, branch));
  }

  getFileUrl(projectId: string, branch: string, fileName: string) {
    return this.http.createUrl(this.getFilePath(projectId, branch, fileName));
  }

  fetchLatest(projectId: string, branch: string, options: DownloadRequestOptions = {}) {
    return this.http.fetch(this.getLatestPath(projectId, branch), {
      ...options,
      method: "GET",
    });
  }

  fetchFile(
    projectId: string,
    branch: string,
    fileName: string,
    options: DownloadRequestOptions = {}
  ) {
    return this.http.fetch(this.getFilePath(projectId, branch, fileName), {
      ...options,
      method: "GET",
    });
  }

  private getLatestPath(projectId: string, branch: string) {
    return `/download/${encodeURIComponent(projectId)}/${encodeURIComponent(branch)}/latest`;
  }

  private getFilePath(projectId: string, branch: string, fileName: string) {
    return `/download/${encodeURIComponent(projectId)}/${encodeURIComponent(branch)}/${encodeURIComponent(fileName)}`;
  }
}
