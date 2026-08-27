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
        help: "El banner grande que ocupa toda la pantalla al entrar. Se acerca despacio sola. Apaisada, cuanto más ancha mejor, y con la figura hacia el centro: los bordes se recortan.",
        type: "image",
        fallback: IMAGES.homeHero,
        ratio: "16/9",
        maxPx: 1920,
      },
      {
        key: "home.frase.left",
        label: "Frase · primera mitad",
        help: "La frase suelta debajo de la portada se parte en dos: esta mitad entra desde abajo. Va con la coma al final.",
        type: "text",
        fallback: "Cuando el alma está lista,",
      },
      {
        key: "home.frase.right",
        label: "Frase · segunda mitad",
        help: "La otra mitad de la misma frase; entra desde arriba. Las dos terminan juntas en el centro.",
        type: "text",
        fallback: "el camino aparece.",
      },
      {
        key: "home.promesas.image",
        label: "Imagen de las cuatro frases",
        help: "El fondo de la figura en meditación. Las cuatro frases se acomodan alrededor, así que conviene que la figura quede centrada y con aire a los costados.",
        type: "image",
        fallback: IMAGES.homePromesas,
        ratio: "16/9",
        maxPx: 1920,
      },
      {
        key: "home.promesas.1",
        label: "Frase 1 (arriba a la izquierda)",
        help: "Primera de las cuatro frases sobre la imagen.",
        type: "text",
        fallback: "Despierta nuevas capacidades internas",
      },
      {
        key: "home.promesas.2",
        label: "Frase 2 (arriba a la derecha)",
        help: "Segunda de las cuatro frases sobre la imagen.",
        type: "text",
        fallback: "Expande tu camino personal",
      },
      {
        key: "home.promesas.3",
        label: "Frase 3 (abajo a la izquierda)",
        help: "Tercera de las cuatro frases sobre la imagen.",
        type: "text",
        fallback: "Desbloquea tu conexión con lo divino",
      },
      {
        key: "home.promesas.4",
        label: "Frase 4 (abajo a la derecha)",
        help: "Cuarta de las cuatro frases sobre la imagen.",
        type: "text",
        fallback: "Contribuye a la evolución colectiva",
      },
      {
        key: "home.cierre.image",
        label: "Imagen de cierre",
        help: "La foto ancha del final, justo antes de la franja dorada y el pie de página. Se recorta muy apaisada.",
        type: "image",
        fallback: IMAGES.homeCierre,
        ratio: "21/9",
        maxPx: 1920,
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
        key: "nosotros.frase",
        label: "Frase sobre la imagen",
        help: "La frase corta que aparece sola, centrada sobre la foto a pantalla completa.",
        type: "text",
        fallback:
          "El viaje comienza cuando dejamos de buscar afuera lo que siempre estuvo adentro.",
      },
      // Las dos keys de abajo son las de los bloques "Evolución Consciente" y
      // "Metodología", que el rediseño de Julia elimina. Se REUSAN a proposito,
      // con la misma key y otra etiqueta: asi la foto que la clienta ya subio
      // desde el panel sigue apareciendo en la pagina nueva. Renombrarlas
      // dejaria las filas huerfanas y la pagina con los assets del repo.
      {
        key: "nosotros.proposito.image",
        label: "Imagen de la frase central",
        help: "La foto a pantalla completa que va detrás de la frase. Se ve oscurecida, así que conviene una imagen atmosférica y no un retrato.",
        type: "image",
        fallback: IMAGES.nosotrosProposito,
        ratio: "16/9",
        maxPx: 1920,
      },
      {
        key: "nosotros.metodologia.image",
        label: "Imagen de cierre",
        help: "El fondo de la última pantalla, la del título “Un viaje hacia el Humano Luminoso”. Se ve tenue detrás del texto.",
        type: "image",
        fallback: IMAGES.nosotrosMetodologia,
        ratio: "16/9",
        maxPx: 1920,
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
  {
    id: "contenidos",
    title: "Contenidos",
    href: "/contenidos",
    slots: [
      {
        key: "contenidos.hero.image",
        label: "Imagen de portada",
        help: "Banner de arriba de la biblioteca de contenidos.",
        type: "image",
        fallback: IMAGES.almas,
        ratio: "16/9",
        maxPx: 1920,
      },
      {
        key: "contenidos.hero.title",
        label: "Título de portada",
        help: "El texto grande sobre el banner de Contenidos.",
        type: "text",
        fallback: "Contenidos",
      },
      {
        key: "contenidos.hero.subtitle",
        label: "Bajada de portada",
        help: "La frase corta debajo del título de Contenidos.",
        type: "text",
        fallback:
          "Lecturas, ciencia almática y testimonios para acompañar el camino.",
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
