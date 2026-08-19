"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type HealthFormState = { error: string | null };

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

/**
 * Etapa 2: el formulario de salud extenso, posterior al pago.
 *
 * No lleva nombre, mail ni teléfono: eso ya lo dio en el filtro corto y vive en
 * `applications`. Tampoco lleva user_id ni trip_id: cuelgan de la solicitud.
 *
 * Quién puede escribir acá lo decide la RLS (`owns_approved_application`), no
 * este código: sin una solicitud propia y aprobada el insert se rechaza.
 */
export async function submitHealthForm(
  tripId: string,
  applicationId: string,
  _prevState: HealthFormState,
  formData: FormData
): Promise<HealthFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/cuenta?next=/viajes/${tripId}/salud`);

  const age = str(formData, "age");
  const height = str(formData, "height");
  const weight = str(formData, "weight");
  const country = str(formData, "country");
  const occupation = str(formData, "occupation");

  if (!age || !height || !weight || !country || !occupation) {
    return { error: "Completá todos los campos requeridos." };
  }

  const { error } = await supabase.from("health_form_first_time").insert({
    application_id: applicationId,
    age: Number(age),
    height,
    weight,
    country,
    occupation,
    health_condition: bool(formData, "health_condition"),
    health_condition_detail: str(formData, "health_condition_detail") || null,
    stress_anxiety: bool(formData, "stress_anxiety"),
    stress_anxiety_detail: str(formData, "stress_anxiety_detail") || null,
    trauma: bool(formData, "trauma"),
    trauma_detail: str(formData, "trauma_detail") || null,
    substance_use: bool(formData, "substance_use"),
    substance_use_detail: str(formData, "substance_use_detail") || null,
    allergies: bool(formData, "allergies"),
    allergies_detail: str(formData, "allergies_detail") || null,
    spiritual_practice: bool(formData, "spiritual_practice"),
    spiritual_practice_detail: str(formData, "spiritual_practice_detail") || null,
    first_time_plants: bool(formData, "first_time_plants"),
    plants_detail: str(formData, "plants_detail") || null,
    has_themes: bool(formData, "has_themes"),
    themes_detail: str(formData, "themes_detail") || null,
    fears: bool(formData, "fears"),
    fears_detail: str(formData, "fears_detail") || null,
    comment: str(formData, "comment") || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya recibimos tu formulario de salud para este viaje." };
    }
    return { error: `No se pudo enviar el formulario: ${error.message}` };
  }

  redirect(`/viajes/${tripId}/solicitar`);
}
