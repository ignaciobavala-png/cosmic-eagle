"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { createAdminNotification } from "@/lib/notifications";
import { SolicitudAprobada } from "@/emails/SolicitudAprobada";
import { formatDateRangeCompact } from "@/lib/format";
import type { Enums } from "@/lib/supabase/types";

export type ApplicationTable = "applications_first_time" | "applications_returning";

const SLUG_BY_TABLE: Record<ApplicationTable, string> = {
  applications_first_time: "primerizo",
  applications_returning: "recurrente",
};

export async function reviewApplication(
  table: ApplicationTable,
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
    .from(table)
    .select("user_id, full_name, email, status, trip_id, trips(title, start_date, end_date)")
    .eq("id", id)
    .single();

  if (application?.user_id === user?.id) {
    throw new Error("No podés revisar tu propia solicitud.");
  }

  const { error } = await supabase
    .from(table)
    .update({
      status,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar la solicitud: ${error.message}`);
  }

  // El mail sale después del update y sin `await` bloqueante sobre el resultado:
  // si Resend falla, la aprobación ya está hecha en la base. Solo se manda al
  // aprobar, y solo en la transición: un segundo click no vuelve a escribirle a
  // la persona.
  if (status === "approved" && application && application.status !== "approved") {
    await notifyApproved({
      table,
      id,
      nombre: application.full_name,
      email: application.email,
      tripId: application.trip_id,
      trip: application.trips,
    });
  }

  revalidatePath("/admin/solicitudes");
  revalidatePath(`/admin/solicitudes/${SLUG_BY_TABLE[table]}/${id}`);
}

async function notifyApproved({
  table,
  id,
  nombre,
  email,
  tripId,
  trip,
}: {
  table: ApplicationTable;
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
        ? `Resend todavía no está configurado (falta RESEND_API_KEY). Escribile a ${email} a mano.`
        : `Resend rechazó el envío a ${email}: ${result.error ?? "sin detalle"}.`,
    href: `/admin/solicitudes/${SLUG_BY_TABLE[table]}/${id}`,
  });
}
