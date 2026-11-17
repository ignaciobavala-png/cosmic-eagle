/**
 * LA lista de rutas que exigen cuenta. Es el único lugar que hay que tocar
 * cuando se agrega, quita o renombra una ruta de miembros.
 *
 * Regla (corrección 1 / 7.1 del documento de correcciones):
 * - Abiertas a cualquiera: Inicio, Nosotros, FAQs, Términos, Privacidad.
 * - Requieren sesión: Experiencias (`/viajes` y `/viajes/[id]/...`), Calendario
 *   (hoy redirige a `/viajes`), Contenidos (`/contenidos` y `/contenidos/[slug]`).
 *   Mi Cuenta es la propia pantalla de acceso: no se protege.
 *
 * Lo aplica `src/proxy.ts` EN EL SERVIDOR, antes de renderizar o servir del
 * caché: sin sesión el visitante recibe un 307 a `/cuenta?next=...` y el HTML
 * de la ruta ni se toca. Por eso las páginas pueden seguir siendo estáticas
 * (ISR): el proxy corre delante del CDN. El nivel de cada artículo
 * (publico < miembros < programa) lo sigue decidiendo la RLS.
 *
 * Renombres de URL en inglés (`/en/nosotros` → `/en/about-us`, etc.): el proxy
 * comprueba DOS cosas, el path que escribió el visitante (sin el prefijo de
 * idioma) y el path interno al que next-intl reescribe (siempre el nombre de la
 * carpeta bajo `src/app/[locale]/`). Mientras las carpetas se llamen igual, un
 * alias nuevo queda protegido solo; si además se quiere cubrir el alias
 * explícitamente, se agrega a `PROTECTED_PREFIXES`.
 */
export const PROTECTED_PREFIXES: readonly string[] = [
  // nombres internos (carpetas de src/app/[locale])
  "/viajes",
  "/contenidos",
  "/calendario",
  // alias públicos por idioma: agregar acá los que defina el renombre de /en
];

/** Pantalla de acceso, sin prefijo de idioma (el proxy lo agrega). */
export const ACCOUNT_PATH = "/cuenta";

const LOCALES = ["es", "en"] as const;

/** Saca el prefijo de idioma: `/en/viajes/x` → `/viajes/x`. */
export function stripLocale(pathname: string): string {
  for (const l of LOCALES) {
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname;
}

export function isProtectedPath(pathname: string): boolean {
  const p = stripLocale(pathname);
  return PROTECTED_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`)
  );
}
