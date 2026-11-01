/**
 * Busqueda de nombres tolerante, para el asistente.
 *
 * Por que no `ilike`: "Sofia" no encuentra "Sofía", y una transcripcion de voz
 * escribe "Maria Jose" donde la base dice "María José" (o "Estela" como
 * "Estella"). Se normaliza (sin acentos, sin mayusculas, sin signos) y se tolera
 * un error de tipeo en palabras largas.
 *
 * Se compara en memoria sobre una lista corta de nombres (`id, full_name`): la
 * organizacion maneja cientos de personas, no millones. Si esto crece, el paso
 * siguiente es `unaccent` + `pg_trgm` en la base.
 */

/** minusculas, sin acentos ni signos, espacios colapsados. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Distancia de edicion, cortada en `max + 1` (no hace falta el valor exacto). */
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      best = Math.min(best, row[j]);
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

/** Errores de tipeo que se toleran segun el largo de la palabra buscada. */
function tolerance(word: string): number {
  if (word.length >= 8) return 2;
  if (word.length >= 4) return 1;
  return 0;
}

/**
 * Puntaje de una palabra buscada contra las palabras del candidato:
 * 0 = no aparece, 3 = igual, 2 = empieza igual, 1 = parecida (un error de tipeo).
 */
function wordScore(word: string, candidateWords: string[]): number {
  let best = 0;
  for (const c of candidateWords) {
    if (c === word) return 3;
    if (c.startsWith(word) || (word.length >= 4 && word.startsWith(c) && c.length >= 4)) best = Math.max(best, 2);
    else if (tolerance(word) > 0 && distance(word, c, tolerance(word)) <= tolerance(word)) best = Math.max(best, 1);
  }
  return best;
}

/**
 * Los candidatos que coinciden con lo buscado, mejores primero. TODAS las
 * palabras buscadas tienen que aparecer ("maria perez" no trae a cualquier
 * "Perez"), en cualquier orden.
 */
export function matchNames<T>(query: string, items: T[], getName: (item: T) => string | null): T[] {
  const words = normalize(query).split(" ").filter(Boolean);
  if (!words.length) return [];

  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    const name = getName(item);
    if (!name) continue;
    const candidateWords = normalize(name).split(" ").filter(Boolean);
    let total = 0;
    let ok = true;
    for (const w of words) {
      const s = wordScore(w, candidateWords);
      if (!s) {
        ok = false;
        break;
      }
      total += s;
    }
    if (ok) scored.push({ item, score: total });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
}

/** Busqueda de texto simple (titulos, paises): sin acentos y por contenido. */
export function includesLoose(haystack: string, needle: string): boolean {
  const n = normalize(needle);
  return !n || normalize(haystack).includes(n);
}
