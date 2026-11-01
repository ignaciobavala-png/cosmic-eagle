import { isArticleCategory, slugify } from "@/lib/article";
import type { ArticleStatus } from "@/lib/article";
import { isContentAccessLevel } from "@/lib/content-access";
import { optionalEnglish } from "@/components/admin/EnglishFields";
import { readHtmlFile } from "@/lib/html-upload";

/**
 * Validacion del formulario de un contenido. Compartida entre el panel
 * (`contenidos/actions.ts`) y el asistente de IA, para que las reglas no diverjan.
 */
export const ARTICLE_BUCKET = "site-assets";
export const ARTICLE_PUBLIC_PREFIX = `/storage/v1/object/public/${ARTICLE_BUCKET}/`;

function isStatus(value: unknown): value is ArticleStatus {
  return value === "draft" || value === "published";
}

export async function parseArticleForm(formData: FormData) {
  const title = formData.get("title");
  const body = formData.get("body");
  const excerpt = formData.get("excerpt");
  const category = formData.get("category");
  const status = formData.get("status");
  const accessLevel = formData.get("access_level");
  const slugField = formData.get("slug");
  const audioField = formData.get("audio_url");
  // Un contenido es texto (con las cinco reglas) o un HTML subido: en ese caso
  // el cuerpo es el archivo y se dibuja en un iframe aislado (`HtmlFrame`).
  const isHtml = formData.get("body_format") === "html";

  const upload = isHtml ? await readHtmlFile(formData.get("html_file")) : null;
  if (upload?.error) return { error: upload.error, data: null } as const;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    (!isHtml && (typeof body !== "string" || !body.trim())) ||
    !isArticleCategory(category) ||
    !isStatus(status) ||
    !isContentAccessLevel(accessLevel)
  ) {
    return { error: "Completa el título y el texto.", data: null } as const;
  }

  // El slug llega sugerido del form, pero se normaliza igual: es la URL publica
  // y el CHECK de la tabla rechaza cualquier cosa fuera de [a-z0-9-].
  const slug =
    slugify(typeof slugField === "string" && slugField.trim() ? slugField : title) ||
    // Un titulo entero en otro alfabeto puede no dejar ningun caracter valido.
    `contenido-${Date.now()}`;

  return {
    error: null,
    data: {
      slug,
      title: title.trim(),
      body_format: isHtml ? "html" : "text",
      // `undefined` = HTML sin archivo nuevo: al editar se conserva el actual.
      body: isHtml ? upload?.html : (body as string).trim(),
      excerpt:
        typeof excerpt === "string" && excerpt.trim() ? excerpt.trim() : null,
      category,
      status,
      access_level: accessLevel,
      audio_url: ownAudioUrl(audioField),
      title_en: optionalEnglish(formData, "title_en"),
      excerpt_en: optionalEnglish(formData, "excerpt_en"),
      // Un HTML subido no tiene version en ingles: es un unico archivo.
      body_en: isHtml ? null : optionalEnglish(formData, "body_en"),
    },
  } as const;
}

/**
 * El audio lo sube el browser (`AudioField`) y acá sólo llega la URL. Se acepta
 * únicamente una de nuestro bucket: el campo es oculto pero viaja en el form, y
 * no tiene que poder apuntar el reproductor a cualquier lado.
 */
function ownAudioUrl(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const url = value.trim();
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base && url.startsWith(`${base}${ARTICLE_PUBLIC_PREFIX}articles/audio/`)
    ? url
    : null;
}

