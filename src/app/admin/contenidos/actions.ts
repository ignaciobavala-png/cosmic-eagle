"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isArticleCategory, slugify } from "@/lib/article";
import type { ArticleStatus } from "@/lib/article";

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

/** El listado publico, el detalle y el panel muestran lo mismo. */
function revalidateArticlePaths(slug: string) {
  revalidatePath("/contenidos");
  revalidatePath(`/contenidos/${slug}`);
  revalidatePath("/admin/contenidos");
}

function parseArticleForm(formData: FormData) {
  const title = formData.get("title");
  const body = formData.get("body");
  const excerpt = formData.get("excerpt");
  const category = formData.get("category");
  const status = formData.get("status");
  const slugField = formData.get("slug");

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof body !== "string" ||
    !body.trim() ||
    !isArticleCategory(category) ||
    !isStatus(status)
  ) {
    return { error: "Completá el título y el texto.", data: null } as const;
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
      body: body.trim(),
      excerpt:
        typeof excerpt === "string" && excerpt.trim() ? excerpt.trim() : null,
      category,
      status,
    },
  } as const;
}

/**
 * Sube la portada si el form trae una. Devuelve `url: undefined` cuando no hay
 * archivo, para distinguir "no tocar la portada" de "portada vacia".
 *
 * `currentUrl` es la que se reemplaza: se borra despues de subir la nueva, asi
 * el bucket no crece con cada edicion.
 */
async function uploadCover(
  supabase: SupabaseClient,
  formData: FormData,
  currentUrl?: string | null
): Promise<{ error: string | null; url?: string }> {
  const file = formData.get("cover");

  if (!(file instanceof File) || file.size === 0) return { error: null };

  if (!file.type.startsWith("image/")) {
    return { error: "La portada debe ser una imagen." };
  }

  // El bucket es publico y un SVG servido inline puede llevar script adentro.
  if (file.type === "image/svg+xml") {
    return { error: "Los SVG no están permitidos. Subí JPG, PNG o WebP." };
  }

  // Llega ya recortada y comprimida del browser; el tope es la red de
  // contencion por si la compresion no corrio y subio el original.
  if (file.size > 5 * 1024 * 1024) {
    return { error: "La portada no puede superar los 5MB." };
  }

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "webp";
  // Nombre nuevo en cada subida: con un path fijo la URL no cambia y el CDN
  // sigue sirviendo la imagen vieja despues de reemplazarla.
  const path = `articles/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) return { error: "No se pudo subir la portada. Probá de nuevo." };

  if (currentUrl?.includes(PUBLIC_PREFIX)) {
    const oldPath = currentUrl.split(PUBLIC_PREFIX)[1]?.split("?")[0];
    if (oldPath) {
      await supabase.storage.from(BUCKET).remove([decodeURIComponent(oldPath)]);
    }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { error: null, url: publicUrl };
}

/** El slug es unico: el mensaje crudo de Postgres no le dice nada a la clienta. */
function friendlyError(message: string, action: "crear" | "guardar") {
  if (message.includes("articles_slug_key")) {
    return "Ya hay un contenido con esa dirección. Cambiá el título o la dirección.";
  }
  return `No se pudo ${action} el contenido: ${message}`;
}

export async function createArticle(
  _prevState: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const parsed = parseArticleForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();

  const cover = await uploadCover(supabase, formData);
  if (cover.error) return { error: cover.error };

  const { error } = await supabase
    .from("articles")
    .insert({ ...parsed.data, cover_url: cover.url ?? null });

  if (error) return { error: friendlyError(error.message, "crear") };

  revalidateArticlePaths(parsed.data.slug);
  redirect("/admin/contenidos");
}

export async function updateArticle(
  id: string,
  _prevState: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const parsed = parseArticleForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();

  // La portada actual se relee de la base para poder borrarla: el cliente manda
  // el archivo nuevo, nunca la URL a borrar.
  const { data: current } = await supabase
    .from("articles")
    .select("cover_url, slug")
    .eq("id", id)
    .single();

  const cover = await uploadCover(supabase, formData, current?.cover_url);
  if (cover.error) return { error: cover.error };

  // Sin archivo nuevo la portada queda como esta: no se pisa con null.
  const { error } = await supabase
    .from("articles")
    .update(cover.url ? { ...parsed.data, cover_url: cover.url } : parsed.data)
    .eq("id", id);

  if (error) return { error: friendlyError(error.message, "guardar") };

  // Si cambio la direccion hay que invalidar tambien la vieja, que queda 404.
  if (current?.slug && current.slug !== parsed.data.slug) {
    revalidatePath(`/contenidos/${current.slug}`);
  }
  revalidateArticlePaths(parsed.data.slug);
  redirect("/admin/contenidos");
}

export async function deleteArticle(id: string) {
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("slug, cover_url")
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

  revalidateArticlePaths(article?.slug ?? "");
}
