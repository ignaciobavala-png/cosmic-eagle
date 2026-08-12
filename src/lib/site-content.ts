import { createServerClient } from "@supabase/ssr";
import { unstable_cache } from "next/cache";
import type { Database } from "./supabase/types";
import { IMAGES } from "./constants";

/**
 * Registro de slots editables desde /admin/multimedia.
 *
 * El codigo es la fuente de verdad de QUE slots existen y cual es su valor por
 * defecto; la tabla `site_content` solo guarda los overrides. Consecuencias:
 *
 * - Seccion nueva: se agregan las entradas aca y el panel las lista solo, sin
 *   migracion ni tocar la UI del admin.
 * - Slot renombrado o borrado: la fila vieja queda huerfana y se ignora.
 * - Base caida o cache frio: renderiza el `fallback` del repo, nunca vacio.
 *
 * Ojo al cambiar un `fallback` de un slot que ya tiene override cargado: el
 * override sigue ganando y el cambio no se ve. Por eso el panel marca cuales
 * estan editados y ofrece "volver al original".
 *
 * Los `label` y `help` los leen Estela y Sofia: van en castellano y dicen donde
 * cae la cosa, no como se llama la variable.
 */

export type SlotType = "text" | "multiline" | "image";

export type Slot = {
  key: string;
  label: string;
  help: string;
  type: SlotType;
  fallback: string;
  /** Solo imagenes: proporcion del recorte, para la preview del panel. */
  ratio?: string;
  /** Solo imagenes: lado mayor al que se redimensiona antes de subir. */
  maxPx?: number;
};

export type SlotGroup = {
  id: string;
  title: string;
  /** Ruta publica donde se ve el grupo, para el link "Ver en el sitio". */
  href: string;
  slots: readonly Slot[];
};

export const SITE_CONTENT_TAG = "site-content";

export const SITE_GROUPS = [
  {
    id: "home",
    title: "Inicio",
    href: "/",
    slots: [
      {
        key: "home.hero.image",
        label: "Imagen de portada",
        help: "El banner grande que ocupa toda la pantalla al entrar. Apaisada, cuanto más ancha mejor.",
        type: "image",
        fallback: IMAGES.heroHome,
        ratio: "16/9",
        maxPx: 1920,
      },
      {
        key: "home.hero.title",
        label: "Título de portada",
        help: "El texto grande sobre el banner. Si apretás Enter, en pantallas grandes el título se parte en dos líneas ahí.",
        type: "multiline",
        fallback: "Sabiduría Cósmica para la\nEvolución Humana",
      },
      {
        key: "home.hero.subtitle",
        label: "Bajada de portada",
        help: "La frase corta debajo del título.",
        type: "text",
        fallback:
          "Experiencias privadas de transformación y retiros en entornos exclusivos.",
      },
      {
        key: "home.portales.title",
        label: "Portales · título",
        help: "Encabezado del carrusel de tres óvalos.",
        type: "text",
        fallback: "Portales de transformación",
      },
      {
        key: "home.portales.subtitle",
        label: "Portales · bajada",
        help: "La línea debajo del encabezado del carrusel.",
        type: "text",
        fallback: "para quienes buscan recordar su verdadero origen.",
      },
      {
        key: "home.portales.image1",
        label: "Portal 1 (izquierda)",
        help: "Primer óvalo del carrusel. Se recorta vertical.",
        type: "image",
        fallback: IMAGES.portal1,
        ratio: "3/4",
        maxPx: 1200,
      },
      {
        key: "home.portales.image2",
        label: "Portal 2 (centro)",
        help: "Óvalo del medio, el que aparece activo al cargar la página.",
        type: "image",
        fallback: IMAGES.portal2,
        ratio: "3/4",
        maxPx: 1200,
      },
      {
        key: "home.portales.image3",
        label: "Portal 3 (derecha)",
        help: "Tercer óvalo del carrusel.",
        type: "image",
        fallback: IMAGES.portal3,
        ratio: "3/4",
        maxPx: 1200,
      },
    ],
  },
  {
    id: "nosotros",
    title: "Nosotros",
    href: "/nosotros",
    slots: [
      {
        key: "nosotros.hero.image",
        label: "Imagen de portada",
        help: "Banner de arriba de todo en Nosotros.",
        type: "image",
        fallback: IMAGES.almas,
        ratio: "16/9",
        maxPx: 1920,
      },
      {
        key: "nosotros.hero.title",
        label: "Título de portada",
        help: "El texto grande sobre el banner de Nosotros.",
        type: "multiline",
        fallback: "Un espacio de luz y amor.",
      },
      {
        key: "nosotros.hero.subtitle",
        label: "Bajada de portada",
        help: "La frase corta debajo del título.",
        type: "text",
        fallback: "+10 años acompañando transformaciones",
      },
      {
        key: "nosotros.proposito.image",
        label: "Imagen de “Evolución Consciente”",
        help: "La foto ovalada que acompaña al primer bloque de texto.",
        type: "image",
        fallback: IMAGES.nosotrosProposito,
        ratio: "3/4",
        maxPx: 1400,
      },
      {
        key: "nosotros.metodologia.image",
        label: "Imagen de la metodología",
        help: "La foto del segundo bloque, el que habla de cómo se trabaja.",
        type: "image",
        fallback: IMAGES.nosotrosMetodologia,
        ratio: "4/3",
        maxPx: 1400,
      },
    ],
  },
  {
    id: "viajes",
    title: "Viajes",
    href: "/viajes",
    slots: [
      {
        key: "viajes.hero.image",
        label: "Imagen de portada",
        help: "Banner de arriba del listado de retiros y ceremonias.",
        type: "image",
        fallback: IMAGES.heroViajes,
        ratio: "16/9",
        maxPx: 1920,
      },
    ],
  },
] as const satisfies readonly SlotGroup[];

export type SlotKey = (typeof SITE_GROUPS)[number]["slots"][number]["key"];

// El cast aplana la union de tuplas que infiere `as const`: sin el, `flatMap`
// intenta unificar cada grupo con el primero y falla por las keys literales.
export const SITE_SLOTS: readonly Slot[] = SITE_GROUPS.flatMap(
  (group) => group.slots as readonly Slot[]
);

const FALLBACKS = new Map(SITE_SLOTS.map((slot) => [slot.key, slot.fallback]));

export function isSlotKey(value: unknown): value is SlotKey {
  return typeof value === "string" && FALLBACKS.has(value);
}

/**
 * Cliente sin cookies a proposito: `unstable_cache` no admite leer `cookies()`
 * dentro del scope cacheado, y este contenido es publico (lo lee `anon` por
 * RLS), asi que no necesita la sesion del visitante.
 */
function publicClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

/**
 * Una sola lectura de todos los overrides por request, cacheada hasta que el
 * panel guarda (revalidateTag). Sin esto cada seccion consultaria la base.
 */
const readOverrides = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const { data, error } = await publicClient()
      .from("site_content")
      .select("key, value");

    // Si la lectura falla el sitio sigue con los valores del repo.
    if (error || !data) return {};

    return Object.fromEntries(data.map((row) => [row.key, row.value]));
  },
  ["site-content"],
  { tags: [SITE_CONTENT_TAG] }
);

export type SiteContent = (key: SlotKey) => string;

/**
 * Devuelve el lector de contenido: `content("home.hero.title")` da el override
 * si existe y el valor del repo si no.
 */
export async function getSiteContent(): Promise<SiteContent> {
  const overrides = await readOverrides();

  return (key) => overrides[key] ?? FALLBACKS.get(key) ?? "";
}

/** Igual que `getSiteContent` pero expone tambien que slots estan editados. */
export async function getSiteOverrides(): Promise<Record<string, string>> {
  return readOverrides();
}
