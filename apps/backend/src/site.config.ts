import type { Site } from "@densy/loadry-contracts";
import { localizedTextSchema, siteLinkIconSchema } from "@densy/loadry-contracts";
import { z } from "zod";

const publicUrlSchema = z.string().trim().min(1).refine(isSafePublicUrl, {
  message: "Expected a relative URL or an http, https, or mailto URL",
});

export const defaultSiteConfig: Site = {
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

export const siteConfigSchema = z
  .object({
    footer: z
      .object({
        enabled: z.boolean().default(defaultSiteConfig.footer.enabled),
        links: z
          .array(
            z
              .object({
                icon: siteLinkIconSchema.nullable().default(null),
                label: localizedTextSchema,
                url: publicUrlSchema,
              })
              .strict()
          )
          .default(defaultSiteConfig.footer.links),
        text: localizedTextSchema.nullable().default(defaultSiteConfig.footer.text),
      })
      .strict()
      .default(defaultSiteConfig.footer),
    header: z
      .object({
        brand: localizedTextSchema.default(defaultSiteConfig.header.brand),
        url: publicUrlSchema.nullable().default(defaultSiteConfig.header.url),
      })
      .strict()
      .default(defaultSiteConfig.header),
    name: z.string().trim().min(1).default(defaultSiteConfig.name),
    title: localizedTextSchema.default(defaultSiteConfig.title),
  })
  .strict()
  .default(defaultSiteConfig);

function isSafePublicUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    return ["http:", "https:", "mailto:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
