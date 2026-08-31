import { unstable_cache } from "next/cache";
import { createPublicClient } from "./supabase/public";
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

export type SlotType = "text" | "multiline" | "image" | "boolean";

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
  /**
   * Solo `image`: el slot acepta tambien un video corto de fondo. El valor sigue
   * siendo una sola URL y el renderer decide por la extension (`isVideoUrl`), asi
   * que la clienta puede pasar de foto a video y volver sin que cambie nada mas.
   * Se marca solo en los slots que en el mockup son pantalla completa: un video
   * en una foto chica no aporta y gasta egress.
   */
  video?: true;
};

/**
 * Lectura de un slot `boolean`. El valor guardado es "true" / "false" y el
 * default es SIEMPRE mostrar: un slot sin fila, o con un valor raro escrito a
 * mano en la base, tiene que renderizar la pagina como estaba antes de que el
 * tilde existiera.
 */
export function isEnabled(value: string): boolean {
  return value !== "false";
}

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
        video: true,
      },
      {
        key: "home.frase.left",
        label: "Frase · primera mitad",
        help: "La frase grande que ocupa toda la pantalla debajo de la portada: esta es la primera línea.",
        type: "text",
        fallback: "Somos mucho más",
      },
      {
        key: "home.frase.right",
        label: "Frase · segunda mitad",
        help: "La segunda línea de la misma frase. Se muestra en blanco, debajo de la primera.",
        type: "text",
        fallback: "que nuestra historia",
      },
      // La key es la de "las cuatro promesas", que el rediseño elimina: se reusa
      // para que la imagen que la clienta ya subio siga apareciendo en la
      // pagina nueva, en vez de quedar huerfana. Los cuatro textos de esas
      // promesas SI quedaron sin lugar (ver docs/COPY_HUERFANO.md).
      {
        key: "home.promesas.image",
        label: "Imagen de la frase del medio",
        help: "La foto a pantalla completa con una frase centrada encima, después del calendario.",
        type: "image",
        fallback: IMAGES.homePromesas,
        ratio: "16/9",
        maxPx: 1920,
        video: true,
      },
      {
        key: "home.atmos.text",
        label: "Frase sobre la imagen del medio",
        help: "La frase corta que va centrada sobre esa foto.",
        type: "text",
        fallback:
          "Un campo de conciencia mucho más amplio que la historia que contamos sobre nosotros.",
      },
      {
        key: "home.promesas.overlay",
        label: "Mostrar la frase sobre la imagen del medio",
        help: "Si lo destildas, ese banner queda solo con la imagen, sin texto encima.",
        type: "boolean",
        fallback: "true",
      },
      {
        key: "home.tecnologia.image",
        label: "Imagen de “Tecnología del Alma”",
        help: "La foto vertical que acompaña al texto de Tecnología del Alma, sobre el fondo claro.",
        type: "image",
        fallback: IMAGES.portal2,
        ratio: "4/5",
        maxPx: 1400,
      },
      {
        key: "home.cierre.image",
        label: "Imagen de cierre",
        help: "La foto del final, a pantalla completa, con la frase “Un viaje hacia el Humano Luminoso” encima.",
        type: "image",
        fallback: IMAGES.homeCierre,
        ratio: "16/9",
        maxPx: 1920,
        video: true,
      },
      {
        key: "home.cierre.overlay",
        label: "Mostrar la frase sobre la imagen de cierre",
        help: "Si lo destildas, la pantalla final queda solo con la imagen, sin la frase encima.",
        type: "boolean",
        fallback: "true",
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
        video: true,
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
        key: "nosotros.hero.overlay",
        label: "Mostrar el título sobre la portada",
        help: "Si lo destildas, el banner de Nosotros queda solo con la imagen: no se ven ni el título ni la bajada.",
        type: "boolean",
        fallback: "true",
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
        video: true,
      },
      {
        key: "nosotros.proposito.overlay",
        label: "Mostrar la frase sobre esa imagen",
        help: "Si lo destildas, ese banner queda solo con la imagen, sin la frase encima.",
        type: "boolean",
        fallback: "true",
      },
      {
        key: "nosotros.metodologia.image",
        label: "Imagen de cierre",
        help: "El fondo de la última pantalla, la del título “Un viaje hacia el Humano Luminoso”. Se ve tenue detrás del texto.",
        type: "image",
        fallback: IMAGES.nosotrosMetodologia,
        ratio: "16/9",
        maxPx: 1920,
        video: true,
      },
      {
        key: "nosotros.metodologia.overlay",
        label: "Mostrar el título y los botones del cierre",
        help: "Si lo destildas, la última pantalla queda solo con la imagen, sin el título ni los botones.",
        type: "boolean",
        fallback: "true",
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
        help: "El banner grande de arriba de todo, con el título “Portales de Transformación”. Ocupa la pantalla entera.",
        type: "image",
        fallback: IMAGES.heroViajes,
        ratio: "16/9",
        maxPx: 1920,
        video: true,
      },
      {
        key: "viajes.hero.overlay",
        label: "Mostrar el título sobre la portada",
        help: "Si lo destildas, el banner de arriba queda solo con la imagen, sin el título encima.",
        type: "boolean",
        fallback: "true",
      },
      {
        key: "viajes.about.image",
        label: "Imagen del texto de presentación",
        help: "La foto que va detrás de los tres párrafos que explican qué son las experiencias. Se ve bastante oscurecida para que el texto se lea.",
        type: "image",
        fallback: IMAGES.portal1,
        ratio: "16/9",
        maxPx: 1920,
        video: true,
      },
      {
        key: "viajes.about.overlay",
        label: "Mostrar el texto de presentación",
        help: "Si lo destildas, ese banner queda solo con la imagen y los tres párrafos no se muestran.",
        type: "boolean",
        fallback: "true",
      },
      {
        key: "viajes.banner.image",
        label: "Imagen de la frase del medio",
        help: "La foto a pantalla completa que separa las Sesiones de los Viajes, con la frase centrada encima.",
        type: "image",
        fallback: IMAGES.almas,
        ratio: "16/9",
        maxPx: 1920,
        video: true,
      },
      {
        key: "viajes.banner.overlay",
        label: "Mostrar la frase sobre la imagen del medio",
        help: "Si lo destildas, ese banner queda solo con la imagen, sin la frase encima.",
        type: "boolean",
        fallback: "true",
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
      {
        key: "contenidos.hero.overlay",
        label: "Mostrar el título sobre la portada",
        help: "Si lo destildas, el banner de Contenidos queda solo con la imagen: no se ven ni el título ni la bajada.",
        type: "boolean",
        fallback: "true",
      },
    ],
  },
  {
    id: "cuenta",
    title: "Acceso",
    href: "/cuenta",
    slots: [
      {
        key: "cuenta.acceso.image",
        label: "Imagen de la pantalla de acceso",
        help: "La foto vertical que acompaña al formulario de ingreso y de registro. Es la misma en las dos pantallas. En el celular no se muestra: ahí queda solo el formulario.",
        type: "image",
        fallback: IMAGES.cuentaAcceso,
        // Vertical: en el diseño es una tarjeta alta al costado del formulario,
        // no un banner. El recorte del panel tiene que mostrarla así o la
        // clienta sube una apaisada y se recorta a la mitad.
        ratio: "9/16",
        maxPx: 1600,
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
 * Una sola lectura de todos los overrides por request, cacheada hasta que el
 * panel guarda (revalidateTag). Sin esto cada seccion consultaria la base.
 */
const readOverrides = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const { data, error } = await createPublicClient()
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
