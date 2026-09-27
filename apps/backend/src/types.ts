export type Branch = string;

export type DownloadProject = {
  description: string;
  domains: string[];
  id: string;
  name: string;
  providers: VersionProviderSource[];
};

export type MavenArtifact = {
  artifactId: string;
  classifier: string | null;
  extension: string;
  groupId: string;
  repository: {
    id: string;
    name: string;
    url: string;
  };
  version: string;
};

export type VersionEntry = {
  branch: Branch;
  branchLabel: string;
  downloadUrl: string;
  fileName: string;
  id: string;
  logicalVersion: string;
  maven: MavenArtifact | null;
  modifiedAt: number | null;
  properties: Record<string, string> | null;
  providerId: string;
  providerLabel: string;
  series: string;
  checksumUrl: string | null;
  showInAllBranches: boolean;
  sourceText: string | null;
  sourceUrl: string | null;
  version: string;
};

export interface VersionProviderSource {
  readonly branch: Branch;
  readonly branchLabel: string;
  readonly id: string;
  readonly label: string;
  readonly showInAllBranches: boolean;
  loadEntries(): Promise<VersionEntry[]>;
}
