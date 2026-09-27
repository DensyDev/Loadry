import { z } from "zod";
import type { VersionProviderSource } from "../types.js";

export const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9._-]*$/i, "Must be a URL-safe identifier");

export const providerBaseSchema = z
  .object({
    branch: identifierSchema,
    branchLabel: z.string().trim().min(1).optional(),
    id: identifierSchema,
    label: z.string().trim().min(1),
    showInAllBranches: z.boolean().optional(),
  })
  .strict();

type ProviderConfig = {
  type: string;
};

export type ProviderDefinition<TSchema extends z.ZodType<ProviderConfig>> = {
  create(config: z.output<TSchema>): VersionProviderSource;
  schema: TSchema;
  type: z.output<TSchema>["type"];
};

export function defineProvider<TSchema extends z.ZodType<ProviderConfig>>(
  definition: ProviderDefinition<TSchema>
) {
  return definition;
}
