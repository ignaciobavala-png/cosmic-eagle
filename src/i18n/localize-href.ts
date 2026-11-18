import { routing, type InternalPathname } from "./routing";

type Params = Record<string, string | string[]>;

/** Lo que aceptan nuestros `Link`/`redirect`: string de ruta real, o el objeto de next-intl. */
export type HrefInput =
  | string
  | {
      pathname: string;
      params?: Params;
      query?: Record<string, string | string[]>;
      hash?: string;
    };

type Resolved = {
  pathname: InternalPathname;
  params?: Params;
  query?: Record<string, string | string[]>;
  hash?: string;
};

const TEMPLATES = (Object.keys(routing.pathnames) as InternalPathname[]).sort(
  // Las estaticas primero: `/viajes/nuevo` ganaria sobre `/viajes/[id]` si existiera.
  (a, b) => Number(a.includes("[")) - Number(b.includes("["))
);

/** `/viajes/abc` + `/viajes/[id]` → `{ id: "abc" }`; `null` si no calza. */
function match(template: string, path: string): Params | null {
  const t = template.split("/");
  const p = path.split("/");
  if (t.length !== p.length) return null;
  const params: Params = {};
  for (let i = 0; i < t.length; i++) {
    const m = /^\[([^\].]+)\]$/.exec(t[i]);
    if (m) params[m[1]] = decodeURIComponent(p[i]);
    else if (t[i] !== p[i]) return null;
  }
  return params;
}

/**
 * Convierte un href escrito con la ruta REAL (`/viajes/abc?tipo=x#cartelera`)
 * al objeto que next-intl necesita para escribir la URL del idioma. Lo que no
 * es una ruta declarada (`/admin`, `#ancla`, `mailto:`) vuelve igual.
 */
export function localizeHref(href: HrefInput): string | Resolved {
  if (typeof href !== "string") return href as Resolved;
  if (!href.startsWith("/")) return href;

  const hashAt = href.indexOf("#");
  const hash = hashAt >= 0 ? href.slice(hashAt) : undefined;
  const noHash = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const qAt = noHash.indexOf("?");
  const path = qAt >= 0 ? noHash.slice(0, qAt) : noHash;
  const search = qAt >= 0 ? noHash.slice(qAt + 1) : "";

  for (const template of TEMPLATES) {
    const params = match(template, path);
    if (!params) continue;
    const query: Record<string, string | string[]> = {};
    new URLSearchParams(search).forEach((value, key) => {
      const prev = query[key];
      query[key] =
        prev === undefined
          ? value
          : Array.isArray(prev)
            ? [...prev, value]
            : [prev, value];
    });
    const out: Resolved = { pathname: template };
    if (Object.keys(params).length) out.params = params;
    if (search) out.query = query;
    if (hash) out.hash = hash;
    return out;
  }
  return href;
}
