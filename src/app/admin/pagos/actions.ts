"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PaymentMethodState = { error: string | null; ok?: boolean };

/**
 * Los rieles de cobro. Los edita Estela y son datos bancarios reales, asi que
 * NO viven en el repo: la migracion siembra dos filas vacias e inactivas y los
 * numeros se cargan desde acá.
 *
 * No hay `revalidatePath` de rutas publicas a proposito: las instrucciones de
 * pago solo se ven en la pantalla de estado del postulante, que es dinamica
 * (lee `cookies()`), y en el mail, que se arma en el momento de mandarlo.
 */
function parse(formData: FormData) {
  const label = formData.get("label");
  const instructions = formData.get("instructions");

  if (
    typeof label !== "string" ||
    !label.trim() ||
    typeof instructions !== "string" ||
    !instructions.trim()
  ) {
    return { error: "Completa el nombre del medio de pago y las instrucciones.", data: null } as const;
  }

  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };

  const parsedOrder = Number(formData.get("sort_order"));

  return {
    error: null,
    data: {
      label: label.trim(),
      // Se guarda con los saltos de linea tal cual: las instrucciones son una
      // lista de datos (titular, IBAN, BIC) y se renderizan con `whitespace-pre-line`.
      instructions: instructions.trim(),
      audience: text("audience"),
      currency: text("currency"),
      link_url: text("link_url"),
      sort_order: Number.isFinite(parsedOrder) ? parsedOrder : 0,
      is_active: formData.get("is_active") === "on",
    },
  } as const;
}

export async function savePaymentMethod(
  id: string,
  _prevState: PaymentMethodState,
  formData: FormData
): Promise<PaymentMethodState> {
  const parsed = parse(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_methods")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/admin/pagos");
  return { error: null, ok: true };
}

export async function createPaymentMethod(
  _prevState: PaymentMethodState,
  formData: FormData
): Promise<PaymentMethodState> {
  const parsed = parse(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").insert(parsed.data);

  if (error) return { error: `No se pudo crear: ${error.message}` };

  revalidatePath("/admin/pagos");
  return { error: null, ok: true };
}

export async function deletePaymentMethod(id: string) {
  const supabase = await createClient();
  await supabase.from("payment_methods").delete().eq("id", id);
  revalidatePath("/admin/pagos");
}
