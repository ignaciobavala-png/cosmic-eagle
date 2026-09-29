// Chequea que `messages/es.json` y `messages/en.json` tengan exactamente las
// mismas claves (recursivo). Sin esto, una clave nueva del codigo puede quedar
// sin traducir y next-intl no falla: imprime la clave cruda en pantalla.
//
// Corre a mano o en CI: `pnpm i18n:check`.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Aplana un objeto anidado a rutas de hoja ("Home.hero.title"). */
function leafKeys(value, prefix = "") {
  const keys = [];
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      keys.push(...leafKeys(child, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

const es = JSON.parse(readFileSync(join(root, "messages/es.json"), "utf8"));
const en = JSON.parse(readFileSync(join(root, "messages/en.json"), "utf8"));

const esKeys = new Set(leafKeys(es));
const enKeys = new Set(leafKeys(en));

const missingInEn = [...esKeys].filter((key) => !enKeys.has(key)).sort();
const extraInEn = [...enKeys].filter((key) => !esKeys.has(key)).sort();

if (missingInEn.length || extraInEn.length) {
  if (missingInEn.length) {
    console.error(
      `Faltan en en.json (estan en es.json):\n  ${missingInEn.join("\n  ")}`
    );
  }
  if (extraInEn.length) {
    console.error(
      `Sobran en en.json (no estan en es.json):\n  ${extraInEn.join("\n  ")}`
    );
  }
  process.exit(1);
}

console.log(`i18n:check OK — ${esKeys.size} claves en los dos idiomas.`);
