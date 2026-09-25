import { z } from "zod";
import { ReposiliteVersionProviderSource } from "./providers/reposilite.js";
import type { DownloadProject } from "./types.js";

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9._-]*$/i, "Must be a URL-safe identifier");

const reposiliteProviderConfigSchema = z
  .object({
    artifactId: z.string().trim().min(1),
    baseUrl: z.url(),
    branch: identifierSchema,
    branchLabel: z.string().trim().min(1).optional(),
    fileArtifactId: z.string().trim().min(1).optional(),
    groupId: z.string().trim().min(1),
    id: identifierSchema,
    label: z.string().trim().min(1),
    repository: z.string().trim().min(1),
    showInAllBranches: z.boolean().optional(),
    type: z.literal("reposilite"),
  })
  .strict();

const projectConfigSchema = z
  .object({
    description: z.string().default(""),
    domains: z.array(z.string().trim().min(1)).default([]),
    id: identifierSchema,
    name: z.string().trim().min(1),
    providers: z.array(reposiliteProviderConfigSchema),
  })
  .strict()
  .superRefine((project, context) => {
    reportDuplicates(
      project.providers.map(provider => provider.id),
      "Provider IDs must be unique within a project",
      context
    );
  });

export const loadryConfigSchema = z
  .object({
    projects: z.array(projectConfigSchema).default([]),
    version: z.literal(1),
  })
  .strict()
  .superRefine((config, context) => {
    reportDuplicates(
      config.projects.map(project => project.id),
      "Project IDs must be unique",
      context
    );
  });

export type LoadryConfig = z.infer<typeof loadryConfigSchema>;

function reportDuplicates(values: string[], message: string, context: z.RefinementCtx) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);

  if (duplicates.length > 0) {
    context.addIssue({
      code: "custom",
      message: `${message}: ${Array.from(new Set(duplicates)).join(", ")}`,
    });
  }
}

export function createDownloadProjects(config: LoadryConfig): DownloadProject[] {
  return config.projects.map(project => ({
    description: project.description,
    domains: project.domains,
    id: project.id,
    name: project.name,
    providers: project.providers.map(provider => {
      switch (provider.type) {
        case "reposilite":
          return new ReposiliteVersionProviderSource({
            ...provider,
            branchLabel: provider.branchLabel ?? `branches.${provider.branch}`,
          });
      }
    }),
  }));
}
