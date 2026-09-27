import { useEffect } from "react";
import { matchPath, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjectCatalog } from "../contexts/project-catalog.context";
import type { ThemeMode } from "../hooks/useTheme";
import { resolveLocale } from "../locales";
import { renderSiteText } from "../utils/site";
import { Footer } from "./Footer";
import { Header } from "./Header";

type LayoutProps = {
  onThemeModeChange: (themeMode: ThemeMode) => void;
  themeMode: ThemeMode;
};

export function Layout({ onThemeModeChange, themeMode }: LayoutProps) {
  const location = useLocation();
  const { i18n } = useTranslation();
  const { projectService, site } = useProjectCatalog();
  const projectId =
    matchPath("/project/:projectId", location.pathname)?.params.projectId ??
    matchPath("/p/:projectId", location.pathname)?.params.projectId;
  const project = projectService.findById(projectId);
  const locale = resolveLocale(i18n.resolvedLanguage ?? i18n.language);
  const title = project ? renderSiteText(site.title, site, project, locale) : site.name;

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-background text-foreground">
      <Header
        onThemeModeChange={onThemeModeChange}
        project={project}
        site={site}
        themeMode={themeMode}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer project={project} site={site} />
    </div>
  );
}
