import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const storageKey = "loadry-theme";
const legacyStorageKey = "lumi-download-theme";

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getInitialTheme(): ThemeMode {
  const stored =
    window.localStorage.getItem(storageKey) ??
    window.localStorage.getItem(legacyStorageKey);

  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return "system";
}

function applyTheme(themeMode: ThemeMode, resolvedTheme: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.classList.toggle("light", resolvedTheme === "light");
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.themeMode = themeMode;

  const background = getComputedStyle(document.documentElement)
    .getPropertyValue("--background")
    .trim();

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", background || (resolvedTheme === "dark" ? "#09090b" : "#ffffff"));
}

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const resolvedTheme = themeMode === "system" ? systemTheme : themeMode;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => setSystemTheme(getSystemTheme());

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    applyTheme(themeMode, resolvedTheme);
    window.localStorage.setItem(storageKey, themeMode);
  }, [resolvedTheme, themeMode]);

  return {
    resolvedTheme,
    setThemeMode,
    themeMode,
  };
}
