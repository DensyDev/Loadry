import type { Branch, VersionEntry, VersionProviderSource } from "../types.js";
import { normalizeSeries } from "../versioning.js";

type ReposiliteVersionProviderSourceOptions = {
  artifactId: string;
  baseUrl: string;
  branch: Branch;
  branchLabel?: string;
  fileArtifactId?: string;
  groupId: string;
  id: string;
  label: string;
  repository: string;
  showInAllBranches?: boolean;
};

type ReposiliteFileDetails = {
  contentLength?: number;
  contentType?: string;
  lastModifiedTime?: number;
  name: string;
  type: "DIRECTORY" | "FILE";
};

type ReposiliteDirectoryDetails = {
  files: ReposiliteFileDetails[];
  name: string;
  type: "DIRECTORY";
};

async function fetchJson<T>(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchTextOrNull(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  return response.text();
}

function isPrimaryJar(file: ReposiliteFileDetails, artifactId: string) {
  return (
    file.type === "FILE" &&
    file.name.startsWith(`${artifactId}-`) &&
    file.name.endsWith(".jar") &&
    !file.name.endsWith(".jar.md5") &&
    !file.name.endsWith(".jar.sha1") &&
    !file.name.endsWith(".jar.sha256") &&
    !file.name.endsWith(".jar.sha512") &&
    !file.name.endsWith("-sources.jar") &&
    !file.name.endsWith("-javadoc.jar")
  );
}

function extractResolvedVersion(artifactId: string, fileName: string) {
  return fileName.replace(`${artifactId}-`, "").replace(/\.jar$/, "");
}

function unescapePropertiesValue(value: string) {
  return value
    .replace(/\\:/g, ":")
    .replace(/\\=/g, "=")
    .replace(/\\#/g, "#")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}

function parseProperties(content: string) {
  return content.split(/\r?\n/).reduce<Record<string, string>>((properties, rawLine) => {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || line.startsWith("!")) {
      return properties;
    }

    const separatorIndex = line.search(/[:=]/);

    if (separatorIndex === -1) {
      return properties;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    properties[key] = unescapePropertiesValue(value);
    return properties;
  }, {});
}

function normalizeGitHubRepositoryUrl(properties: Record<string, string>) {
  const remoteUrl = properties["git.remote.origin.url"]?.replace(/\.git$/, "");

  if (remoteUrl?.startsWith("https://github.com/")) {
    return remoteUrl;
  }

  const githubRepository = properties["github.repo"];

  if (githubRepository) {
    return `https://github.com/${githubRepository}`;
  }

  return null;
}

function buildSourceFromProperties(properties: Record<string, string>) {
  const commitId = properties["git.commit.id"];
  const repositoryUrl = normalizeGitHubRepositoryUrl(properties);

  if (!commitId || !repositoryUrl) {
    return {
      sourceText: null,
      sourceUrl: null,
    };
  }

  return {
    sourceText: properties["git.commit.message.short"] ?? properties["git.commit.id.abbrev"] ?? commitId.slice(0, 7),
    sourceUrl: `${repositoryUrl}/commit/${commitId}`,
  };
}

export class ReposiliteVersionProviderSource implements VersionProviderSource {
  readonly artifactId: string;
  readonly baseUrl: string;
  readonly branch: Branch;
  readonly branchLabel: string;
  readonly fileArtifactId: string;
  readonly groupId: string;
  readonly id: string;
  readonly label: string;
  readonly repository: string;
  readonly showInAllBranches: boolean;

  constructor(options: ReposiliteVersionProviderSourceOptions) {
    this.artifactId = options.artifactId;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.branch = options.branch;
    this.branchLabel = options.branchLabel ?? `branches.${options.branch}`;
    this.fileArtifactId = options.fileArtifactId ?? options.artifactId;
    this.groupId = options.groupId;
    this.id = options.id;
    this.label = options.label;
    this.repository = options.repository;
    this.showInAllBranches = options.showInAllBranches ?? true;
  }

  private get groupPath() {
    return this.groupId.replaceAll(".", "/");
  }

  private get artifactRepositoryPath() {
    return `${this.groupPath}/${this.artifactId}`;
  }

  private get instanceBaseUrl() {
    const normalized = new URL(this.baseUrl);
    const repositorySuffix = `/${this.repository}`;

    if (normalized.pathname.endsWith(repositorySuffix)) {
      normalized.pathname = normalized.pathname.slice(
        0,
        normalized.pathname.length - repositorySuffix.length
      );
    }

    normalized.pathname = normalized.pathname.replace(/\/$/, "");
    return normalized.toString().replace(/\/$/, "");
  }

  private buildDetailsUrl(path: string) {
    return `${this.instanceBaseUrl}/api/maven/details/${this.repository}/${path}`;
  }

  private buildDownloadUrl(path: string) {
    return `${this.instanceBaseUrl}/${this.repository}/${path}`;
  }

  private async fetchDirectoryDetails(path: string) {
    return fetchJson<ReposiliteDirectoryDetails>(this.buildDetailsUrl(path));
  }

  private async fetchVersionDirectories() {
    const details = await this.fetchDirectoryDetails(this.artifactRepositoryPath);
    return details.files
      .filter(file => file.type === "DIRECTORY")
      .map(file => file.name);
  }

  private async mapJarToEntry(
    logicalVersion: string,
    file: ReposiliteFileDetails,
    files: ReposiliteFileDetails[]
  ): Promise<VersionEntry> {
    const resolvedVersion = extractResolvedVersion(this.fileArtifactId, file.name);
    const artifactPath = `${this.artifactRepositoryPath}/${logicalVersion}/${file.name}`;
    const propertiesFileName = file.name.replace(/\.jar$/, ".properties");
    const propertiesPath = `${this.artifactRepositoryPath}/${logicalVersion}/${propertiesFileName}`;
    const checksumFileName = `${file.name}.sha1`;
    const checksumUrl = files.some(
      candidate => candidate.type === "FILE" && candidate.name === checksumFileName
    )
      ? this.buildDownloadUrl(`${this.artifactRepositoryPath}/${logicalVersion}/${checksumFileName}`)
      : null;
    const propertiesContent = files.some(
      candidate => candidate.type === "FILE" && candidate.name === propertiesFileName
    )
      ? await fetchTextOrNull(this.buildDownloadUrl(propertiesPath))
      : null;
    const properties = propertiesContent ? parseProperties(propertiesContent) : null;
    const source = properties
      ? buildSourceFromProperties(properties)
      : { sourceText: null, sourceUrl: null };

    return {
      branch: this.branch,
      branchLabel: this.branchLabel,
      downloadUrl: this.buildDownloadUrl(artifactPath),
      fileName: file.name,
      id: `${this.id}:${logicalVersion}:${file.name}`,
      logicalVersion,
      modifiedAt: file.lastModifiedTime ?? null,
      properties,
      providerId: this.id,
      providerLabel: this.label,
      series: normalizeSeries(logicalVersion),
      checksumUrl,
      showInAllBranches: this.showInAllBranches,
      sourceText: source.sourceText,
      sourceUrl: source.sourceUrl,
      version: resolvedVersion,
    };
  }

  private async fetchEntriesForVersion(logicalVersion: string) {
    const details = await this.fetchDirectoryDetails(
      `${this.artifactRepositoryPath}/${logicalVersion}`
    );

    const entries = details.files
      .filter(file => isPrimaryJar(file, this.fileArtifactId))
      .map(file => this.mapJarToEntry(logicalVersion, file, details.files));

    return Promise.all(entries);
  }

  async loadEntries() {
    const versions = await this.fetchVersionDirectories();
    const entries = await Promise.all(versions.map(version => this.fetchEntriesForVersion(version)));
    return entries.flat();
  }
}
