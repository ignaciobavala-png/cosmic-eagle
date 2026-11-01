"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseTestimonialForm } from "@/lib/testimonial-form";
import { publicPath } from "@/i18n/public-path";

export type TestimonialFormState = { error: string | null };

/**
 * Los testimonios se ven en la home y en /viajes, y el panel los lista aparte.
 * La home ademas es ISR (`revalidate = 3600`): sin este revalidate manual, un
 * testimonio nuevo tardaria hasta una hora en aparecer.
 */
function revalidateTestimonialPaths() {
  revalidatePath(publicPath("/"), "page");
  revalidatePath(publicPath("/viajes"), "page");
  revalidatePath("/admin/testimonios");
}

export async function createTestimonial(
  _state: TestimonialFormState,
  formData: FormData
): Promise<TestimonialFormState> {
  const parsed = parseTestimonialForm(formData);
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
  const parsed = parseTestimonialForm(formData);
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
