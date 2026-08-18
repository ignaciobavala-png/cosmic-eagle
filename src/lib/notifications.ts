import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";

/**
 * Casilla de avisos internos del panel (`/admin/notificaciones`).
 *
 * Los avisos de solicitud nueva **no pasan por acá**: los escribe un trigger en
 * Postgres (migración `20260818130000_admin_notifications.sql`), porque quien
 * inserta la solicitud es el postulante y no puede escribir en esta tabla. Este
 * helper es para los avisos que sí nacen en el código, con sesión de admin: hoy
 * el único es "el mail no salió".
 */
export async function createAdminNotification({
  kind,
  title,
  body,
  href,
}: {
  kind: Enums<"admin_notification_kind">;
  title: string;
  body?: string;
  href?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("admin_notifications")
    .insert({ kind, title, body, href });

  // Mismo criterio que `sendEmail`: quien llama está haciendo otra cosa más
  // importante. Un aviso que no se pudo guardar no puede tirar abajo la
  // aprobación de una solicitud.
  if (error) {
    console.error(`[notificaciones] no se pudo guardar "${title}": ${error.message}`);
  }
}
