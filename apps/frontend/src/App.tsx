import { I18nProvider } from "@heroui/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProjectCatalogProvider } from "./contexts/project-catalog.context";
import { useTheme } from "./hooks/useTheme";
import { resolveLocale } from "./locales";
import { ProjectPage } from "./pages/ProjectPage";
import { DefaultProjectRedirect, ProjectAliasRedirect } from "./pages/ProjectRedirect";

function App() {
  const { i18n } = useTranslation();
  const { setThemeMode, themeMode } = useTheme();

  useEffect(() => {
    const locale = resolveLocale(i18n.resolvedLanguage ?? i18n.language);
    document.documentElement.lang = locale.bcp47;
  }, [i18n.language]);

  const locale = resolveLocale(i18n.resolvedLanguage ?? i18n.language);

  return (
    <I18nProvider locale={locale.bcp47}>
      <ProjectCatalogProvider>
        <Routes>
          <Route element={<Layout onThemeModeChange={setThemeMode} themeMode={themeMode} />}>
            <Route element={<DefaultProjectRedirect />} index />
            <Route element={<ProjectPage />} path="project/:projectId" />
            <Route element={<ProjectAliasRedirect />} path="p/:projectId" />
            <Route element={<DefaultProjectRedirect />} path="*" />
          </Route>
        </Routes>
      </ProjectCatalogProvider>
    </I18nProvider>
  );
}

export default App;
