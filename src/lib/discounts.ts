import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * El código de descuento que la organización le asignó a la persona que mira,
 * si tiene uno vigente para esta experiencia. Lo usa el formulario de postulación
 * para ofrecérselo ya escrito. Si falla la consulta, no se ofrece nada: el campo
 * sigue ahí para tipearlo a mano.
 */
export async function getSuggestedDiscountCode(
  supabase: SupabaseClient<Database>,
  tripId: string
): Promise<string> {
  const { data } = await supabase.rpc("my_discount_codes", { p_trip_id: tripId });
  return data?.[0]?.code ?? "";
}

/** Precio que de verdad paga la persona: el de la experiencia menos su descuento. */
export function finalPrice(price: number, discountAmount: number | null | undefined) {
  return Math.max(0, price - (discountAmount ?? 0));
}
