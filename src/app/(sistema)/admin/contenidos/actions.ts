"use server";

import { revalidatePath } from "next/cache";
import { publicPath } from "@/i18n/public-path";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isArticleCategory, slugify } from "@/lib/article";
import { isContentAccessLevel } from "@/lib/content-access";
import type { ArticleStatus } from "@/lib/article";
import { optionalEnglish } from "@/components/admin/EnglishFields";
import { readHtmlFile } from "@/lib/html-upload";

export type ArticleFormState = { error: string | null };

/**
 * Las portadas de articulo viven en `site-assets`, el mismo bucket de
 * Multimedia (escritura solo admin), bajo el prefijo `articles/`. Un bucket
 * nuevo seria un juego de policies mas para auditar sin ganar nada.
 */
const BUCKET = "site-assets";
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function isStatus(value: unknown): value is ArticleStatus {
  return value === "draft" || value === "published";
}

/**
 * El listado publico, el detalle y el panel muestran lo mismo. El detalle va
 * con el patron `[slug]` y no con el slug concreto: invalida todos los
 * articulos, que es barato (son ISR) y ademas cubre la URL vieja cuando la
 * clienta cambia la direccion.
 */
function revalidateArticlePaths() {
  revalidatePath(publicPath("/contenidos"), "page");
  revalidatePath(publicPath("/contenidos/[slug]"), "page");
  revalidatePath("/admin/contenidos");
}

async function parseArticleForm(formData: FormData) {
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
  return base && url.startsWith(`${base}${PUBLIC_PREFIX}articles/audio/`)
    ? url
    : null;
}

/** Borra un archivo de nuestro bucket a partir de su URL pública. */
async function removeOwnFile(supabase: SupabaseClient, url: string | null | undefined) {
  if (!url?.includes(PUBLIC_PREFIX)) return;
  const path = url.split(PUBLIC_PREFIX)[1]?.split("?")[0];
  if (path) await supabase.storage.from(BUCKET).remove([decodeURIComponent(path)]);
}

/** El slug es unico: el mensaje crudo de Postgres no le dice nada a la clienta. */
function friendlyError(message: string, action: "crear" | "guardar") {
  if (message.includes("articles_slug_key")) {
    return "Ya hay un contenido con esa dirección. Cambia el título o la dirección.";
  }
  return `No se pudo ${action} el contenido: ${message}`;
}

export async function createArticle(
  _prevState: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const parsed = await parseArticleForm(formData);
  if (!parsed.data) return { error: parsed.error };

  if (parsed.data.body === undefined) {
    return { error: "Elige el archivo .html a subir." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("articles")
    .insert({ ...parsed.data, body: parsed.data.body });

  if (error) return { error: friendlyError(error.message, "crear") };

  revalidateArticlePaths();
  redirect("/admin/contenidos");
}

export async function updateArticle(
  id: string,
  _prevState: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const parsed = await parseArticleForm(formData);
  if (!parsed.data) return { error: parsed.error };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("articles")
    .select("slug, audio_url")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("articles")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: friendlyError(error.message, "guardar") };

  // El audio anterior se borra recién con el cambio guardado.
  if (current?.audio_url && current.audio_url !== parsed.data.audio_url) {
    await removeOwnFile(supabase, current.audio_url);
  }

  revalidateArticlePaths();
  redirect("/admin/contenidos");
}

export async function deleteArticle(id: string) {
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("slug, cover_url, audio_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) return;

  // La portada se borra despues de la fila: si el delete falla por RLS, el
  // articulo sigue en pie y con su imagen.
  if (article?.cover_url?.includes(PUBLIC_PREFIX)) {
    const path = article.cover_url.split(PUBLIC_PREFIX)[1]?.split("?")[0];
    if (path) {
      await supabase.storage.from(BUCKET).remove([decodeURIComponent(path)]);
    }
  }

  await removeOwnFile(supabase, article?.audio_url);

  revalidateArticlePaths();
}

/**
 * Crea el link para compartir un contenido, o devuelve el que ya tiene: hay uno
 * solo por contenido, así que volver a tocar "Compartir" no invalida el que ya
 * se mandó. El token lo genera la base (`article_shares.token`).
 */
export async function shareArticle(
  id: string
): Promise<{ token: string | null; error: string | null }> {
  const supabase = await createClient();

  const { error: insertError } = await supabase
    .from("article_shares")
    .upsert({ article_id: id }, { onConflict: "article_id", ignoreDuplicates: true });
  if (insertError) return { token: null, error: insertError.message };

  const { data, error } = await supabase
    .from("article_shares")
    .select("token")
    .eq("article_id", id)
    .single();
  if (error) return { token: null, error: error.message };

  revalidatePath("/admin/contenidos");
  return { token: data.token, error: null };
}

/** Borra el link: deja de abrir en el acto, la página compartida no cachea. */
export async function unshareArticle(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("article_shares").delete().eq("article_id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/contenidos");
  return { error: null };
}

/**
 * Sube o baja un contenido en el orden del sitio (14/10, pedido de la
 * clienta). `sort_order` puede tener empates (los nuevos entran con 0), así que
 * no se intercambian dos valores: se lee el orden que hoy se ve, se mueve el
 * contenido una posición y se renumera todo de 1 a N. Son decenas de filas.
 */
export async function moveArticle(id: string, direction: "up" | "down") {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("articles")
    .select("id")
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: true })
    .order("created_at", { ascending: false });
  if (!rows) return;

  const ids = rows.map((r) => r.id);
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= ids.length) return;

  [ids[from], ids[to]] = [ids[to], ids[from]];

  await Promise.all(
    ids.map((articleId, index) =>
      supabase.from("articles").update({ sort_order: index + 1 }).eq("id", articleId)
    )
  );

  revalidateArticlePaths();
}

/**
 * Reubica un contenido en otra categoría desde el listado. Solo toca la
 * columna `category`; el resto del artículo queda como está.
 */
export async function setArticleCategory(
  id: string,
  category: string
): Promise<{ error: string | null }> {
  if (!isArticleCategory(category)) return { error: "Categoría inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("articles")
    .update({ category })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateArticlePaths();
  return { error: null };
}
