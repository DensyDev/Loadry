import { localeDefinitions } from "./locales/definitions";

export type LocaleCode = (typeof localeDefinitions)[number]["code"];
export type LocaleDefinition = (typeof localeDefinitions)[number];
export type LocaleMessages = LocaleDefinition["messages"];

export const localeCodes = localeDefinitions.map(locale => locale.code) as LocaleCode[];
export const defaultLocale = localeDefinitions[0];

export const localeAliases = localeDefinitions.flatMap(locale => [
  locale.code,
  locale.bcp47,
  ...locale.aliases,
]);

export const localeResources = Object.fromEntries(
  localeDefinitions.flatMap(locale => [
    [locale.code, { translation: locale.messages }],
    [locale.bcp47, { translation: locale.messages }],
    ...locale.aliases.map(alias => [alias, { translation: locale.messages }] as const),
  ])
);

export function resolveLocale(value?: null | string) {
  const normalizedValue = value?.trim().toLowerCase().replaceAll("_", "-");

  if (!normalizedValue) {
    return defaultLocale;
  }

  return (
    localeDefinitions.find(locale =>
      [locale.code.toLowerCase(), locale.bcp47.toLowerCase(), ...locale.aliases].includes(
        normalizedValue
      )
    ) ?? defaultLocale
  );
}
