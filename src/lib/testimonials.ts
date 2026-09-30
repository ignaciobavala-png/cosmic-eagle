import { createPublicClient } from "./supabase/public";
import type { Database } from "./supabase/types";

/**
 * Tope de largo del testimonio. Sale del diseño: la tarjeta del carrusel de la
 * home tiene alto fijo y un texto más largo se recorta (corrección del 03/09 de
 * Julia). Lo comparten el formulario del panel y su server action.
 */
export const TESTIMONIAL_MAX_CHARS = 250;

export type TestimonialPlacement =
  Database["public"]["Enums"]["testimonial_placement"];

export type Testimonial = {
  id: string;
  quote: string;
  author_name: string;
  author_location: string | null;
  /** El relato completo, si lo hay: se abre con "Leer testimonio completo". */
  body: string | null;
  /**
   * El idioma en que viene el texto. Es `es` en `/en` cuando falta la
   * traducción: el bloque lleva `lang="es"` para los lectores de pantalla.
   */
  lang: "es" | "en";
};

/**
 * Las tres secciones de testimonios del rediseño, confirmadas por Julia el
 * 27/08: son tres juegos de textos DISTINTOS, no el mismo repetido.
 *
 * El `label` es lo que lee la clienta en el panel; `where` le dice en qué parte
 * del sitio va a caer lo que cargue.
 */
export const TESTIMONIAL_PLACEMENTS = [
  {
    value: "home",
    label: "Inicio — “Voces de Luz”",
    where: "La sección de testimonios de la página de inicio.",
  },
  {
    value: "sesiones",
    label: "Sesiones Cósmicas — “Nuestros Sanadores”",
    where: "La banda de testimonios de Experiencias, debajo de la cartelera.",
  },
  {
    value: "viajes",
    label: "Viajes Cósmicos — “Nuestros Viajeros”",
    where: "Hoy no se muestra en el sitio: Experiencias usa la de Sanadores.",
  },
] as const satisfies readonly {
  value: TestimonialPlacement;
  label: string;
  where: string;
}[];

export function isTestimonialPlacement(
  value: unknown
): value is TestimonialPlacement {
  return TESTIMONIAL_PLACEMENTS.some((p) => p.value === value);
}

export function testimonialPlacementLabel(value: TestimonialPlacement) {
  return TESTIMONIAL_PLACEMENTS.find((p) => p.value === value)!.label;
}

/**
 * Testimonios publicados de una sección, en el orden que fijó la clienta.
 *
 * Lee con el cliente **sin cookies** a proposito: son datos publicos y asi la
 * home puede seguir siendo estatica con ISR (ver src/lib/supabase/public.ts).
 *
 * Los despublicados no llegan: los filtra la policy, no esta funcion.
 */
export async function getTestimonials(
  placement: TestimonialPlacement,
  locale: string
): Promise<Testimonial[]> {
  const { data } = await createPublicClient()
    .from("testimonials")
    .select(
      "id, quote, quote_en, author_name, author_location, author_location_en, body, body_en"
    )
    .eq("placement", placement)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  // En inglés se usa la traducción sólo si está la cita: cita en inglés con
  // relato en castellano sería un testimonio en dos idiomas. Sin cita en
  // inglés, cae entero al castellano (docs/I18N.md §6).
  return (data ?? []).map((t) => {
    const en = locale === "en" && !!t.quote_en?.trim();
    return {
      id: t.id,
      author_name: t.author_name,
      quote: en ? t.quote_en! : t.quote,
      author_location: en ? (t.author_location_en ?? t.author_location) : t.author_location,
      body: en ? (t.body_en ?? null) : t.body,
      lang: en ? "en" : "es",
    };
  });
}
