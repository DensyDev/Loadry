import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const localeDirectory = fileURLToPath(new URL("../src/locales/data/", import.meta.url));
const catalog = await readJson("languages.json");

assertObject(catalog, "languages.json");

if (typeof catalog.default !== "string" || !Array.isArray(catalog.languages)) {
  fail("languages.json must contain a default locale and a languages array");
}

const requiredFields = [
  "aliases",
  "bcp47",
  "code",
  "file",
  "flagCountryCode",
  "label",
  "nativeLabel",
];
const codes = new Set();
const files = new Set();

for (const [index, language] of catalog.languages.entries()) {
  assertObject(language, `languages[${index}]`);

  for (const field of requiredFields) {
    if (!(field in language)) {
      fail(`languages[${index}] is missing ${field}`);
    }
  }

  if (
    typeof language.code !== "string" ||
    typeof language.file !== "string" ||
    typeof language.bcp47 !== "string" ||
    typeof language.flagCountryCode !== "string" ||
    typeof language.label !== "string" ||
    typeof language.nativeLabel !== "string" ||
    !Array.isArray(language.aliases) ||
    language.aliases.some(alias => typeof alias !== "string")
  ) {
    fail(`languages[${index}] contains invalid metadata`);
  }

  if (codes.has(language.code)) fail(`Duplicate locale code: ${language.code}`);
  if (files.has(language.file)) fail(`Duplicate locale file: ${language.file}`);
  codes.add(language.code);
  files.add(language.file);
}

if (!codes.has(catalog.default)) {
  fail(`Default locale is not listed: ${catalog.default}`);
}

const directoryFiles = (await readdir(localeDirectory))
  .filter(file => file.endsWith(".json") && file !== "languages.json")
  .sort();
const listedFiles = Array.from(files).sort();

if (JSON.stringify(directoryFiles) !== JSON.stringify(listedFiles)) {
  fail("Locale JSON files and languages.json entries do not match");
}

const defaultLanguage = catalog.languages.find(language => language.code === catalog.default);
const defaultMessages = flattenMessages(
  await readJson(defaultLanguage.file),
  defaultLanguage.file
);

for (const language of catalog.languages) {
  const messages = flattenMessages(await readJson(language.file), language.file);
  const missingKeys = [...defaultMessages.keys()].filter(key => !messages.has(key));
  const extraKeys = [...messages.keys()].filter(key => !defaultMessages.has(key));

  if (missingKeys.length || extraKeys.length) {
    fail(
      `${language.file} does not match ${defaultLanguage.file}` +
        `${missingKeys.length ? `; missing: ${missingKeys.join(", ")}` : ""}` +
        `${extraKeys.length ? `; extra: ${extraKeys.join(", ")}` : ""}`
    );
  }
}

console.log(`Validated ${catalog.languages.length} locale files.`);

async function readJson(file) {
  try {
    return JSON.parse(await readFile(join(localeDirectory, file), "utf8"));
  } catch (error) {
    fail(`Unable to read ${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function flattenMessages(value, file, prefix = "", result = new Map()) {
  assertObject(value, file);

  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof child === "string") {
      result.set(path, true);
    } else {
      flattenMessages(child, file, path, result);
    }
  }

  return result;
}

function assertObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${name} must be a JSON object`);
  }
}

function fail(message) {
  throw new Error(`Locale validation failed: ${message}`);
}
