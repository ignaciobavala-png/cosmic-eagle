"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  redeemMessage,
  type RedeemResult,
} from "@/lib/content-access";

export type RedeemState = { message: string | null; ok: boolean };

/**
 * Canjear un codigo. La validacion entera vive en `public.redeem_access_code`,
 * que corre como definer: acá no se lee `access_codes` ni se escribe
 * `content_grants` —quien canjea no tiene permiso para ninguna de las dos, y
 * eso es lo que impide que alguien se auto-habilite desde el browser.
 */
export async function redeemAccessCode(
  _state: RedeemState,
  formData: FormData
): Promise<RedeemState> {
  const code = formData.get("code");

  if (typeof code !== "string" || !code.trim()) {
    return { message: "Escribí el código.", ok: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_access_code", {
    p_code: code.trim(),
  });

  if (error) {
    return { message: "No se pudo canjear el código. Probá de nuevo.", ok: false };
  }

  const result = (data ?? "invalido") as RedeemResult;

  if (result === "ok") {
    // El muro y los candados se dibujan en el server: sin esto, la persona
    // canjea y sigue viendo la biblioteca cerrada hasta recargar de más.
    revalidatePath("/contenidos", "layout");
  }

  return { message: redeemMessage(result), ok: result === "ok" };
}
