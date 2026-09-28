import { z } from "zod";
import type { Branch, VersionEntry, VersionProviderSource } from "../types.js";
import { normalizeSeries } from "../versioning.js";
import {
  defineProvider,
  providerBaseSchema,
  versionTagSchema,
  type TagResolver,
} from "./definition.js";

const staticEntrySchema = z
  .object({
    checksumUrl: z.url().nullable().optional(),
    downloadUrl: z.url(),
    fileName: z.string().trim().min(1),
    id: z.string().trim().min(1).optional(),
    logicalVersion: z.string().trim().min(1).optional(),
    modifiedAt: z.union([z.iso.datetime(), z.number().finite()]).nullable().optional(),
    properties: z.record(z.string(), z.string()).nullable().optional(),
    series: z.string().trim().min(1).optional(),
    sourceText: z.string().trim().min(1).nullable().optional(),
    sourceUrl: z.url().nullable().optional(),
    tags: z.array(versionTagSchema).optional(),
    version: z.string().trim().min(1),
  })
  .strict();

export const staticProviderConfigSchema = providerBaseSchema
  .extend({
    entries: z.array(staticEntrySchema).default([]),
    type: z.literal("static"),
  })
  .strict()
  .superRefine((provider, context) => {
    const ids = provider.entries.map(entry => {
      const logicalVersion = entry.logicalVersion ?? entry.version;
      return entry.id ?? `${provider.id}:${logicalVersion}:${entry.fileName}`;
    });

    for (const [index, id] of ids.entries()) {
      if (ids.indexOf(id) !== index) {
        context.addIssue({
          code: "custom",
          message: `Static entry ID must be unique within the provider: ${id}`,
          path: ["entries", index, "id"],
        });
      }
    }
  });

export type StaticProviderConfig = z.output<typeof staticProviderConfigSchema>;

function normalizeModifiedAt(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Date.parse(value);
  }

  return null;
}

export class StaticVersionProviderSource implements VersionProviderSource {
  readonly branch: Branch;
  readonly branchLabel: string;
  readonly id: string;
  readonly label: string;
  readonly showInAllBranches: boolean;
  readonly tagResolvers: TagResolver[];
  private readonly entries: VersionEntry[];

  constructor(options: StaticProviderConfig) {
    this.branch = options.branch;
    this.branchLabel = options.branchLabel ?? `branches.${options.branch}`;
    this.id = options.id;
    this.label = options.label;
    this.showInAllBranches = options.showInAllBranches ?? true;
    this.tagResolvers = options.tagResolvers ?? [];
    this.entries = options.entries.map(entry => {
      const logicalVersion = entry.logicalVersion ?? entry.version;

      return {
        branch: this.branch,
        branchLabel: this.branchLabel,
        checksumUrl: entry.checksumUrl ?? null,
        downloadUrl: entry.downloadUrl,
        fileName: entry.fileName,
        id: entry.id ?? `${this.id}:${logicalVersion}:${entry.fileName}`,
        logicalVersion,
        maven: null,
        modifiedAt: normalizeModifiedAt(entry.modifiedAt),
        properties: entry.properties ?? null,
        providerId: this.id,
        providerLabel: this.label,
        series: entry.series ?? normalizeSeries(logicalVersion),
        showInAllBranches: this.showInAllBranches,
        sourceText: entry.sourceText ?? null,
        sourceUrl: entry.sourceUrl ?? null,
        tags: entry.tags ?? [],
        version: entry.version,
      };
    });
  }

  async loadEntries() {
    return this.entries.map(entry => ({
      ...entry,
      properties: entry.properties ? { ...entry.properties } : null,
      tags: entry.tags.map(tag => ({ ...tag })),
    }));
  }
}

export const staticProviderDefinition = defineProvider({
  create: config => new StaticVersionProviderSource(config),
  schema: staticProviderConfigSchema,
  type: "static",
});
