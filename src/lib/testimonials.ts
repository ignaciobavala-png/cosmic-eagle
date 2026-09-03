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
    where: "Debajo del bloque de Sesiones, en Experiencias.",
  },
  {
    value: "viajes",
    label: "Viajes Cósmicos — “Nuestros Viajeros”",
    where: "Debajo del bloque de Viajes, en Experiencias.",
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
  placement: TestimonialPlacement
): Promise<Testimonial[]> {
  const { data } = await createPublicClient()
    .from("testimonials")
    .select("id, quote, author_name, author_location")
    .eq("placement", placement)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return data ?? [];
}
