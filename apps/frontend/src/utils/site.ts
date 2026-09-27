import type { LocalizedText, Project, Site } from "@densy/loadry-contracts";
import type { LocaleDefinition } from "../locales";

export const fallbackSite: Site = {
  footer: {
    enabled: true,
    links: [
      {
        icon: "github",
        label: "GitHub",
        url: "https://github.com/DensyDev/Loadry",
      },
    ],
    text: "{site.name}",
  },
  header: {
    brand: "{site.name}",
    url: "/",
  },
  name: "Loadry",
  title: "{project.name} — {site.name}",
};

export function renderSiteText(
  value: LocalizedText,
  site: Site,
  project: Project | null,
  locale: LocaleDefinition
) {
  return renderSiteTemplate(resolveLocalizedText(value, locale), site, project);
}

export function renderSiteTemplate(template: string, site: Site, project: Project | null) {
  const replacements: Record<string, string> = {
    "{project.id}": project?.id ?? "",
    "{project.name}": project?.name ?? site.name,
    "{site.name}": site.name,
    "{year}": String(new Date().getFullYear()),
  };

  return Object.entries(replacements).reduce(
    (value, [placeholder, replacement]) => value.replaceAll(placeholder, replacement),
    template
  );
}

function resolveLocalizedText(value: LocalizedText, locale: LocaleDefinition) {
  if (typeof value === "string") {
    return value;
  }

  const candidates = [locale.code, locale.bcp47, ...locale.aliases, "en_US", "en-US", "en"];

  for (const candidate of candidates) {
    const match = findLocaleValue(value, candidate);

    if (match !== undefined) {
      return match;
    }
  }

  return Object.values(value)[0] ?? "";
}

function findLocaleValue(values: Record<string, string>, locale: string) {
  const normalizedLocale = normalizeLocale(locale);
  const entry = Object.entries(values).find(
    ([candidate]) => normalizeLocale(candidate) === normalizedLocale
  );
  return entry?.[1];
}

function normalizeLocale(value: string) {
  return value.trim().toLowerCase().replaceAll("_", "-");
}
