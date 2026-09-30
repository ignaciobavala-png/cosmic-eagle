"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { RedeemResult } from "@/lib/content-access";

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
  const t = await getTranslations("Contenidos");
  const code = formData.get("code");

  if (typeof code !== "string" || !code.trim()) {
    return { message: t("library.redeemEmpty"), ok: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_access_code", {
    p_code: code.trim(),
  });

  if (error) {
    return { message: t("library.redeemError"), ok: false };
  }

  const result = (data ?? "invalido") as RedeemResult;

  if (result === "ok") {
    // El muro y los candados se dibujan en el server: sin esto, la persona
    // canjea y sigue viendo la biblioteca cerrada hasta recargar de mas. El
    // patron `[locale]` es el route file real (la URL visible no lo lleva).
    revalidatePath("/[locale]/contenidos", "layout");
  }

  return { message: t(`library.redeem.${result}`), ok: result === "ok" };
}
