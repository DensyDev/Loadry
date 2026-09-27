import { z } from "zod";
import { identifierSchema } from "./providers/definition.js";
import { createVersionProvider, providerConfigSchema } from "./providers/registry.js";
import type { DownloadProject } from "./types.js";

const projectConfigSchema = z
  .object({
    description: z.string().default(""),
    domains: z.array(z.string().trim().min(1)).default([]),
    id: identifierSchema,
    name: z.string().trim().min(1),
    providers: z.array(providerConfigSchema),
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
    providers: project.providers.map(createVersionProvider),
  }));
}
