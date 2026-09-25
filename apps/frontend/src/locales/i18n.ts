import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { defaultLocale, localeAliases, localeResources } from "./";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    cleanCode: false,
    detection: {
      caches: ["localStorage"],
      order: ["localStorage", "navigator"],
    },
    fallbackLng: defaultLocale.code,
    interpolation: {
      escapeValue: false,
    },
    load: "currentOnly",
    lowerCaseLng: false,
    nonExplicitSupportedLngs: false,
    resources: localeResources,
    supportedLngs: localeAliases,
  });

export default i18n;
