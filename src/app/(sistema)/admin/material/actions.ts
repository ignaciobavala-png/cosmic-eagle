"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { readHtmlFile } from "@/lib/html-upload";

export type MaterialFormState = { error: string | null; saved?: boolean };

function revalidate() {
  revalidatePath("/admin/material");
}

function titleOf(formData: FormData) {
  const title = formData.get("title");
  return typeof title === "string" ? title.trim().slice(0, 200) : "";
}

export async function createMaterial(
  _prev: MaterialFormState,
  formData: FormData
): Promise<MaterialFormState> {
  const title = titleOf(formData);
  if (!title) return { error: "Ponle un título al documento." };

  const file = await readHtmlFile(formData.get("html"));
  if (file.error) return { error: file.error };
  if (!file.html) return { error: "Elige el archivo .html a subir." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materiales")
    .insert({ title, html: file.html })
    .select("id")
    .single();

  if (error || !data) {
    return { error: `No se pudo crear el documento: ${error?.message ?? "sin respuesta"}` };
  }

  revalidate();
  // Se sigue en la edicion: lo normal despues de subir es sacar el link.
  redirect(`/admin/material/${data.id}/editar`);
}

export async function updateMaterial(
  id: string,
  _prev: MaterialFormState,
  formData: FormData
): Promise<MaterialFormState> {
  const title = titleOf(formData);
  if (!title) return { error: "Ponle un título al documento." };

  // Sin archivo nuevo el HTML queda como esta: no se pisa con null.
  const file = await readHtmlFile(formData.get("html"));
  if (file.error) return { error: file.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("materiales")
    .update({
      title,
      ...(file.html ? { html: file.html } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidate();
  return { error: null, saved: true };
}

export async function deleteMaterial(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("materiales").delete().eq("id", id);
  if (error) return;
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
