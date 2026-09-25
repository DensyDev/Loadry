import de_DE from "./de_DE.json";
import en_US from "./en_US.json";
import es_ES from "./es_ES.json";
import fr_FR from "./fr_FR.json";
import ja_JP from "./ja_JP.json";
import pl_PL from "./pl_PL.json";
import pt_BR from "./pt_BR.json";
import ro_RO from "./ro_RO.json";
import ru_RU from "./ru_RU.json";
import tr_TR from "./tr_TR.json";
import uk_UA from "./uk_UA.json";
import zh_CN from "./zh_CN.json";

export type LocaleMessages = { [key: string]: string | LocaleMessages };

export type LocaleDefinition = {
  aliases: readonly string[];
  bcp47: string;
  code: string;
  flagCountryCode: string;
  label: string;
  messages: LocaleMessages;
  nativeLabel: string;
};

export const localeDefinitions = [
  {
    aliases: ["en", "en-us", "en_us"],
    bcp47: "en-US",
    code: "en_US",
    flagCountryCode: "us",
    label: "English",
    messages: en_US,
    nativeLabel: "English",
  },
  {
    aliases: ["ru", "ru-ru", "ru_ru"],
    bcp47: "ru-RU",
    code: "ru_RU",
    flagCountryCode: "ru",
    label: "Russian",
    messages: ru_RU,
    nativeLabel: "Русский",
  },
  {
    aliases: ["uk", "uk-ua", "uk_ua", "ua"],
    bcp47: "uk-UA",
    code: "uk_UA",
    flagCountryCode: "ua",
    label: "Ukrainian",
    messages: uk_UA,
    nativeLabel: "Українська",
  },
  {
    aliases: ["pl", "pl-pl", "pl_pl"],
    bcp47: "pl-PL",
    code: "pl_PL",
    flagCountryCode: "pl",
    label: "Polish",
    messages: pl_PL,
    nativeLabel: "Polski",
  },
  {
    aliases: ["de", "de-de", "de_de"],
    bcp47: "de-DE",
    code: "de_DE",
    flagCountryCode: "de",
    label: "German",
    messages: de_DE,
    nativeLabel: "Deutsch",
  },
  {
    aliases: ["fr", "fr-fr", "fr_fr"],
    bcp47: "fr-FR",
    code: "fr_FR",
    flagCountryCode: "fr",
    label: "French",
    messages: fr_FR,
    nativeLabel: "Français",
  },
  {
    aliases: ["es", "es-es", "es_es"],
    bcp47: "es-ES",
    code: "es_ES",
    flagCountryCode: "es",
    label: "Spanish",
    messages: es_ES,
    nativeLabel: "Español",
  },
  {
    aliases: ["pt", "pt-br", "pt_br"],
    bcp47: "pt-BR",
    code: "pt_BR",
    flagCountryCode: "br",
    label: "Portuguese (Brazil)",
    messages: pt_BR,
    nativeLabel: "Português (Brasil)",
  },
  {
    aliases: ["ro", "ro-ro", "ro_ro"],
    bcp47: "ro-RO",
    code: "ro_RO",
    flagCountryCode: "ro",
    label: "Romanian",
    messages: ro_RO,
    nativeLabel: "Română",
  },
  {
    aliases: ["tr", "tr-tr", "tr_tr"],
    bcp47: "tr-TR",
    code: "tr_TR",
    flagCountryCode: "tr",
    label: "Turkish",
    messages: tr_TR,
    nativeLabel: "Türkçe",
  },
  {
    aliases: ["zh", "zh-cn", "zh_cn", "zh-hans", "zh_hans"],
    bcp47: "zh-CN",
    code: "zh_CN",
    flagCountryCode: "cn",
    label: "Chinese (Simplified)",
    messages: zh_CN,
    nativeLabel: "简体中文",
  },
  {
    aliases: ["ja", "ja-jp", "ja_jp"],
    bcp47: "ja-JP",
    code: "ja_JP",
    flagCountryCode: "jp",
    label: "Japanese",
    messages: ja_JP,
    nativeLabel: "日本語",
  },
] as const satisfies readonly LocaleDefinition[];
