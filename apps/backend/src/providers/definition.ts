import { z } from "zod";
import type { VersionProviderSource } from "../types.js";

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
    operator: z.enum([
      "contains",
      "endsWith",
      "equals",
      "exists",
      "matches",
      "notEquals",
      "startsWith",
    ]),
    value: z.string().optional(),
  })
  .strict()
  .superRefine((condition, context) => {
    if (condition.operator === "exists") {
      if (condition.value !== undefined) {
        context.addIssue({
          code: "custom",
          message: "The exists operator does not accept a value",
          path: ["value"],
        });
      }
      return;
    }

    if (condition.value === undefined) {
      context.addIssue({
        code: "custom",
        message: `The ${condition.operator} operator requires a value`,
        path: ["value"],
      });
      return;
    }

    if (condition.operator === "matches") {
      try {
        new RegExp(condition.value, condition.caseSensitive ? "" : "i");
      } catch {
        context.addIssue({
          code: "custom",
          message: "Invalid regular expression",
          path: ["value"],
        });
      }
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
