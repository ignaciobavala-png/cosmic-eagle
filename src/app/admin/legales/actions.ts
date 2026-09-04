"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLegalSlug, legalDocumentMeta } from "@/lib/legal";

export type LegalFormState = { error: string | null };

/**
 * Guarda uno de los dos documentos legales.
 *
 * No hay `create` ni `delete`: las dos filas las siembra la migración y
 * `authenticated` no tiene esos grants. Un documento nuevo es una ruta nueva.
 */
export async function updateLegalDocument(
  slug: string,
  _state: LegalFormState,
  formData: FormData
): Promise<LegalFormState> {
  if (!isLegalSlug(slug)) return { error: "Ese documento no existe." };

  const title = formData.get("title");
  const body = formData.get("body");

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof body !== "string" ||
    !body.trim()
  ) {
    return { error: "El título y el texto no pueden quedar vacíos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("legal_documents")
    .update({
      title: title.trim(),
      body: body.trim(),
      is_provisional: formData.get("is_provisional") === "on",
    })
    .eq("slug", slug);

  // Lo autoriza la policy de admin; si falla, es que no lo es.
  if (error) return { error: "No se pudo guardar el documento." };

  // Las dos páginas públicas son ISR de una hora: sin esto, la clienta guarda y
  // no ve el cambio.
  revalidatePath(legalDocumentMeta(slug).href);
  revalidatePath("/admin/legales");
  redirect("/admin/legales");
}
