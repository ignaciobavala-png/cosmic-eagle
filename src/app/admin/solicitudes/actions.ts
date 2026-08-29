"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { createAdminNotification } from "@/lib/notifications";
import { SolicitudAprobada } from "@/emails/SolicitudAprobada";
import { SolicitudRechazada } from "@/emails/SolicitudRechazada";
import { PagoRegistrado } from "@/emails/PagoRegistrado";
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

  // El rechazo también se avisa: sin mail, la persona se entera sólo si vuelve
  // a entrar al sitio a mirar el estado. `expired` no manda nada — es una
  // invalidación administrativa, no una respuesta a la persona.
  if (status === "rejected" && application && application.status !== "rejected") {
    await notifyRejected({
      id,
      nombre: application.full_name,
      email: application.email,
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

  // Igual que en la revisión: hace falta el estado ANTERIOR del pago para no
  // remandar el aviso si se vuelve a apretar el mismo botón, y de paso trae los
  // datos del mail en la misma consulta.
  const { data: application } = await supabase
    .from("applications")
    .select(
      "full_name, email, status, payment_status, trip_id, previous_ceremonies, trips(title, start_date, end_date)"
    )
    .eq("id", id)
    .single();

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

  // Este es el mail que destraba la etapa 2. Sólo en la transición desde
  // `pending`, y sólo si la solicitud ya está aprobada: marcar el pago de una
  // solicitud que todavía no se aprobó no le confirma ningún cupo a nadie.
  if (
    paymentStatus !== "pending" &&
    application?.payment_status === "pending" &&
    application.status === "approved"
  ) {
    await notifyPaid({
      id,
      nombre: application.full_name,
      email: application.email,
      tripId: application.trip_id,
      trip: application.trips,
      sinCargo: paymentStatus === "waived",
      // Mismo criterio que la vista `my_applications`: primeriza es la que
      // declaró cero ceremonias, y es la única que tiene etapa 2 (no existe un
      // `health_form_returning`).
      esPrimeriza: application.previous_ceremonies === 0,
    });
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

async function notifyRejected({
  id,
  nombre,
  email,
  trip,
}: {
  id: string;
  nombre: string;
  email: string;
  trip: { title: string; start_date: string; end_date: string } | null;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cosmic-eagle.vercel.app";

  const result = await sendEmail({
    to: email,
    subject: `Sobre tu solicitud para ${trip?.title ?? "el viaje"}`,
    react: SolicitudRechazada({
      nombre: nombre.split(" ")[0],
      viaje: trip?.title ?? "el viaje",
      // Al calendario y no al viaje que se rechazó: mandarla de vuelta a la
      // página de la que la acabamos de dejar afuera no tiene sentido.
      url: `${siteUrl}/viajes`,
    }),
  });

  if (result.ok) return;

  await createAdminNotification({
    kind: "email_failed",
    title: `No se pudo avisarle a ${nombre} que su solicitud no fue aprobada`,
    body:
      result.reason === "not_configured"
        ? `Resend todavía no está configurado (falta RESEND_API_KEY). Escríbele a ${email} a mano.`
        : `Resend rechazó el envío a ${email}: ${result.error ?? "sin detalle"}.`,
    href: `/admin/solicitudes/${id}`,
  });
}

async function notifyPaid({
  id,
  nombre,
  email,
  tripId,
  trip,
  sinCargo,
  esPrimeriza,
}: {
  id: string;
  nombre: string;
  email: string;
  tripId: string;
  trip: { title: string; start_date: string; end_date: string } | null;
  sinCargo: boolean;
  esPrimeriza: boolean;
}) {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cosmic-eagle.vercel.app";

  // El formulario extenso puede estar ya cargado si el pago se marca dos veces,
  // o si se corrigió un `waived` puesto de más: en ese caso el CTA no debe
  // mandarla de nuevo a un formulario que no la va a dejar entrar.
  const { data: healthForm } = await supabase
    .from("health_form_first_time")
    .select("id")
    .eq("application_id", id)
    .maybeSingle();

  const necesitaSalud = esPrimeriza && !healthForm;

  const result = await sendEmail({
    to: email,
    subject: `Tu cupo en ${trip?.title ?? "el viaje"} está reservado`,
    react: PagoRegistrado({
      nombre: nombre.split(" ")[0],
      viaje: trip?.title ?? "tu viaje",
      fechas: trip ? formatDateRangeCompact(trip.start_date, trip.end_date) : "",
      sinCargo,
      necesitaSalud,
      url: necesitaSalud
        ? `${siteUrl}/viajes/${tripId}/salud`
        : `${siteUrl}/viajes/${tripId}`,
    }),
  });

  if (result.ok) return;

  await createAdminNotification({
    kind: "email_failed",
    title: `No se pudo avisarle a ${nombre} que su cupo quedó reservado`,
    body:
      result.reason === "not_configured"
        ? `Resend todavía no está configurado (falta RESEND_API_KEY). Escríbele a ${email} a mano${necesitaSalud ? " para que complete el formulario de salud" : ""}.`
        : `Resend rechazó el envío a ${email}: ${result.error ?? "sin detalle"}.`,
    href: `/admin/solicitudes/${id}`,
  });
}
