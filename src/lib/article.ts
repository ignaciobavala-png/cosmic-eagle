import type { Enums } from "@/lib/supabase/types";

export type ArticleCategory = Enums<"article_category">;
export type ArticleStatus = Enums<"article_status">;

/**
 * Las tres categorias del hub de contenidos (docs/CONTENT_MAP.md): Biblioteca,
 * Ciencia Almatica y Testimonios. Van como enum en la base y no como texto
 * libre: son la navegacion de /contenidos, no una etiqueta suelta.
 *
 * El `value` del enum es tambien el slug del filtro en la URL
 * (`/contenidos?categoria=ciencia`), asi que no hay tabla de conversion.
 */
export const ARTICLE_CATEGORIES = {
  biblioteca: {
    value: "biblioteca",
    label: "Biblioteca",
    description: "Lecturas, guias y material de integracion.",
  },
  ciencia: {
    value: "ciencia",
    label: "Ciencia Almática",
    description: "La arquitectura energética del ser humano.",
  },
  testimonios: {
    value: "testimonios",
    label: "Testimonios",
    description: "Experiencias de quienes ya viajaron.",
  },
} as const satisfies Record<
  ArticleCategory,
  { value: ArticleCategory; label: string; description: string }
>;

export const ARTICLE_CATEGORY_LIST = [
  ARTICLE_CATEGORIES.biblioteca,
  ARTICLE_CATEGORIES.ciencia,
  ARTICLE_CATEGORIES.testimonios,
] as const;

export function isArticleCategory(value: unknown): value is ArticleCategory {
  return (
    value === "biblioteca" || value === "ciencia" || value === "testimonios"
  );
}

/** Etiqueta para mostrar. Acepta `string` porque las queries no siempre tipan. */
export function articleCategoryLabel(value: string): string {
  return isArticleCategory(value) ? ARTICLE_CATEGORIES[value].label : value;
}

/** Toda portada de articulo se guarda en 16:9, como la de los viajes. */
export const ARTICLE_COVER_ASPECT = 16 / 9;
export const ARTICLE_COVER_MAX_PX = 1600;

/**
 * Titulo -> slug de la URL. Corre en el browser (para sugerirlo mientras se
 * escribe el titulo) y otra vez en el server, que es el que manda: el CHECK de
 * la tabla rechaza cualquier cosa que no salga de aca.
 */
export function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      // Saca los acentos: "Ciencia Almática" -> "ciencia-almatica".
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      // El corte puede dejar un guion colgando al final.
      .replace(/-+$/, "")
  );
}

export type ArticleBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string };

/**
 * El cuerpo se guarda como texto plano y se renderiza con dos reglas, que son
 * las unicas que hay que explicarle a quien escribe:
 *
 * - Linea en blanco = parrafo nuevo.
 * - Linea que arranca con `## ` = subtitulo.
 *
 * A proposito NO es markdown completo: no hay editor rico ni sanitizado de HTML
 * en el proyecto, y aceptar HTML crudo de un formulario seria un XSS almacenado
 * con el sitio publico como destino. Todo sale como texto dentro de <p>/<h2>.
 */
export function parseArticleBody(body: string): ArticleBlock[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) =>
      block.startsWith("## ")
        ? { type: "heading" as const, text: block.slice(3).trim() }
        : // Dentro de un parrafo los saltos simples se colapsan: un Enter suelto
          // en el textarea no deberia partir la frase en el sitio.
          { type: "paragraph" as const, text: block.replace(/\s*\n\s*/g, " ") }
    );
}

/** "12 de agosto de 2026". `null` cuando el articulo todavia no se publico. */
export function formatArticleDate(value: string | null): string | null {
  if (!value) return null;

  return new Date(value).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
