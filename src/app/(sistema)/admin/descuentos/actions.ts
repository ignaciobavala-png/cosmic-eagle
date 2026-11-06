"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DiscountFormState = { error: string | null; ok?: boolean };

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

function text(formData: FormData, name: string) {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

/** Crea un código. La RLS sólo deja escribir a un admin; esto además da mensajes claros. */
export async function createDiscount(
  _prev: DiscountFormState,
  formData: FormData
): Promise<DiscountFormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No tienes permiso para hacer esto." };

  const code = text(formData, "code").toUpperCase().replace(/\s+/g, "");
  const kind = text(formData, "kind");
  const value = Number(text(formData, "value"));
  const userId = text(formData, "user_id") || null;
  const tripId = text(formData, "trip_id") || null;
  const maxUsesRaw = text(formData, "max_uses");
  const expires = text(formData, "expires_on") || null;
  const note = text(formData, "note") || null;

  if (code.length < 3 || code.length > 30 || !/^[A-Z0-9_-]+$/.test(code)) {
    return { error: "El código lleva de 3 a 30 letras, números o guiones." };
  }
  if (kind !== "percent" && kind !== "amount") {
    return { error: "Elige si el descuento es en porcentaje o en monto." };
  }
  if (!Number.isFinite(value) || value <= 0) {
    return { error: "El valor del descuento tiene que ser mayor que cero." };
  }
  if (kind === "percent" && value > 100) {
    return { error: "Un porcentaje no puede pasar de 100." };
  }
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
    return { error: "Los usos máximos tienen que ser un número entero desde 1." };
  }

  const { error } = await admin.supabase.from("discount_codes").insert({
    code,
    kind,
    value,
    user_id: userId,
    trip_id: tripId,
    // Un código asignado a una persona sirve una vez, salvo que se diga otra cosa.
    max_uses: maxUses ?? (userId ? 1 : null),
    expires_on: expires,
    note,
    created_by: admin.userId,
  });

  if (error) {
    if (error.code === "23505") return { error: "Ya existe un código con ese nombre." };
    console.error(`[descuentos] no se pudo crear ${code}: ${error.message}`);
    return { error: "No se pudo crear el código. Inténtalo de nuevo." };
  }

  revalidatePath("/admin/descuentos");
  return { error: null, ok: true };
}

export async function setDiscountActive(id: string, active: boolean) {
  const admin = await requireAdmin();
  if (!admin) return;
  await admin.supabase.from("discount_codes").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin/descuentos");
}

export async function deleteDiscount(id: string) {
  const admin = await requireAdmin();
  if (!admin) return;
  await admin.supabase.from("discount_codes").delete().eq("id", id);
  revalidatePath("/admin/descuentos");
}
