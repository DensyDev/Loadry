import { z } from "zod";
import { identifierSchema } from "./providers/definition.js";
import { createVersionProvider, providerConfigSchema } from "./providers/registry.js";
import { siteConfigSchema } from "./site.config.js";
import type { DownloadProject } from "./types.js";

const tagValueSchema = z
  .object({
    id: identifierSchema,
    label: z.string().trim().min(1),
  })
  .strict();

const tagGroupSchema = z
  .object({
    id: identifierSchema,
    label: z.string().trim().min(1),
    values: z.array(tagValueSchema).min(1),
  })
  .strict()
  .superRefine((group, context) => {
    reportDuplicates(
      group.values.map(value => value.id),
      `Tag value IDs must be unique within group ${group.id}`,
      context
    );
  });

const projectConfigSchema = z
  .object({
    description: z.string().default(""),
    domains: z.array(z.string().trim().min(1)).default([]),
    id: identifierSchema,
    name: z.string().trim().min(1),
    providers: z.array(providerConfigSchema),
    tagGroups: z.array(tagGroupSchema).default([]),
  })
  .strict()
  .superRefine((project, context) => {
    reportDuplicates(
      project.providers.map(provider => provider.id),
      "Provider IDs must be unique within a project",
      context
    );
    reportDuplicates(
      project.tagGroups.map(group => group.id),
      "Tag group IDs must be unique within a project",
      context
    );

    const knownTags = new Set(
      project.tagGroups.flatMap(group =>
        group.values.map(value => `${group.id}:${value.id}`)
      )
    );

    project.providers.forEach((provider, providerIndex) => {
      for (const [resolverIndex, resolver] of (provider.tagResolvers ?? []).entries()) {
        if (!knownTags.has(`${resolver.group}:${resolver.value}`)) {
          context.addIssue({
            code: "custom",
            message: `Unknown tag referenced by resolver: ${resolver.group}:${resolver.value}`,
            path: ["providers", providerIndex, "tagResolvers", resolverIndex],
          });
        }
      }

      if (provider.type === "static") {
        provider.entries.forEach((entry, entryIndex) => {
          for (const [tagIndex, tag] of (entry.tags ?? []).entries()) {
            if (!knownTags.has(`${tag.group}:${tag.value}`)) {
              context.addIssue({
                code: "custom",
                message: `Unknown tag assigned to static entry: ${tag.group}:${tag.value}`,
                path: ["providers", providerIndex, "entries", entryIndex, "tags", tagIndex],
              });
            }
          }
        });
      }
    });
  });

export const loadryConfigSchema = z
  .object({
    projects: z.array(projectConfigSchema).default([]),
    site: siteConfigSchema,
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
    tagGroups: project.tagGroups,
  }));
}
