import { z } from "zod";

export const branchSchema = z.object({
  id: z.string(),
  labelKey: z.string(),
  showInAllBranches: z.boolean(),
});

export const providerSchema = z.object({
  branch: z.string(),
  branchLabelKey: z.string(),
  id: z.string(),
  label: z.string(),
});

export const localizedTextSchema = z.union([
  z.string(),
  z.record(z.string(), z.string()),
]);

export const siteLinkIconSchema = z.enum([
  "book-open",
  "external-link",
  "github",
  "globe",
  "message-circle",
]);

export const siteSchema = z.object({
  footer: z.object({
    enabled: z.boolean(),
    links: z.array(
      z.object({
        icon: siteLinkIconSchema.nullable(),
        label: localizedTextSchema,
        url: z.string(),
      })
    ),
    text: localizedTextSchema.nullable(),
  }),
  header: z.object({
    brand: localizedTextSchema,
    url: z.string().nullable(),
  }),
  name: z.string(),
  title: localizedTextSchema,
});

export const projectSchema = z.object({
  branches: z.array(branchSchema),
  description: z.string(),
  domains: z.array(z.string()),
  id: z.string(),
  links: z.object({
    self: z.url(),
    versions: z.url(),
    website: z.url(),
  }),
  name: z.string(),
  providers: z.array(providerSchema),
});

export const catalogSchema = z.object({
  projects: z.array(projectSchema),
  site: siteSchema,
});

export const mavenArtifactSchema = z.object({
  artifactId: z.string(),
  classifier: z.string().nullable(),
  extension: z.string(),
  groupId: z.string(),
  repository: z.object({
    id: z.string(),
    name: z.string(),
    url: z.url(),
  }),
  version: z.string(),
});

export const versionSchema = z.object({
  branch: z.object({
    id: z.string(),
    labelKey: z.string(),
  }),
  checksumUrl: z.url().nullable(),
  directDownloadUrl: z.url(),
  downloadUrl: z.url(),
  fileName: z.string(),
  id: z.string(),
  logicalVersion: z.string(),
  maven: mavenArtifactSchema.nullable(),
  modifiedAt: z.iso.datetime().nullable(),
  properties: z.record(z.string(), z.string()).nullable(),
  provider: z.object({
    id: z.string(),
    label: z.string(),
  }),
  series: z.string(),
  source: z
    .object({
      text: z.string().nullable(),
      url: z.url().nullable(),
    })
    .nullable(),
  version: z.string(),
});

export const versionPageSchema = z.object({
  items: z.array(versionSchema),
  pagination: z.object({
    maxPageSize: z.number().int().positive(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    pageSizeStep: z.number().int().positive(),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().positive(),
  }),
  propertyKeys: z.array(z.string()),
  series: z.array(z.string()),
});

export const versionLookupResultSchema = z.object({
  neighbors: z.object({
    newer: versionSchema.nullable(),
    older: versionSchema.nullable(),
  }),
  position: z.object({
    index: z.number().int().nonnegative(),
    newerCount: z.number().int().nonnegative(),
    olderCount: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
  version: versionSchema,
});

export const apiErrorSchema = z
  .object({
    details: z.unknown().optional(),
    matches: z.number().int().nonnegative().optional(),
    message: z.string(),
  })
  .passthrough();

export const healthSchema = z.object({
  status: z.literal("ok"),
  version: z.string(),
});

export type Branch = z.infer<typeof branchSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type Health = z.infer<typeof healthSchema>;
export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type MavenArtifact = z.infer<typeof mavenArtifactSchema>;
export type Provider = z.infer<typeof providerSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Site = z.infer<typeof siteSchema>;
export type SiteLinkIcon = z.infer<typeof siteLinkIconSchema>;
export type Version = z.infer<typeof versionSchema>;
export type VersionPage = z.infer<typeof versionPageSchema>;
export type VersionLookupResult = z.infer<typeof versionLookupResultSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;

export type VersionSearchOptions = {
  modifiedAfter?: string;
  modifiedBefore?: string;
  propertyKey?: string;
  propertyValue?: string;
  query?: string;
};

export type ListVersionsOptions = VersionSearchOptions & {
  branches?: readonly string[];
  limit?: number;
  versions?: readonly string[];
};

export type ListVersionPageOptions = VersionSearchOptions & {
  branches?: readonly string[];
  limit?: number;
  page?: number;
  versions?: readonly string[];
};

export type LookupVersionOptions = {
  branch: string;
  fields: Readonly<Record<string, string | number | boolean>>;
};
