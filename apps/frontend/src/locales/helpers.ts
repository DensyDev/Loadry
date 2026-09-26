import languageCatalog from "./data/languages.json";

export type LocaleMessages = { [key: string]: string | LocaleMessages };

type LocaleMetadata = {
  aliases: string[];
  bcp47: string;
  code: string;
  file: string;
  flagCountryCode: string;
  label: string;
  nativeLabel: string;
};

type LanguageCatalog = {
  default: string;
  languages: LocaleMetadata[];
};

export type LocaleDefinition = LocaleMetadata & {
  messages: LocaleMessages;
};

export type LocaleCode = LocaleDefinition["code"];

const localeFiles = import.meta.glob("./data/*.json", {
  eager: true,
  import: "default",
}) as Record<string, LocaleMessages>;
const catalog = languageCatalog as LanguageCatalog;

function loadMessages(file: string) {
  const messages = localeFiles[`./data/${file}`];

  if (!messages) {
    throw new Error(`Locale file is missing: ${file}`);
  }

  return messages;
}

export const localeDefinitions: LocaleDefinition[] = catalog.languages.map(locale => ({
  ...locale,
  messages: loadMessages(locale.file),
}));

export const localeCodes = localeDefinitions.map(locale => locale.code);
export const defaultLocale =
  localeDefinitions.find(locale => locale.code === catalog.default) ?? localeDefinitions[0];

if (!defaultLocale) {
  throw new Error("At least one locale must be configured in languages.json");
}

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
  const normalizedValue = normalizeLocale(value);

  if (!normalizedValue) {
    return defaultLocale;
  }

  return (
    localeDefinitions.find(locale =>
      [locale.code, locale.bcp47, ...locale.aliases]
        .map(normalizeLocale)
        .includes(normalizedValue)
    ) ?? defaultLocale
  );
}

function normalizeLocale(value?: null | string) {
  return value?.trim().toLowerCase().replaceAll("_", "-");
}
