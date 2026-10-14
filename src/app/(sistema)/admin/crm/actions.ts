"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { SEND_INTERVAL_MS } from "@/lib/email/schedule-config";
import { filterContacts, type ContactFilters } from "@/lib/crm";
import { loadContacts } from "@/lib/crm-data";
import { MensajeEquipo } from "@/emails/MensajeEquipo";
import { capitalizeName } from "@/lib/person-name";

/**
 * Tope por envío. Resend deja ~2 mails por segundo y la función de Vercel tiene
 * un límite de tiempo (`maxDuration` en la página): con 600 ms entre mails, 80
 * entran en menos de un minuto. Si el grupo es más grande, se pide afinar el
 * filtro en vez de cortarlo en silencio.
 */
export const MAX_RECIPIENTS = 80;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Devuelve al admin logueado o `null`. Nada de esto corre sin pasar por acá. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return null;

  return { supabase, userId: user.id };
}

export type SendResultState = {
  ok: boolean;
  message: string;
};

/**
 * Manda un correo a las personas que cumplen el filtro del CRM.
 *
 * **El público se calcula acá, en el servidor**, con el mismo `filterContacts`
 * de la tabla. El navegador solo manda los filtros: si mandara la lista de
 * correos, un cliente manipulado podría escribirle a cualquiera.
 */
export async function sendSegmentedEmail(
  filters: ContactFilters,
  subject: string,
  message: string
): Promise<SendResultState> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "No tienes permiso para hacer esto." };

  const asunto = subject.trim();
  const mensaje = message.trim();
  if (!asunto || !mensaje) {
    return { ok: false, message: "Escribe el asunto y el mensaje." };
  }

  const contacts = await loadContacts(admin.supabase);
  const recipients = filterContacts(contacts, filters).filter(
    (c) => c.email && !c.isAdmin
  );

  if (recipients.length === 0) {
    return { ok: false, message: "Ninguna persona coincide con este filtro." };
  }
  if (recipients.length > MAX_RECIPIENTS) {
    return {
      ok: false,
      message: `Son ${recipients.length} personas y el máximo por envío es ${MAX_RECIPIENTS}. Afina el filtro (país, género o experiencia).`,
    };
  }

  let sent = 0;
  let notConfigured = false;
  const failed: string[] = [];

  for (const [index, contact] of recipients.entries()) {
    if (index > 0) await sleep(SEND_INTERVAL_MS);

    const firstName = capitalizeName(contact.fullName ?? "").split(" ")[0] || "";
    const result = await sendEmail({
      to: contact.email!,
      subject: asunto,
      react: MensajeEquipo({
        nombre: firstName || "viajero",
        asunto,
        mensaje,
      }),
    });

    if (result.ok) sent++;
    else if (result.reason === "not_configured") {
      notConfigured = true;
      break;
    } else failed.push(contact.email!);
  }

  if (notConfigured) {
    return {
      ok: false,
      message: "El envío de correos no está configurado en este entorno (falta RESEND_API_KEY).",
    };
  }

  if (failed.length > 0) {
    return {
      ok: false,
      message: `Se enviaron ${sent} de ${recipients.length}. No salió para: ${failed.join(", ")}.`,
    };
  }

  return {
    ok: true,
    message: `Listo: se envió a ${sent} ${sent === 1 ? "persona" : "personas"}.`,
  };
}

/**
 * Elimina a una persona del CRM: su cuenta y, en cascada, el perfil, las
 * solicitudes, los formularios de salud, los consentimientos y los comprobantes
 * (todas las FK apuntan a `auth.users` con `on delete cascade`). **No se puede
 * deshacer.**
 *
 * Borrar un usuario de Auth solo lo puede hacer la service role, por eso este
 * es el segundo consumidor de `createAdminClient`. La autorización es la de
 * arriba: sesión de admin verificada en la base, no un dato que mande el
 * navegador.
 */
export async function deleteContact(id: string): Promise<SendResultState> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "No tienes permiso para hacer esto." };

  if (id === admin.userId) {
    return { ok: false, message: "No puedes eliminar tu propia cuenta." };
  }

  const { data: target } = await admin.supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", id)
    .single();
  if (!target) return { ok: false, message: "Esa persona ya no existe." };
  if (target.is_admin) {
    return { ok: false, message: "Una cuenta de administración no se elimina desde acá." };
  }

  const service = createAdminClient();
  if (!service) {
    return { ok: false, message: "Falta la llave de servicio (SUPABASE_SERVICE_ROLE_KEY)." };
  }

  // `consents.application_id` es `on delete restrict`: si el borrado en cascada
  // de la cuenta llega a la solicitud antes que al consentimiento, falla. Se
  // borran primero, en orden.
  const { error: consentError } = await service.from("consents").delete().eq("user_id", id);
  if (consentError) {
    console.error(`[crm] no se pudo borrar el consentimiento de ${id}: ${consentError.message}`);
    return { ok: false, message: "No se pudo eliminar. Inténtalo de nuevo." };
  }

  const { error } = await service.auth.admin.deleteUser(id);
  if (error) {
    console.error(`[crm] no se pudo eliminar ${id}: ${error.message}`);
    return { ok: false, message: "No se pudo eliminar. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/crm");
  revalidatePath("/admin");
  return { ok: true, message: "Persona eliminada." };
}
