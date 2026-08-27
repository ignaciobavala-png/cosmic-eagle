"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTestimonialPlacement } from "@/lib/testimonials";

export type TestimonialFormState = { error: string | null };

/**
 * Los testimonios se ven en la home y en /viajes, y el panel los lista aparte.
 * La home ademas es ISR (`revalidate = 3600`): sin este revalidate manual, un
 * testimonio nuevo tardaria hasta una hora en aparecer.
 */
function revalidateTestimonialPaths() {
  revalidatePath("/");
  revalidatePath("/viajes");
  revalidatePath("/admin/testimonios");
}

function parseForm(formData: FormData) {
  const placement = formData.get("placement");
  const quote = formData.get("quote");
  const authorName = formData.get("author_name");
  const authorLocation = formData.get("author_location");
  const sortOrder = formData.get("sort_order");

  if (
    !isTestimonialPlacement(placement) ||
    typeof quote !== "string" ||
    !quote.trim() ||
    typeof authorName !== "string" ||
    !authorName.trim()
  ) {
    return {
      error: "Completá la sección, el testimonio y el nombre.",
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
      author_location:
        typeof authorLocation === "string" && authorLocation.trim()
          ? authorLocation.trim()
          : null,
      // El orden es opcional en el form; sin numero valido va al final.
      sort_order: Number.isFinite(parsedOrder) ? parsedOrder : 0,
      is_published: formData.get("is_published") === "on",
    },
  } as const;
}

export async function createTestimonial(
  _state: TestimonialFormState,
  formData: FormData
): Promise<TestimonialFormState> {
  const parsed = parseForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").insert(parsed.data);

  // El insert lo autoriza la policy de admin; si falla, es que no lo es.
  if (error) return { error: "No se pudo guardar el testimonio." };

  revalidateTestimonialPaths();
  redirect("/admin/testimonios");
}

export async function updateTestimonial(
  id: string,
  _state: TestimonialFormState,
  formData: FormData
): Promise<TestimonialFormState> {
  const parsed = parseForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("testimonials")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: "No se pudo guardar el testimonio." };

  revalidateTestimonialPaths();
  redirect("/admin/testimonios");
}

export async function deleteTestimonial(id: string) {
  const supabase = await createClient();
  await supabase.from("testimonials").delete().eq("id", id);

  revalidateTestimonialPaths();
}
