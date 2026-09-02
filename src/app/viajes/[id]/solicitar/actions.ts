"use server";

import { revalidatePath } from "next/cache";
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

export type PaymentProofState = { error: string | null };

const PROOF_MAX_BYTES = 5 * 1024 * 1024;
const PROOF_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
];

/**
 * El comprobante de pago que sube el postulante.
 *
 * Reemplaza al "te lo mando por WhatsApp" del proceso manual: el archivo queda
 * colgado de la solicitud y Estela lo mira desde el panel antes de marcar el
 * pago. **No cambia `payment_status` por su cuenta** — subir un papel no es
 * haber pagado, y ese es justamente el paso que decide una persona.
 *
 * El archivo va al bucket `comprobantes`, que es el único PRIVADO del proyecto:
 * lleva nombre, cuenta y a veces el saldo de quien transfiere. La ruta arranca
 * con el user_id porque es lo que chequea la policy de storage.
 */
export async function uploadPaymentProof(
  tripId: string,
  applicationId: string,
  _prevState: PaymentProofState,
  formData: FormData
): Promise<PaymentProofState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/cuenta?next=/viajes/${tripId}/solicitar`);

  const file = formData.get("proof");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elige el archivo del comprobante." };
  }
  if (!PROOF_TYPES.includes(file.type)) {
    return { error: "El comprobante tiene que ser una imagen o un PDF." };
  }
  if (file.size > PROOF_MAX_BYTES) {
    return { error: "El archivo no puede superar los 5MB." };
  }

  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.name.split(".").pop()?.toLowerCase() || "jpg";
  // Nombre único: los comprobantes se acumulan (seña y saldo son dos), así que
  // no se pisan entre ellos como sí hace el avatar.
  const path = `${user.id}/${applicationId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("comprobantes")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { error: "No se pudo subir el archivo. Prueba de nuevo." };
  }

  // La fila es la que vale: es la que dispara el aviso al panel y la única por
  // la que el comprobante se puede encontrar. Un archivo sin fila queda
  // huérfano y no lo ve nadie — no se borra acá porque el postulante no tiene
  // DELETE sobre el bucket, y dárselo le permitiría hacer desaparecer un
  // comprobante ya revisado.
  const { error } = await supabase.from("payment_proofs").insert({
    application_id: applicationId,
    storage_path: path,
    note: str(formData, "note") || null,
  });

  if (error) {
    return { error: `No se pudo registrar el comprobante: ${error.message}` };
  }

  revalidatePath(`/viajes/${tripId}/solicitar`);
  return { error: null };
}
