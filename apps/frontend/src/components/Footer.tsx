import type { Project, Site, SiteLinkIcon } from "@densy/loadry-contracts";
import {
  BookOpen,
  ExternalLink,
  Github,
  Globe,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { resolveLocale } from "../locales";
import { renderSiteTemplate, renderSiteText } from "../utils/site";

type FooterProps = {
  project: Project | null;
  site: Site;
};

const linkIcons: Record<SiteLinkIcon, LucideIcon> = {
  "book-open": BookOpen,
  "external-link": ExternalLink,
  github: Github,
  globe: Globe,
  "message-circle": MessageCircle,
};

export function Footer({ project, site }: FooterProps) {
  const { i18n } = useTranslation();
  const locale = resolveLocale(i18n.resolvedLanguage ?? i18n.language);
  const text = site.footer.text
    ? renderSiteText(site.footer.text, site, project, locale)
    : null;

  if (!site.footer.enabled || (!text && site.footer.links.length === 0)) {
    return null;
  }

  return (
    <footer className="border-t border-default-200/70 bg-background">
      <div className="mx-auto flex w-full max-w-[1382px] flex-col gap-3 px-4 py-5 text-sm text-default-500 sm:flex-row sm:items-center sm:justify-between md:px-6">
        {text && <p className="m-0 min-w-0">{text}</p>}
        {site.footer.links.length > 0 && (
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {site.footer.links.map((link, index) => {
              const Icon = link.icon ? linkIcons[link.icon] : null;
              const url = renderSiteTemplate(link.url, site, project);
              const isExternal = /^https?:\/\//i.test(url);

              return (
                <a
                  className="inline-flex items-center gap-1.5 text-default-600 transition-colors hover:text-foreground"
                  href={url}
                  key={`${link.url}-${index}`}
                  rel={isExternal ? "noreferrer" : undefined}
                  target={isExternal ? "_blank" : undefined}
                >
                  {Icon && <Icon aria-hidden="true" size={15} />}
                  <span>{renderSiteText(link.label, site, project, locale)}</span>
                </a>
              );
            })}
          </nav>
        )}
      </div>
    </footer>
  );
}
