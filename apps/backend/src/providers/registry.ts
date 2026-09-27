import { z } from "zod";
import type { VersionProviderSource } from "../types.js";
import type { ProviderDefinition } from "./definition.js";
import { mavenProviderDefinition } from "./maven.js";
import { reposiliteProviderDefinition } from "./reposilite.js";
import { staticProviderDefinition } from "./static.js";

export const providerDefinitions = [
  reposiliteProviderDefinition,
  mavenProviderDefinition,
  staticProviderDefinition,
] as const;

type ConfigOf<TDefinition> = TDefinition extends ProviderDefinition<infer TSchema>
  ? z.output<TSchema>
  : never;

export type RegisteredProviderConfig = ConfigOf<(typeof providerDefinitions)[number]>;

const providersByType = new Map<string, (typeof providerDefinitions)[number]>();

for (const definition of providerDefinitions) {
  if (providersByType.has(definition.type)) {
    throw new Error(`Duplicate provider type registration: ${definition.type}`);
  }

  providersByType.set(definition.type, definition);
}

export const providerConfigSchema = z.unknown().transform((value, context) => {
  const type =
    typeof value === "object" && value !== null && "type" in value
      ? (value as { type?: unknown }).type
      : undefined;

  if (typeof type !== "string") {
    context.addIssue({
      code: "custom",
      message: "Provider type is required",
      path: ["type"],
    });
    return z.NEVER;
  }

  const definition = providersByType.get(type);

  if (!definition) {
    context.addIssue({
      code: "custom",
      message: `Unsupported provider type: ${type}`,
      path: ["type"],
    });
    return z.NEVER;
  }

  const result = definition.schema.safeParse(value);

  if (!result.success) {
    for (const issue of result.error.issues) {
      context.addIssue({
        code: "custom",
        message: issue.message,
        path: issue.path,
      });
    }

    return z.NEVER;
  }

  return result.data as RegisteredProviderConfig;
});

export function createVersionProvider(config: RegisteredProviderConfig): VersionProviderSource {
  const definition = providersByType.get(config.type);

  if (!definition) {
    throw new Error(`Provider type is not registered: ${config.type}`);
  }

  const create = definition.create as (
    registeredConfig: RegisteredProviderConfig
  ) => VersionProviderSource;
  return create(config);
}
