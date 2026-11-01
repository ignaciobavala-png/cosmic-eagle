import { isTestimonialPlacement, TESTIMONIAL_MAX_CHARS } from "@/lib/testimonials";

/**
 * Validacion del formulario de un testimonio. Compartida entre el panel
 * (`testimonios/actions.ts`) y el asistente de IA: las reglas se escriben una vez.
 */

/** Un campo opcional del form: vacío o sólo espacios se guarda como `null`. */
function optional(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseTestimonialForm(formData: FormData) {
  const placement = formData.get("placement");
  const quote = formData.get("quote");
  const authorName = formData.get("author_name");
  const authorLocation = formData.get("author_location");
  const sortOrder = formData.get("sort_order");
  const quoteEn = optional(formData.get("quote_en"));

  if (
    !isTestimonialPlacement(placement) ||
    typeof quote !== "string" ||
    !quote.trim() ||
    typeof authorName !== "string" ||
    !authorName.trim()
  ) {
    return {
      error: "Completa la sección, el testimonio y el nombre.",
      data: null,
    } as const;
  }

  // El tope no es una manía: la tarjeta de "Voces de Luz" es de alto fijo
  // (300×225 del mockup) y un testimonio más largo se cortaba con puntos
  // suspensivos. Se avisa acá, al cargarlo, en vez de dejar que se recorte solo
  // en la home. Está escrito también en el `maxLength` del formulario.
  if (quote.trim().length > TESTIMONIAL_MAX_CHARS) {
    return {
      error: `El testimonio no puede pasar de ${TESTIMONIAL_MAX_CHARS} caracteres (tiene ${quote.trim().length}). Recortalo para que entre en la tarjeta.`,
      data: null,
    } as const;
  }

  if (quoteEn && quoteEn.length > TESTIMONIAL_MAX_CHARS) {
    return {
      error: `El testimonio en inglés no puede pasar de ${TESTIMONIAL_MAX_CHARS} caracteres (tiene ${quoteEn.length}).`,
      data: null,
    } as const;
  }

  const parsedOrder = Number(sortOrder);

  return {
    error: null,
    data: {
      placement,
      quote: quote.trim(),
      author_name: authorName.trim(),
      author_location: optional(authorLocation),
      quote_en: quoteEn,
      author_location_en: optional(formData.get("author_location_en")),
      body: optional(formData.get("body")),
      body_en: optional(formData.get("body_en")),
      // El orden es opcional en el form; sin numero valido va al final.
      sort_order: Number.isFinite(parsedOrder) ? parsedOrder : 0,
      is_published: formData.get("is_published") === "on",
    },
  } as const;
}

