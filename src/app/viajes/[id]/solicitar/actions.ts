"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { SolicitudRecibida } from "@/emails/SolicitudRecibida";
import { formatDateRangeCompact } from "@/lib/format";

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

  // El acuse va después del insert y antes del redirect (que lanza). Si el mail
  // no sale, la solicitud ya está guardada igual — `sendEmail` no lanza nunca.
  await notifyReceived({ tripId, nombre: full_name, email });

  redirect(`/viajes/${tripId}/solicitar`);
}

/**
 * Acuse de recibo al postulante.
 *
 * **A diferencia de los mails que salen del panel, un fallo acá NO se anota en
 * la casilla de avisos**: quien corre esta acción es el postulante, y no tiene
 * permiso de escribir en `admin_notifications` (esa policy es sólo admin). Si el
 * acuse no sale queda en los logs y nada más — es aceptable, porque el aviso que
 * Estela sí necesita (solicitud nueva) lo escribe el trigger de Postgres.
 */
async function notifyReceived({
  tripId,
  nombre,
  email,
}: {
  tripId: string;
  nombre: string;
  email: string;
}) {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cosmic-eagle.vercel.app";

  const { data: trip } = await supabase
    .from("trips")
    .select("title, start_date, end_date")
    .eq("id", tripId)
    .single();

  await sendEmail({
    to: email,
    subject: `Recibimos tu solicitud para ${trip?.title ?? "el viaje"}`,
    react: SolicitudRecibida({
      // Solo el primer nombre: el formulario pide nombre completo y "Hola María
      // Fernanda Gómez" suena a carta del banco.
      nombre: nombre.split(" ")[0],
      viaje: trip?.title ?? "tu viaje",
      fechas: trip ? formatDateRangeCompact(trip.start_date, trip.end_date) : "",
      url: `${siteUrl}/viajes/${tripId}/solicitar`,
    }),
  });
}
