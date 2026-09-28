import { z } from "zod";
import type { VersionProviderSource } from "../types.js";
import {
  tagComparisonOperators,
  validateTagComparisonValue,
} from "../tag-operators.js";

export const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9._-]*$/i, "Must be a URL-safe identifier");

const tagConditionFieldSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    /^[a-z_][a-z0-9_-]*(?:\.[a-z0-9_-]+)*$/i,
    "Must be a dot-separated field path"
  );

const tagComparisonSchema = z
  .object({
    caseSensitive: z.boolean().default(false),
    field: tagConditionFieldSchema,
    operator: z.enum(tagComparisonOperators),
    value: z.union([z.string(), z.number().finite()]).optional(),
  })
  .strict()
  .superRefine((condition, context) => {
    const error = validateTagComparisonValue(
      condition.operator,
      condition.value,
      condition.caseSensitive
    );

    if (error) {
      context.addIssue({
        code: "custom",
        message: error,
        path: ["value"],
      });
    }
  });

export type TagCondition =
  | z.output<typeof tagComparisonSchema>
  | { all: TagCondition[] }
  | { any: TagCondition[] }
  | { not: TagCondition };

export const tagConditionSchema: z.ZodType<TagCondition> = z.lazy(() =>
  z.union([
    tagComparisonSchema,
    z.object({ all: z.array(tagConditionSchema).min(1) }).strict(),
    z.object({ any: z.array(tagConditionSchema).min(1) }).strict(),
    z.object({ not: tagConditionSchema }).strict(),
  ])
);

export const versionTagSchema = z
  .object({
    group: identifierSchema,
    value: identifierSchema,
  })
  .strict();

export type TagResolver = {
  group: string;
  value: string;
  when: TagCondition;
};

export const tagResolverSchema: z.ZodType<TagResolver> = z
  .object({
    group: identifierSchema,
    value: identifierSchema,
    when: tagConditionSchema,
  })
  .strict();

export const providerBaseSchema = z
  .object({
    branch: identifierSchema,
    branchLabel: z.string().trim().min(1).optional(),
    id: identifierSchema,
    label: z.string().trim().min(1),
    showInAllBranches: z.boolean().optional(),
    tagResolvers: z.array(tagResolverSchema).optional(),
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
