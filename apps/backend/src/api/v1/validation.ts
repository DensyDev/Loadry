import { z } from "zod";
import {
  versionLookupFields,
  type VersionLookupField,
} from "../../version.service.js";

function parseList(value: unknown) {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];

  return Array.from(
    new Set(
      values
        .filter((item): item is string => typeof item === "string")
        .flatMap(item => item.split(","))
        .map(item => item.trim())
        .filter(item => item && item !== "all")
    )
  );
}

const filterListSchema = z.preprocess(parseList, z.array(z.string()));

const tagFilterSchema = z
  .preprocess(
    parseList,
    z.array(z.string().regex(/^[a-z0-9][a-z0-9._-]*:[a-z0-9][a-z0-9._-]*$/i))
  )
  .transform(tags =>
    tags.map(tag => {
      const separator = tag.indexOf(":");
      return { group: tag.slice(0, separator), value: tag.slice(separator + 1) };
    })
  );

const limitSchema = z.preprocess(
  value => (Array.isArray(value) ? value[0] : value),
  z.coerce.number().int().min(1).max(1000).optional()
);

const pageSchema = z.preprocess(
  value => (Array.isArray(value) ? value[0] : value),
  z.coerce.number().int().min(1).optional()
);

const optionalTextSchema = (maximumLength: number) =>
  z.preprocess(
    value => {
      const normalized = Array.isArray(value) ? value[0] : value;
      return typeof normalized === "string" && normalized.trim()
        ? normalized.trim()
        : undefined;
    },
    z.string().max(maximumLength).optional()
  );

const optionalTimestampSchema = z.preprocess(
  value => (Array.isArray(value) ? value[0] : value),
  z.iso.datetime({ offset: true }).optional()
);

export const versionsQuerySchema = z.object({
  branches: filterListSchema,
  limit: limitSchema,
  modifiedAfter: optionalTimestampSchema,
  modifiedBefore: optionalTimestampSchema,
  page: pageSchema,
  propertyKey: optionalTextSchema(200),
  propertyValue: optionalTextSchema(500),
  query: optionalTextSchema(200),
  tags: tagFilterSchema,
  versions: filterListSchema,
});

const lookupValueSchema = z.union([
  z.string(),
  z.array(z.string()).length(1).transform(values => values[0]),
]);

const lookupFields = new Set<string>(versionLookupFields);

function isLookupField(field: string): field is VersionLookupField {
  return lookupFields.has(field) || field.startsWith("properties.") && field.length > 11;
}

const lookupFieldSchema = z
  .string()
  .refine(isLookupField, { message: "Unsupported lookup field" })
  .transform(field => field as VersionLookupField);

export const versionLookupQuerySchema = z
  .record(z.string(), lookupValueSchema)
  .transform(query => ({
    branch: query.branch ?? "",
    filters: Object.entries(query)
      .filter(([field]) => field !== "branch")
      .map(([field, value]) => ({ field, value })),
  }))
  .pipe(
    z.object({
      branch: z.string().min(1),
      filters: z
        .array(
          z.object({
            field: lookupFieldSchema,
            value: z.string(),
          })
        )
        .min(1, "At least one lookup filter is required"),
    })
  );
