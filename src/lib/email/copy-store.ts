import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { CopyOverrides } from "./templates";

/**
 * Lee los textos editados de los correos (tabla `email_templates`). Sin filas
 * —o si la lectura falla— devuelve vacío y el correo sale con el texto por
 * defecto: **un fallo acá nunca puede impedir que salga un mail**.
 */
export async function getAllCopyOverrides(
  supabase?: SupabaseClient<Database>
): Promise<Record<string, Record<string, string>>> {
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("email_templates")
    .select("template_key, field_key, value");

  if (error) {
    console.error(`[email] no se pudieron leer los textos editados: ${error.message}`);
    return {};
  }

  const out: Record<string, Record<string, string>> = {};
  for (const row of data ?? []) {
    (out[row.template_key] ??= {})[row.field_key] = row.value;
  }
  return out;
}

export async function getCopyOverrides(
  templateKey: string,
  supabase?: SupabaseClient<Database>
): Promise<CopyOverrides> {
  const all = await getAllCopyOverrides(supabase);
  return all[templateKey] ?? null;
}
