"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isContentAccessLevel } from "@/lib/content-access";

export type AccessFormState = { error: string | null; ok?: string };

/**
 * La biblioteca es ISR: sin este revalidate, habilitar a alguien no se nota
 * hasta que caduque la pagina. Se invalidan las dos rutas publicas de
 * contenidos mas el panel.
 */
function revalidateAccessPaths() {
  revalidatePath("/contenidos");
  revalidatePath("/admin/acceso");
}

/**
 * El codigo se normaliza igual que en el trigger (mayusculas, sin espacios).
 * El CHECK de la tabla exige 4 a 32 caracteres de [A-Z0-9-], asi que el aviso
 * se da acá y no como error crudo de Postgres.
 */
export async function createAccessCode(
  _state: AccessFormState,
  formData: FormData
): Promise<AccessFormState> {
  const raw = formData.get("code");
  const label = formData.get("label");
  const tripId = formData.get("trip_id");
  const level = formData.get("level");
  const maxUses = formData.get("max_uses");
  const expiresAt = formData.get("expires_at");

  const code =
    typeof raw === "string" ? raw.trim().toUpperCase().replace(/\s+/g, "-") : "";

  if (!/^[A-Z0-9][A-Z0-9-]{3,31}$/.test(code)) {
    return {
      error:
        "El código va de 4 a 32 caracteres, con letras, números y guiones. Sin acentos ni espacios.",
    };
  }

  if (!isContentAccessLevel(level) || level === "publico") {
    return { error: "Elegí qué nivel habilita el código." };
  }

  const parsedUses = Number(maxUses);

  const supabase = await createClient();
  const { error } = await supabase.from("access_codes").insert({
    code,
    level,
    label: typeof label === "string" && label.trim() ? label.trim() : null,
    trip_id: typeof tripId === "string" && tripId ? tripId : null,
    // Vacío = sin tope. Un 0 escrito por error no puede quedar como "cero usos":
    // el CHECK lo rechazaría, así que se trata como sin tope.
    max_uses: Number.isFinite(parsedUses) && parsedUses > 0 ? parsedUses : null,
    expires_at:
      typeof expiresAt === "string" && expiresAt
        ? new Date(expiresAt).toISOString()
        : null,
  });

  if (error) {
    if (error.message.includes("access_codes_code_key")) {
      return { error: "Ya existe un código con ese texto." };
    }
    return { error: `No se pudo crear el código: ${error.message}` };
  }

  revalidateAccessPaths();
  return { error: null, ok: `Código ${code} creado.` };
}

/**
 * Desactivar no borra: las habilitaciones que ya salieron de ese código siguen
 * en pie y se revocan una por una. Es a propósito — apagar el código corta la
 * entrada de gente nueva, no le saca la biblioteca a quien ya la tenía.
 */
export async function setAccessCodeActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("access_codes").update({ is_active: isActive }).eq("id", id);
  revalidateAccessPaths();
}

/** Habilitación a mano, desde la solicitud o desde esta sección. */
export async function grantContentAccess(
  _state: AccessFormState,
  formData: FormData
): Promise<AccessFormState> {
  const userId = formData.get("user_id");
  const level = formData.get("level");
  const note = formData.get("note");

  if (typeof userId !== "string" || !userId) {
    return { error: "Falta la persona a habilitar." };
  }

  if (!isContentAccessLevel(level) || level === "publico") {
    return { error: "Elegí el nivel." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("content_grants").insert({
    user_id: userId,
    level,
    note: typeof note === "string" && note.trim() ? note.trim() : null,
  });

  if (error) return { error: `No se pudo habilitar: ${error.message}` };

  revalidateAccessPaths();
  revalidatePath("/admin/solicitudes");
  return { error: null, ok: "Habilitada." };
}

/**
 * Se marca `revoked_at` en vez de borrar la fila: quién habilitó a quién y
 * cuándo es justamente lo que hay que poder mirar después.
 */
export async function revokeContentGrant(id: string) {
  const supabase = await createClient();
  await supabase
    .from("content_grants")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);

  revalidateAccessPaths();
  revalidatePath("/admin/solicitudes");
}
