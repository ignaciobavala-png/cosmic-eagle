import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type PaymentMethod = Tables<"payment_methods">;

/**
 * Los rieles de cobro activos, en orden.
 *
 * Se leen con el cliente de sesion (no el publico): la policy los abre a
 * `authenticated`, no a `anon`. Quien los consume es la pantalla de estado del
 * postulante y el mail de aprobacion, los dos con sesion.
 *
 * Devuelve `[]` si todavia no hay ninguno cargado, y quien llama tiene que
 * bancarse ese caso mostrando el texto de "te escribimos con los datos": el dia
 * que se deployo esto los dos rieles sembrados estaban inactivos y vacios.
 */
export async function getActivePaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return data ?? [];
}
