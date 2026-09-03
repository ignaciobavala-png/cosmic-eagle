import type { Enums } from "@/lib/supabase/types";

export type ArticleCategory = Enums<"article_category">;
export type ArticleStatus = Enums<"article_status">;

/**
 * Las cinco categorias de la biblioteca, tal como las nombra Sofia en
 * `Biblioteca-Contenidos-Estructura.pdf` (ver docs/BIBLIOTECA.md §1.1).
 * Reemplazaron a las tres que salian de docs/CONTENT_MAP.md.
 *
 * Van como enum en la base y no como texto libre: son la navegacion de
 * /contenidos, no una etiqueta suelta. El `value` es tambien el slug del filtro
 * en la URL (`/contenidos?categoria=salud`), asi que no hay tabla de conversion.
 *
 * **El orden importa**: es el orden vertical de los rieles en la biblioteca, y
 * es el que ella numero en el documento.
 */
export const ARTICLE_CATEGORIES = {
  preparacion: {
    value: "preparacion",
    label: "Preparación e Integración",
    description: "Cómo llegar al viaje y cómo asentar lo que se abrió.",
  },
  salud: {
    value: "salud",
    label: "Salud y Bienestar",
    description: "El cuidado del cuerpo, la medicina y sus resguardos.",
  },
  evolucion: {
    value: "evolucion",
    label: "Evolución y Conciencia",
    description: "El proceso evolutivo y la expansión de la conciencia.",
  },
  tecnologia: {
    value: "tecnologia",
    label: "Tecnología Humana",
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
  ARTICLE_CATEGORIES.preparacion,
  ARTICLE_CATEGORIES.salud,
  ARTICLE_CATEGORIES.evolucion,
  ARTICLE_CATEGORIES.tecnologia,
  ARTICLE_CATEGORIES.testimonios,
] as const;

export function isArticleCategory(value: unknown): value is ArticleCategory {
  return ARTICLE_CATEGORY_LIST.some((c) => c.value === value);
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
      // Saca los acentos: "Integración Cósmica" -> "integracion-cosmica".
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      // El corte puede dejar un guion colgando al final.
      .replace(/-+$/, "")
  );
}

/** Un item de lista: `- **Titulo.** resto` deja el titulo en `lead`. */
export type ArticleListItem = { lead: string | null; text: string };

export type ArticleBlock =
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: ArticleListItem[] };

/**
 * El cuerpo se guarda como texto plano y se renderiza con cinco reglas, que son
 * las unicas que hay que explicarle a quien escribe:
 *
 * - Linea en blanco = bloque nuevo.
 * - Linea que arranca con `## ` = subtitulo, y con `### ` = subtitulo chico.
 * - Bloque cuyas lineas arrancan con `- ` = lista.
 * - Bloque cuyas lineas arrancan con `> ` = cita destacada.
 * - Dentro de un item de lista, `**Titulo.**` al principio se separa como
 *   entradilla en negrita. Es la unica marca *dentro* de una linea, y existe
 *   porque los textos de la clienta son listas de "Concepto + explicacion"
 *   ("Detenerse. Dedica tiempo al silencio...").
 *
 * A proposito NO es markdown completo: no hay editor rico ni sanitizado de HTML
 * en el proyecto, y aceptar HTML crudo de un formulario seria un XSS almacenado
 * con el sitio publico como destino. **Todo sale como texto** dentro de
 * <p>/<h2>/<h3>/<li>/<blockquote>: las reglas de arriba eligen la etiqueta, no
 * inyectan marcado.
 */
export function parseArticleBody(body: string): ArticleBlock[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block): ArticleBlock => {
      if (block.startsWith("### ")) {
        return { type: "subheading", text: block.slice(4).trim() };
      }

      if (block.startsWith("## ")) {
        return { type: "heading", text: block.slice(3).trim() };
      }

      const lines = block.split("\n").map((line) => line.trim());

      // Basta con que la primera linea abra la lista o la cita: las siguientes
      // sin marca son la continuacion del mismo item o parrafo.
      if (lines[0].startsWith("- ")) {
        return { type: "list", items: parseListItems(lines) };
      }

      if (lines[0].startsWith("> ")) {
        return {
          type: "quote",
          text: joinLines(lines.map((line) => line.replace(/^>\s?/, ""))),
        };
      }

      // Dentro de un parrafo los saltos simples se colapsan: un Enter suelto en
      // el textarea no deberia partir la frase en el sitio.
      return { type: "paragraph", text: joinLines(lines) };
    });
}

function joinLines(lines: string[]): string {
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

function parseListItems(lines: string[]): ArticleListItem[] {
  const items: string[] = [];

  for (const line of lines) {
    if (line.startsWith("- ")) {
      items.push(line.slice(2).trim());
    } else if (items.length > 0) {
      // Item partido en varias lineas del textarea.
      items[items.length - 1] += ` ${line}`;
    }
  }

  return items.map((raw) => {
    const text = raw.replace(/\s+/g, " ").trim();
    const lead = /^\*\*(.+?)\*\*\s*/.exec(text);

    return lead
      ? { lead: lead[1].trim(), text: text.slice(lead[0].length).trim() }
      : { lead: null, text };
  });
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
