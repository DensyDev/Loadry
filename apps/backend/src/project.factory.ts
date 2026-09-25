import { ReposiliteVersionProviderSource } from "./providers/reposilite.js";
import type { DownloadProject } from "./types.js";

type ProjectEnvironment = Record<string, string | undefined>;

export function createDownloadProjects(env: ProjectEnvironment): DownloadProject[] {
  const artifactId =
    env.LOADRY_LUMI_ARTIFACT_ID ?? env.VITE_LUMI_ARTIFACT_ID ?? "Lumi";
  const groupId =
    env.LOADRY_LUMI_GROUP_ID ?? env.VITE_LUMI_GROUP_ID ?? "com.koshakmine";
  const reposiliteUrl =
    env.LOADRY_LUMI_REPOSILITE_URL ??
    env.VITE_LUMI_REPOSILITE_URL ??
    "https://repo.lumi.su";

  return [
    {
      description: "Minecraft Bedrock server software",
      domains: ["dl.lumi.su"],
      id: "lumi",
      name: "Lumi",
      providers: [
        new ReposiliteVersionProviderSource({
          artifactId,
          baseUrl: reposiliteUrl,
          branch: "stable",
          branchLabel: "branches.stable",
          groupId,
          id: "stable-releases",
          label: "Stable / Releases",
          repository:
            env.LOADRY_LUMI_STABLE_REPOSITORY ??
            env.VITE_LUMI_STABLE_REPOSITORY ??
            "releases",
        }),
        new ReposiliteVersionProviderSource({
          artifactId,
          baseUrl: reposiliteUrl,
          branch: "dev",
          branchLabel: "branches.dev",
          groupId,
          id: "dev-snapshots",
          label: "Dev / Snapshots",
          repository:
            env.LOADRY_LUMI_DEV_REPOSITORY ??
            env.VITE_LUMI_DEV_REPOSITORY ??
            "snapshots",
        }),
        new ReposiliteVersionProviderSource({
          artifactId: "Lumi-old",
          baseUrl: reposiliteUrl,
          branch: "legacy",
          branchLabel: "branches.legacy",
          fileArtifactId: "Lumi",
          groupId,
          id: "legacy-snapshots",
          label: "Legacy Snapshots",
          repository: "snapshots",
          showInAllBranches: false,
        }),
      ],
    },
  ];
}
