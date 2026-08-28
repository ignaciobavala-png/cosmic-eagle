"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ApplicationFormState = { error: string | null };

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

/**
 * Etapa 1 del flujo: el filtro corto que llenan TODOS, primerizos y
 * recurrentes (ver docs/FLUJO_INSCRIPCION.md). El formulario de salud extenso
 * llega después, en /viajes/[id]/salud, y sólo una vez aprobada y pagada.
 */
export async function submitApplication(
  tripId: string,
  _prevState: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/cuenta?next=/viajes/${tripId}/solicitar`);

  const full_name = str(formData, "full_name");
  const email = str(formData, "email");
  const previous_ceremonies = str(formData, "previous_ceremonies");

  if (!full_name || !email || !previous_ceremonies) {
    return { error: "Completa todos los campos requeridos." };
  }

  const { error } = await supabase.from("applications").insert({
    user_id: user.id,
    trip_id: tripId,
    full_name,
    email,
    phone: str(formData, "phone") || null,
    previous_ceremonies: Number(previous_ceremonies),
    // Las tres preguntas de Sofía (19/08/2026). Ninguna rechaza sola: el
    // encuadre es informativo, todas las solicitudes las lee Estela.
    serious_illness: bool(formData, "serious_illness"),
    serious_illness_detail: str(formData, "serious_illness_detail") || null,
    mental_health_treatment: bool(formData, "mental_health_treatment"),
    mental_health_treatment_detail:
      str(formData, "mental_health_treatment_detail") || null,
    current_medication: bool(formData, "current_medication"),
    current_medication_detail:
      str(formData, "current_medication_detail") || null,
    theme: str(formData, "theme") || null,
    comment: str(formData, "comment") || null,
  });

  if (error) {
    // El índice parcial `applications_one_active_per_trip_idx` deja una sola
    // solicitud viva por viaje: rechazada o vencida sí se puede volver a mandar.
    if (error.code === "23505") {
      return { error: "Ya tienes una solicitud en curso para este viaje." };
    }
    return { error: `No se pudo enviar la solicitud: ${error.message}` };
  }

  redirect(`/viajes/${tripId}/solicitar`);
}
