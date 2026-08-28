"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { createAdminNotification } from "@/lib/notifications";
import { SolicitudAprobada } from "@/emails/SolicitudAprobada";
import { formatDateRangeCompact } from "@/lib/format";
import type { Enums } from "@/lib/supabase/types";

export async function reviewApplication(
  id: string,
  status: Enums<"application_status">
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se lee antes del update: hace falta el estado ANTERIOR para no remandar el
  // mail si alguien vuelve a apretar "Aprobar" sobre una solicitud ya aprobada,
  // y de paso trae los datos del mail en la misma consulta.
  const { data: application } = await supabase
    .from("applications")
    .select("user_id, full_name, email, status, trip_id, trips(title, start_date, end_date)")
    .eq("id", id)
    .single();

  if (application?.user_id === user?.id) {
    throw new Error("No puedes revisar tu propia solicitud.");
  }

  const { error } = await supabase
    .from("applications")
    .update({
      status,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar la solicitud: ${error.message}`);
  }

  // El mail sale después del update: si Resend falla, la aprobación ya está
  // hecha en la base. Solo se manda al aprobar, y solo en la transición: un
  // segundo click no vuelve a escribirle a la persona.
  if (status === "approved" && application && application.status !== "approved") {
    await notifyApproved({
      id,
      nombre: application.full_name,
      email: application.email,
      tripId: application.trip_id,
      trip: application.trips,
    });
  }

  revalidatePath("/admin/solicitudes");
  revalidatePath(`/admin/solicitudes/${id}`);
}

/**
 * El pago lo registra Estela a mano: no hay pasarela elegida todavía (ver
 * docs/FLUJO_INSCRIPCION.md). Es el escalón que habilita la etapa 2, así que
 * mientras no exista el cobro automático esto es lo que destraba el flujo.
 */
export async function markPayment(
  id: string,
  paymentStatus: Enums<"payment_status">,
  reference: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("applications")
    .update({
      payment_status: paymentStatus,
      paid_at: paymentStatus === "pending" ? null : new Date().toISOString(),
      payment_reference: reference.trim() || null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo registrar el pago: ${error.message}`);
  }

  revalidatePath("/admin/solicitudes");
  revalidatePath(`/admin/solicitudes/${id}`);
}

async function notifyApproved({
  id,
  nombre,
  email,
  tripId,
  trip,
}: {
  id: string;
  nombre: string;
  email: string;
  tripId: string;
  trip: { title: string; start_date: string; end_date: string } | null;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cosmic-eagle.vercel.app";

  const result = await sendEmail({
    to: email,
    subject: `Tu solicitud para ${trip?.title ?? "el viaje"} fue aprobada`,
    react: SolicitudAprobada({
      // Solo el primer nombre: el formulario pide nombre completo y "Hola María
      // Fernanda Gómez" suena a carta del banco.
      nombre: nombre.split(" ")[0],
      viaje: trip?.title ?? "tu viaje",
      fechas: trip ? formatDateRangeCompact(trip.start_date, trip.end_date) : "",
      url: `${siteUrl}/viajes/${tripId}`,
    }),
  });

  if (result.ok) return;

  // El fallo va a la casilla del panel y no solo a `console.error`: los logs de
  // Vercel se vencen a las 24hs y nadie los mira. Si el mail no salió, alguien
  // tiene que escribirle a la persona a mano, y para eso hay que enterarse.
  await createAdminNotification({
    kind: "email_failed",
    title: `No se pudo avisarle a ${nombre} que fue aprobada`,
    body:
      result.reason === "not_configured"
        ? `Resend todavía no está configurado (falta RESEND_API_KEY). Escríbele a ${email} a mano.`
        : `Resend rechazó el envío a ${email}: ${result.error ?? "sin detalle"}.`,
    href: `/admin/solicitudes/${id}`,
  });
}
