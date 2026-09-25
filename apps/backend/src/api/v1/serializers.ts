import type { Project, Version } from "@densy/loadry-contracts";
import type { DownloadProject, VersionEntry } from "../../types.js";
import { createDownloadFilePath } from "../../download-routes.js";
import { createProjectPath } from "../../project.js";

function absoluteUrl(origin: string, path: string) {
  return new URL(path, origin).toString();
}

function toIsoTimestamp(timestamp: number | null) {
  if (!timestamp) {
    return null;
  }

  const milliseconds = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  return new Date(milliseconds).toISOString();
}

export function serializeProject(project: DownloadProject, origin: string): Project {
  const branches = new Map<
    string,
    { id: string; labelKey: string; showInAllBranches: boolean }
  >();

  for (const provider of project.providers) {
    const existingBranch = branches.get(provider.branch);
    branches.set(provider.branch, {
      id: provider.branch,
      labelKey: provider.branchLabel,
      showInAllBranches:
        provider.showInAllBranches || existingBranch?.showInAllBranches === true,
    });
  }

  return {
    branches: Array.from(branches.values()),
    description: project.description,
    domains: project.domains,
    id: project.id,
    links: {
      self: absoluteUrl(origin, `/api/v1/projects/${encodeURIComponent(project.id)}`),
      versions: absoluteUrl(
        origin,
        `/api/v1/projects/${encodeURIComponent(project.id)}/versions`
      ),
      website: absoluteUrl(origin, createProjectPath(project.id)),
    },
    name: project.name,
    providers: project.providers.map(provider => ({
      branch: provider.branch,
      branchLabelKey: provider.branchLabel,
      id: provider.id,
      label: provider.label,
    })),
  };
}

export function serializeVersion(
  project: DownloadProject,
  entry: VersionEntry,
  origin: string
): Version {
  return {
    branch: {
      id: entry.branch,
      labelKey: entry.branchLabel,
    },
    checksumUrl: entry.checksumUrl,
    directDownloadUrl: entry.downloadUrl,
    downloadUrl: absoluteUrl(
      origin,
      createDownloadFilePath(project.id, entry.branch, entry.fileName)
    ),
    fileName: entry.fileName,
    id: entry.id,
    logicalVersion: entry.logicalVersion,
    modifiedAt: toIsoTimestamp(entry.modifiedAt),
    properties: entry.properties,
    provider: {
      id: entry.providerId,
      label: entry.providerLabel,
    },
    series: entry.series,
    source:
      entry.sourceUrl || entry.sourceText
        ? {
            text: entry.sourceText,
            url: entry.sourceUrl,
          }
        : null,
    version: entry.version,
  };
}
