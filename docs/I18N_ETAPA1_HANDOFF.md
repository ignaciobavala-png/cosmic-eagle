# Handoff — i18n etapa 1 (infraestructura) — cosmic-eagle

> Informe para retomar el trabajo. Rama **`spike/i18n`**, base `7cc17f1`, HEAD
> `f7b4a55`. **Sin merge, sin push, `main` intacta.** 7 commits.
> Generado el 29/09/2026.

## Objetivo de la etapa

Dejar la infraestructura de i18n lista para mergear **sin cambios visibles para
un visitante de hoy**: el sitio en castellano igual, el botón ES/EN oculto y
`/en` existente pero con `noindex`. **No se tradujo ningún texto** (eso es la
etapa 2). Ver `docs/I18N.md` (§2, §3, §4, §8b).

## Commits (7cc17f1..f7b4a55)

| Commit | Qué |
|---|---|
| `5830ef9` | `feat(i18n): navegación y revalidación de rutas públicas bajo [locale]` — tareas 1 **y 2** juntas (ver "Desvíos") |
| `9c2b0c3` | `fix(nav): la barra de escritorio y los botones de cuenta entran recién desde xl` — tarea 3 |
| `7d64bb5` | `feat(i18n): selector de idioma apagado y /en fuera del índice` — tarea 4 |
| `addd699` | `feat(i18n): formato de fecha y precio según el idioma` — tarea 5 |
| `29b2d89` | `feat(i18n): hreflang y metadataBase en el layout [locale]` — tarea 6 |
| `33a508d` | `test(i18n): pnpm i18n:check falla si es.json y en.json no tienen las mismas claves` — tarea 7 |
| `f7b4a55` | `test(e2e): anclas de /viajes y home al día con el rediseño del 24/09` — tarea 8 |

## Qué se hizo, por tarea

### 1. Revalidación (`revalidatePath`)
Las rutas públicas viven bajo `/[locale]`, así que `revalidatePath("/viajes")` no
invalidaba nada. Nuevo helper `src/i18n/public-path.ts`:

```ts
export function publicPath(path: string): string {
  return path === "/" ? "/[locale]" : `/[locale]${path}`;
}
```

- Cada `revalidatePath` de ruta pública pasó a `revalidatePath(publicPath("/x"), "page" | "layout")`.
  El `type` es obligatorio porque el path tiene un segmento dinámico.
- Home: `publicPath("/")` → `/[locale]`, con `"layout"` donde antes se purgaba todo (cuenta) y `"page"` donde era la home.
- Detalle de artículo/viaje: se usa el patrón (`/[locale]/contenidos/[slug]`, `/[locale]/viajes/[id]`) en vez del slug concreto.
- Helpers: `TRIP_TYPES.*.adminPath` resultó ser ruta de panel (`/admin/...`), no se tocó. `legalDocumentMeta(slug).href` sí es pública y se convierte.
- Panel (`/admin/...`): sin cambios.

### 2. Links y navegación
- `Link`, `usePathname` y `redirect` de las rutas públicas pasaron a
  `@/i18n/navigation` (next-intl): si no, se pierde el `/en` y el estado activo
  del Header no matchea.
- Links a `/admin` siguen con el `Link` de Next (`NextLink`); un `<a>` dispara
  `no-html-link-for-pages` en ESLint.
- `notFound()` sigue viniendo de `next/navigation`.
- **`redirect`**: next-intl exige el locale en el argumento y `getLocale()` es
  async, así que se creó `src/i18n/redirect.ts`:

```ts
export async function redirect(href: string): Promise<never> {
  if (href.startsWith("/admin") || href.startsWith("/auth")) nextRedirect(href);
  return i18nRedirect({ href, locale: await getLocale() });
}
```

  Consecuencia importante: **los call sites usan `return await redirect(...)`**.
  Si se llama sin `await`, el throw queda en una promesa rechazada que nadie
  mira, el action sigue de largo y TypeScript pierde el `never` (los handlers
  empiezan a pedir `return`). Esto es lo que más conviene revisar en runtime.
- `CtaLink` no lo usa el panel (verificado por grep): cambiar a `Link` de
  next-intl fue seguro.

### 3. Navbar 768–1280
En `Header.tsx` el layout pasó de `md` a `xl` (`xl:grid-cols-...`, `hidden
xl:flex`, `hidden xl:inline-flex`, `xl:hidden` en hamburguesa + overlay +
drawer). El logo (`md:h-11`) y el padding (`md:px-margin-desktop`) quedaron como
estaban. El selector de idioma sumó su lugar al pie del drawer.

### 4. Botón oculto y `/en` noindex
- `SHOW_LOCALE_SWITCH = false` en `src/lib/constants.ts`; `Header` envuelve las
  dos instancias de `LocaleSwitch` en ese flag (navbar y pie del drawer).
- `src/app/[locale]/layout.tsx` pasó de `metadata` a `generateMetadata` y para
  `en` devuelve `robots: { index: false, follow: false }`.

### 5. Formato con idioma
`src/lib/format.ts` define `FormatLocale = "es" | "en"` y mapea a `es-CL` /
`en-US`. `formatAmount`, `formatDateRangeCompact` y `formatScheduleDay` reciben
`locale` con default `"es"`. `formatArticleDate` (en `src/lib/article.ts`) igual.
Cableado en las rutas públicas listadas (cuenta, detalle de viaje, solicitar).

### 6. hreflang
En `generateMetadata` del layout `[locale]`: `metadataBase: new URL(SITE_URL)` +
`alternates.languages = { es: "/", en: "/en", "x-default": "/" }`. `SITE_URL`
se agregó a `src/lib/site-url.ts` (sincrónico, sin `headers()`, para no volver
dinámicas las páginas estáticas). **Ojo: ver "Desvíos".**

### 7. Test de paridad
`scripts/check-i18n-parity.mjs` + `"i18n:check"` en `package.json`. Recorre
claves anidadas de `messages/es.json` y `messages/en.json`, sale con código 1 y
lista faltantes/sobrantes.

### 8. e2e viejos
- `e2e/publico.lectura.spec.ts`: anclas `#sesiones`/`#viajes` → `#experiencias`/`#cartelera`.
- `e2e/capturas-sitio.lectura.spec.ts`: la cartelera salió de la home, así que
  el capítulo del "gate de sesión" se movió a `#cartelera` de `/viajes`; se
  sacaron las capturas de `#voces`/`#experiencias` de la home (ya no existen) y
  se actualizaron las de `/viajes`. No se re-agregó ninguna ancla vieja.

## Evidencia ya recogida (build local)

Comandos: `pnpm lint` (0 errores, 11 warnings preexistentes de `<img>`),
`pnpm build`, `pnpm start`.

**Build (`ƒ Proxy (Middleware)` presente):** las rutas que debían seguir `●` lo
siguen: `/[locale]` (home), `/[locale]/calendario`, `/[locale]/faqs`,
`/[locale]/nosotros`, `/[locale]/privacidad`, `/[locale]/terminos`,
`/[locale]/cuenta/recuperar`.

**Runtime (`curl`, server en :3000):**

| Ruta | Resultado |
|---|---|
| `/` | 200 |
| `/viajes` | 200 |
| `/nosotros` | 200 |
| `/en/viajes` | 200 |
| `/es/viajes` | 307 → `/viajes` |
| `/admin` (sin sesión) | 307 → `/cuenta` |
| `/ruta-que-no-existe` | 404 |

**Links (HTML de Header+Footer):**
- `/en/nosotros`: todos los internos empiezan con `/en`.
- `/nosotros`: ninguno con `/es`.

**Selector / indexación:**
- `/` no contiene el selector (`aria-label="Idioma"` ni `ES · EN`).
- `/en` → `<meta name="robots" content="noindex, nofollow"/>`.

**hreflang:** presente en el HTML. React 19 lo emite como `hrefLang="es"` (el
atributo HTML es `hreflang`, case-insensitive; `link[hreflang="en"]` matchea).

**Paridad:** `pnpm i18n:check` → `OK — 2 claves`; borrando `Home.heroAlt` de
`en.json` sale con código 1 listando la faltante.

## Pendiente / no verificado

1. **`E2E_BASE_URL=http://localhost:3000 pnpm e2e:lectura` → 40/40.**
   Se intentó dos veces y quedó abortado por el usuario; **no hay resultado**.
   Requiere el server levantado.
2. **Medición del navbar (tarea 3)** a 768, 1024, 1100, 1280 y 1440: ningún
   elemento visible del `header` con `getBoundingClientRect().right > innerWidth`
   y sin scroll horizontal. Falta el script/registro.
3. **Tarea 9 — sesión (la cierra una persona).** El `proxy.ts` no corría nunca en
   producción; ahora sí y cada request de un usuario logueado hace `getUser()`
   contra Supabase (costo que antes no se pagaba). Probar **login, logout,
   registro y recuperar contraseña** contra este build antes de mergear. Es
   también donde se valida en runtime el `redirect` async del punto 2.

## Desvíos y decisiones (a revisar)

- **Tareas 1 y 2 en un mismo commit.** `src/app/[locale]/cuenta/actions.ts` y
  `.../viajes/[id]/solicitar/actions.ts` mezclan revalidación y redirect en los
  mismos hunks y no se podían separar limpio.
- **hreflang en el layout** (como pedía la tarea) hace que *todas* las páginas
  declaren la home como alterno (`es: "/"`, `en: "/en"`). Correcto en `/`;
  incorrecto para SEO en `/viajes`, `/nosotros`, etc. El hreflang por página
  necesita metadata por página (etapa 2).
- **`formatArticleDate` y demás callers públicos sin cablear.** `ArticleCard`,
  `ContentLibrary`, `LegalPage`, `TripCard` y `ExperienceFilter` llaman con el
  default `es`, así que en `/en` siguen formateando fechas en `es-CL`. Se dejó
  así a propósito ("default `es` para no romper a quien llama sin pasarlo").
- **Título/description del layout** siguen en castellano también para `en` (no
  se traduce en esta etapa).
- **`redirect` async + `return await`**: funciona en typecheck y build, pero su
  comportamiento en un POST real de Server Action no se verificó (ver tarea 9).

## Archivos nuevos

- `src/i18n/public-path.ts`
- `src/i18n/redirect.ts`
- `scripts/check-i18n-parity.mjs`

## Estado del árbol y del entorno

- `git status` solo muestra cambios **ajenos a este trabajo**, sin commitear:
  `AGENTS.md`, `CLAUDE.md`, `docs/BITACORA.md` (modificados) y
  `docs/entregas/2026-09-23-dns-cutover/` (sin seguimiento). No los toqué.
- El server de `pnpm start` puede haber quedado levantado en **:3000**. Para
  bajar: `fuser -k 3000/tcp` (NO `pkill -f "next start"`). El puerto **3001 es
  de otro proyecto**: no matarlo.
- Este archivo (`docs/I18N_ETAPA1_HANDOFF.md`) es un entregable sin commitear.

## Comandos para retomar

```bash
cd /home/nch/Escritorio/things/cosmic-eagle
git log --oneline 7cc17f1..HEAD

fuser -k 3000/tcp 2>/dev/null
pnpm lint && pnpm build && pnpm i18n:check
pnpm start &                                   # o dejarlo en background
E2E_BASE_URL=http://localhost:3000 pnpm e2e:lectura
```
