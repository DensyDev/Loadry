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
export type Health = z.infer<typeof healthSchema>;
export type Provider = z.infer<typeof providerSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Version = z.infer<typeof versionSchema>;
export type VersionLookupResult = z.infer<typeof versionLookupResultSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;

export type ListVersionsOptions = {
  branches?: readonly string[];
  limit?: number;
  versions?: readonly string[];
};

export type LookupVersionOptions = {
  branch: string;
  fields: Readonly<Record<string, string | number | boolean>>;
};
