"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isFaqPlacement } from "@/lib/faqs";

export type FaqFormState = { error: string | null };

/**
 * /faqs es ISR (`revalidate = 3600`): sin este revalidate manual, una pregunta
 * nueva tardaria hasta una hora en aparecer y la clienta guarda y mira enseguida.
 */
function revalidateFaqPaths() {
  revalidatePath("/faqs");
  revalidatePath("/admin/faqs");
}

function parseForm(formData: FormData) {
  const placement = formData.get("placement");
  const question = formData.get("question");
  const answer = formData.get("answer");
  const sortOrder = formData.get("sort_order");

  if (
    !isFaqPlacement(placement) ||
    typeof question !== "string" ||
    !question.trim() ||
    typeof answer !== "string" ||
    !answer.trim()
  ) {
    return { error: "Completá el bloque, la pregunta y la respuesta.", data: null } as const;
  }

  const parsedOrder = Number(sortOrder);

  return {
    error: null,
    data: {
      placement,
      question: question.trim(),
      answer: answer.trim(),
      // El orden es opcional en el form; sin numero valido va al final.
      sort_order: Number.isFinite(parsedOrder) ? parsedOrder : 0,
      is_published: formData.get("is_published") === "on",
    },
  } as const;
}

export async function createFaq(
  _state: FaqFormState,
  formData: FormData
): Promise<FaqFormState> {
  const parsed = parseForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("faqs").insert(parsed.data);

  // El insert lo autoriza la policy de admin; si falla, es que no lo es.
  if (error) return { error: "No se pudo guardar la pregunta." };

  revalidateFaqPaths();
  redirect("/admin/faqs");
}

export async function updateFaq(
  id: string,
  _state: FaqFormState,
  formData: FormData
): Promise<FaqFormState> {
  const parsed = parseForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("faqs").update(parsed.data).eq("id", id);

  if (error) return { error: "No se pudo guardar la pregunta." };

  revalidateFaqPaths();
  redirect("/admin/faqs");
}

export async function deleteFaq(id: string) {
  const supabase = await createClient();
  await supabase.from("faqs").delete().eq("id", id);

  revalidateFaqPaths();
}
