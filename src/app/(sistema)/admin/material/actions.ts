"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MATERIAL_BUCKET,
  collectMaterialUrls,
  materialPathFromUrl,
  ownMaterialUrl,
  parseMaterialBlocks,
} from "@/lib/material";

export type MaterialFormState = { error: string | null; saved?: boolean };

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function parseForm(formData: FormData) {
  const title = formData.get("title");
  const eyebrow = formData.get("eyebrow");
  const blocksField = formData.get("blocks");

  if (typeof title !== "string" || !title.trim()) {
    return { error: "Ponle un título al documento.", data: null } as const;
  }

  let rawBlocks: unknown = [];
  try {
    rawBlocks = JSON.parse(typeof blocksField === "string" ? blocksField : "[]");
  } catch {
    return { error: "No se pudo leer el contenido. Recarga e intenta de nuevo.", data: null } as const;
  }

  return {
    error: null,
    data: {
      title: title.trim().slice(0, 200),
      eyebrow:
        typeof eyebrow === "string" && eyebrow.trim()
          ? eyebrow.trim().slice(0, 120)
          : null,
      // Las imagenes las sube el browser directo a Storage y aca solo llega la
      // URL: se acepta unicamente una de nuestro bucket bajo `material/`.
      cover_url: ownMaterialUrl(formData.get("cover_url")),
      back_cover_url: ownMaterialUrl(formData.get("back_cover_url")),
      blocks: parseMaterialBlocks(rawBlocks),
    },
  } as const;
}

/** Borra del bucket las imagenes que el documento dejo de usar. */
async function removeFiles(supabase: SupabaseClient, urls: string[]) {
  const paths = urls
    .map(materialPathFromUrl)
    .filter((path): path is string => Boolean(path));
  if (paths.length) await supabase.storage.from(MATERIAL_BUCKET).remove(paths);
}

function revalidate() {
  revalidatePath("/admin/material");
}

export async function createMaterial(
  _prev: MaterialFormState,
  formData: FormData
): Promise<MaterialFormState> {
  const parsed = parseForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materiales")
    // `blocks` ya paso por `parseMaterialBlocks`: es jsonb bien formado.
    .insert({ ...parsed.data, blocks: parsed.data.blocks as never })
    .select("id")
    .single();

  if (error || !data) {
    return { error: `No se pudo crear el documento: ${error?.message ?? "sin respuesta"}` };
  }

  revalidate();
  // Se sigue en el editor: lo normal despues de crear es compartirlo.
  redirect(`/admin/material/${data.id}/editar`);
}

export async function updateMaterial(
  id: string,
  _prev: MaterialFormState,
  formData: FormData
): Promise<MaterialFormState> {
  const parsed = parseForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();

  // Las imagenes anteriores se releen de la base: el cliente nunca dice cuales
  // borrar.
  const { data: current } = await supabase
    .from("materiales")
    .select("cover_url, back_cover_url, blocks")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("materiales")
    .update({
      ...parsed.data,
      blocks: parsed.data.blocks as never,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  // Recien con el cambio guardado se limpia lo que ya no se usa.
  if (current) {
    const before = collectMaterialUrls(
      current.cover_url,
      current.back_cover_url,
      parseMaterialBlocks(current.blocks)
    );
    const after = new Set(
      collectMaterialUrls(
        parsed.data.cover_url,
        parsed.data.back_cover_url,
        parsed.data.blocks
      )
    );
    await removeFiles(
      supabase,
      before.filter((url) => !after.has(url))
    );
  }

  revalidate();
  return { error: null, saved: true };
}

export async function deleteMaterial(id: string) {
  const supabase = await createClient();

  const { data: material } = await supabase
    .from("materiales")
    .select("cover_url, back_cover_url, blocks")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("materiales").delete().eq("id", id);
  if (error) return;

  // Las imagenes se borran despues de la fila: si el delete falla por RLS, el
  // documento sigue en pie con sus imagenes.
  if (material) {
    await removeFiles(
      supabase,
      collectMaterialUrls(
        material.cover_url,
        material.back_cover_url,
        parseMaterialBlocks(material.blocks)
      )
    );
  }

  revalidate();
}

/**
 * Crea el link para compartir, o devuelve el que ya tiene: hay uno por
 * documento, asi que volver a tocar "Compartir" no invalida el que ya se mando.
 * 122 bits al azar, sin guiones.
 */
export async function shareMaterial(
  id: string
): Promise<{ token: string | null; error: string | null }> {
  const supabase = await createClient();

  const { data: current, error: readError } = await supabase
    .from("materiales")
    .select("share_token")
    .eq("id", id)
    .single();
  if (readError) return { token: null, error: readError.message };
  if (current.share_token) return { token: current.share_token, error: null };

  const token = crypto.randomUUID().replaceAll("-", "");
  const { error } = await supabase
    .from("materiales")
    .update({ share_token: token })
    .eq("id", id);
  if (error) return { token: null, error: error.message };

  revalidate();
  return { token, error: null };
}

/** Quita el link: deja de abrir en el acto, la pagina compartida no cachea. */
export async function unshareMaterial(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("materiales")
    .update({ share_token: null })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidate();
  return { error: null };
}
