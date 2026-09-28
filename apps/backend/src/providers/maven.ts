import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import type { Branch, VersionEntry, VersionProviderSource } from "../types.js";
import { normalizeSeries } from "../versioning.js";
import { defineProvider, providerBaseSchema } from "./definition.js";
import type { TagResolver } from "./definition.js";
import { buildSourceFromProperties, fetchTextOrNull, parseProperties } from "./support.js";

const checksumAlgorithmSchema = z.enum(["md5", "sha1", "sha256", "sha512"]);

export const mavenProviderConfigSchema = providerBaseSchema
  .extend({
    artifactId: z.string().trim().min(1),
    baseUrl: z.url(),
    checksumAlgorithm: checksumAlgorithmSchema.nullable().optional(),
    classifier: z.string().trim().min(1).nullable().optional(),
    extension: z.string().trim().min(1).default("jar"),
    fileArtifactId: z.string().trim().min(1).optional(),
    groupId: z.string().trim().min(1),
    includeProperties: z.boolean().default(false),
    type: z.literal("maven"),
  })
  .strict();

export type MavenProviderConfig = z.output<typeof mavenProviderConfigSchema>;

type MavenSnapshotVersion = {
  classifier?: string;
  extension?: string;
  updated?: string;
  value?: string;
};

type MavenMetadata = {
  metadata?: {
    versioning?: {
      lastUpdated?: string;
      snapshot?: {
        buildNumber?: number | string;
        timestamp?: string;
      };
      snapshotVersions?: {
        snapshotVersion?: MavenSnapshotVersion | MavenSnapshotVersion[];
      };
      versions?: {
        version?: string | string[];
      };
    };
  };
};

type ResolvedMavenVersion = {
  modifiedAt: number | null;
  value: string;
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function parseMavenTimestamp(value: string | undefined) {
  if (!value || !/^\d{14}$/.test(value)) {
    return null;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));
  const hour = Number(value.slice(8, 10));
  const minute = Number(value.slice(10, 12));
  const second = Number(value.slice(12, 14));
  return Date.UTC(year, month, day, hour, minute, second);
}

async function fetchXml(
  url: string,
  fetchImplementation: typeof globalThis.fetch
): Promise<MavenMetadata> {
  const response = await fetchImplementation(url, {
    headers: { Accept: "application/xml, text/xml" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Maven metadata ${url}: ${response.status}`);
  }

  return xmlParser.parse(await response.text()) as MavenMetadata;
}

export class MavenVersionProviderSource implements VersionProviderSource {
  readonly artifactId: string;
  readonly baseUrl: string;
  readonly branch: Branch;
  readonly branchLabel: string;
  readonly checksumAlgorithm: z.output<typeof checksumAlgorithmSchema> | null;
  readonly classifier: string | null;
  readonly extension: string;
  readonly fileArtifactId: string;
  readonly groupId: string;
  readonly id: string;
  readonly includeProperties: boolean;
  readonly label: string;
  readonly showInAllBranches: boolean;
  readonly tagResolvers: TagResolver[];

  constructor(
    options: MavenProviderConfig,
    private readonly fetchImplementation: typeof globalThis.fetch = globalThis.fetch
  ) {
    this.artifactId = options.artifactId;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.branch = options.branch;
    this.branchLabel = options.branchLabel ?? `branches.${options.branch}`;
    this.checksumAlgorithm = options.checksumAlgorithm ?? null;
    this.classifier = options.classifier ?? null;
    this.extension = options.extension;
    this.fileArtifactId = options.fileArtifactId ?? options.artifactId;
    this.groupId = options.groupId;
    this.id = options.id;
    this.includeProperties = options.includeProperties;
    this.label = options.label;
    this.showInAllBranches = options.showInAllBranches ?? true;
    this.tagResolvers = options.tagResolvers ?? [];
  }

  private get artifactBaseUrl() {
    return `${this.baseUrl}/${this.groupId.replaceAll(".", "/")}/${this.artifactId}`;
  }

  private async resolveVersion(logicalVersion: string): Promise<ResolvedMavenVersion> {
    if (!logicalVersion.endsWith("-SNAPSHOT")) {
      return { modifiedAt: null, value: logicalVersion };
    }

    const metadata = await fetchXml(
      `${this.artifactBaseUrl}/${logicalVersion}/maven-metadata.xml`,
      this.fetchImplementation
    );
    const versioning = metadata.metadata?.versioning;
    const snapshotVersion = asArray(versioning?.snapshotVersions?.snapshotVersion).find(
      candidate =>
        candidate.extension === this.extension &&
        (candidate.classifier ?? null) === this.classifier
    );

    if (snapshotVersion?.value) {
      return {
        modifiedAt: parseMavenTimestamp(snapshotVersion.updated ?? versioning?.lastUpdated),
        value: snapshotVersion.value,
      };
    }

    const timestamp = versioning?.snapshot?.timestamp;
    const buildNumber = versioning?.snapshot?.buildNumber;

    if (!timestamp || buildNumber === undefined) {
      throw new Error(`Maven snapshot metadata is incomplete for ${logicalVersion}`);
    }

    return {
      modifiedAt: parseMavenTimestamp(versioning?.lastUpdated),
      value: logicalVersion.replace(/-SNAPSHOT$/, `-${timestamp}-${buildNumber}`),
    };
  }

  private buildFileName(resolvedVersion: string) {
    const classifier = this.classifier ? `-${this.classifier}` : "";
    return `${this.fileArtifactId}-${resolvedVersion}${classifier}.${this.extension}`;
  }

  private async inspectArtifact(url: string) {
    const response = await this.fetchImplementation(url, { method: "HEAD" });

    if (response.status === 404) {
      return { exists: false, modifiedAt: null };
    }

    if (!response.ok && response.status !== 405 && response.status !== 501) {
      throw new Error(`Failed to access Maven artifact ${url}: ${response.status}`);
    }

    const lastModified = response.headers.get("last-modified");
    const parsedLastModified = lastModified ? Date.parse(lastModified) : Number.NaN;
    return {
      exists: true,
      modifiedAt: Number.isNaN(parsedLastModified) ? null : parsedLastModified,
    };
  }

  private async checksumUrlOrNull(downloadUrl: string) {
    if (!this.checksumAlgorithm) {
      return null;
    }

    const checksumUrl = `${downloadUrl}.${this.checksumAlgorithm}`;
    const response = await this.fetchImplementation(checksumUrl, { method: "HEAD" });
    return response.ok ? checksumUrl : null;
  }

  private async mapVersionToEntry(logicalVersion: string): Promise<VersionEntry | null> {
    const resolved = await this.resolveVersion(logicalVersion);
    const fileName = this.buildFileName(resolved.value);
    const downloadUrl = `${this.artifactBaseUrl}/${logicalVersion}/${fileName}`;
    const artifact = await this.inspectArtifact(downloadUrl);

    if (!artifact.exists) {
      return null;
    }

    const propertiesUrl = downloadUrl.replace(
      new RegExp(`\\.${this.extension.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
      ".properties"
    );
    const propertiesContent = this.includeProperties
      ? await fetchTextOrNull(propertiesUrl, this.fetchImplementation)
      : null;
    const properties = propertiesContent ? parseProperties(propertiesContent) : null;
    const source = properties
      ? buildSourceFromProperties(properties)
      : { sourceText: null, sourceUrl: null };

    return {
      branch: this.branch,
      branchLabel: this.branchLabel,
      checksumUrl: await this.checksumUrlOrNull(downloadUrl),
      downloadUrl,
      fileName,
      id: `${this.id}:${logicalVersion}:${fileName}`,
      logicalVersion,
      maven: {
        artifactId: this.artifactId,
        classifier: this.classifier,
        extension: this.extension,
        groupId: this.groupId,
        repository: {
          id: this.id,
          name: this.label,
          url: this.baseUrl,
        },
        version: logicalVersion,
      },
      modifiedAt: artifact.modifiedAt ?? resolved.modifiedAt,
      properties,
      providerId: this.id,
      providerLabel: this.label,
      series: normalizeSeries(logicalVersion),
      showInAllBranches: this.showInAllBranches,
      sourceText: source.sourceText,
      sourceUrl: source.sourceUrl,
      tags: [],
      version: resolved.value,
    };
  }

  async loadEntries() {
    const metadata = await fetchXml(
      `${this.artifactBaseUrl}/maven-metadata.xml`,
      this.fetchImplementation
    );
    const versions = asArray(metadata.metadata?.versioning?.versions?.version);
    const entries = await Promise.all(versions.map(version => this.mapVersionToEntry(version)));
    return entries.filter((entry): entry is VersionEntry => entry !== null);
  }
}

export const mavenProviderDefinition = defineProvider({
  create: config => new MavenVersionProviderSource(config),
  schema: mavenProviderConfigSchema,
  type: "maven",
});
