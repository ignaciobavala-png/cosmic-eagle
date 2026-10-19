"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LAUNCH_KEY } from "@/lib/maintenance";

export type LaunchState = { error: string | null };

/**
 * Prende o apaga la salida oficial del sitio (la pantalla de "en construcción"
 * del dominio propio, ver `src/lib/maintenance.ts`).
 *
 * El interruptor es una fila de `site_content`: ya es de lectura pública y sólo
 * la escribe un admin (policies de la migración 20260812150000), así que no
 * hace falta tabla nueva ni tocar variables en Vercel.
 */
export async function setSiteLaunched(launched: boolean): Promise<LaunchState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_content")
    .upsert({ key: LAUNCH_KEY, value: launched ? "true" : "false" });

  // Lo autoriza la policy de admin; si falla, es que no lo es.
  if (error) return { error: "No se pudo cambiar el estado del sitio." };

  revalidatePath("/admin");
  return { error: null };
}
