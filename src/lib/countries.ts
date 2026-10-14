import { PHONE_COUNTRIES } from "./phone-countries";
import { capitalizeName } from "./person-name";

/**
 * El país es texto libre en tres lugares (perfil, filtro corto y formulario de
 * salud), así que "chile", "Chile " y "CHILE" son tres países para el CRM.
 * Esto los lleva a una sola forma: el nombre de `PHONE_COUNTRIES` si coincide
 * (sin mirar mayúsculas ni tildes) y, si no, el texto con mayúscula inicial.
 */
function key(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const BY_KEY = new Map(PHONE_COUNTRIES.map((c) => [key(c.name), c.name]));

export function canonicalCountry(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  return BY_KEY.get(key(value)) ?? capitalizeName(value);
}

export const COUNTRY_NAMES = PHONE_COUNTRIES.map((c) => c.name);
