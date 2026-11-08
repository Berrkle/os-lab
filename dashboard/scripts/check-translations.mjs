#!/usr/bin/env node
// Keep every locale in step when visible English copy is added to the catalog.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const locales = ["tr", "de", "fr", "es", "it", "fa", "ar"];
const dictionaries = Object.fromEntries(locales.map((locale) => [
  locale,
  JSON.parse(readFileSync(join(root, "src/i18n/generated", `${locale}.json`), "utf8")),
]));
const expected = new Set(Object.keys(dictionaries.tr));
let errors = 0;
for (const [locale, dictionary] of Object.entries(dictionaries)) {
  const actual = new Set(Object.keys(dictionary));
  const missing = [...expected].filter((key) => !actual.has(key));
  const extra = [...actual].filter((key) => !expected.has(key));
  const empty = [...actual].filter((key) => typeof dictionary[key] !== "string" || !dictionary[key].trim());
  for (const [kind, keys] of [["missing", missing], ["extra", extra], ["empty", empty]]) {
    if (!keys.length) continue;
    errors += keys.length;
    console.error(`${locale}: ${kind} ${keys.length} translation(s): ${keys.slice(0, 10).join(" | ")}`);
  }
}
if (errors) process.exit(1);
console.log(`${expected.size} translation keys are present in all ${locales.length} locale dictionaries.`);
