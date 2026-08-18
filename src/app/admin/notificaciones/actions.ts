"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Marcar leído es global, no por admin: la tabla guarda un solo `read_at` /
 * `read_by` (ver la migración). Con dos o tres personas mirando lo mismo alcanza,
 * y evita una tabla de cruce por lectura.
 */
async function markRead(ids: string[] | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("admin_notifications")
    .update({ read_at: new Date().toISOString(), read_by: user?.id ?? null })
    .is("read_at", null);

  if (ids) query = query.in("id", ids);

  const { error } = await query;

  if (error) {
    throw new Error(`No se pudo marcar como leído: ${error.message}`);
  }

  // El contador del campanita vive en el layout del admin, así que hay que
  // revalidar el layout y no solo la página.
  revalidatePath("/admin", "layout");
}

export async function markNotificationRead(id: string) {
  await markRead([id]);
}

export async function markAllNotificationsRead() {
  await markRead(null);
}
