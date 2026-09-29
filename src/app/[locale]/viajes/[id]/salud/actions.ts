"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type HealthFormState = { error: string | null };

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * El sí/no de una pregunta. Devuelve `null` cuando no vino ninguna de las dos
 * opciones: con la casilla tildable de antes eso era indistinguible de un "no",
 * y una respuesta de salud que nadie dio no puede guardarse como negativa.
 */
function yesNo(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "si" ? true : value === "no" ? false : null;
}

/** Las nueve preguntas, en el orden del formulario de Estela. */
const QUESTIONS = [
  "health_condition",
  "stress_anxiety",
  "trauma",
  "substance_use",
  "allergies",
  "spiritual_practice",
  "first_time_plants",
  "has_themes",
  "fears",
] as const;

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

  const age = Number(str(formData, "age"));
  const height = str(formData, "height");
  const weight = str(formData, "weight");
  const country = str(formData, "country");
  const occupation = str(formData, "occupation");

  if (!height || !weight || !country || !occupation) {
    return { error: "Completa todos los campos requeridos." };
  }
  // El campo dejó de ser `type="number"` (pedido de Estela, 04/09/2026), así
  // que la validación de que sea un número ya no la hace el navegador.
  if (!Number.isInteger(age) || age < 18 || age > 120) {
    return { error: "Escribe tu edad en años, con números." };
  }

  const answered = {} as Record<(typeof QUESTIONS)[number], boolean>;
  for (const question of QUESTIONS) {
    const value = yesNo(formData, question);
    if (value === null) {
      return { error: "Responde sí o no en todas las preguntas." };
    }
    answered[question] = value;
  }

  const { error } = await supabase.from("health_form_first_time").insert({
    application_id: applicationId,
    age,
    height,
    weight,
    country,
    occupation,
    health_condition: answered.health_condition,
    health_condition_detail: str(formData, "health_condition_detail") || null,
    stress_anxiety: answered.stress_anxiety,
    stress_anxiety_detail: str(formData, "stress_anxiety_detail") || null,
    trauma: answered.trauma,
    trauma_detail: str(formData, "trauma_detail") || null,
    substance_use: answered.substance_use,
    substance_use_detail: str(formData, "substance_use_detail") || null,
    allergies: answered.allergies,
    allergies_detail: str(formData, "allergies_detail") || null,
    spiritual_practice: answered.spiritual_practice,
    spiritual_practice_detail: str(formData, "spiritual_practice_detail") || null,
    first_time_plants: answered.first_time_plants,
    // Ojo: estas dos columnas NO se llaman `<campo>_detail`. El formulario les
    // pasa el nombre real a `YesNoQuestion`; antes mandaba
    // `first_time_plants_detail` / `has_themes_detail` y el detalle se perdía.
    plants_detail: str(formData, "plants_detail") || null,
    has_themes: answered.has_themes,
    themes_detail: str(formData, "themes_detail") || null,
    fears: answered.fears,
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
