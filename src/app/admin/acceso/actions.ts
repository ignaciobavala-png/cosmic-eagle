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
    return { error: "Elige qué nivel habilita el código." };
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

/**
 * Habilitar a mano. Es la **excepcion**, no el camino normal: lo normal es que
 * la aprobacion de la solicitud habilite sola (trigger
 * `private.grant_content_on_approval`). Existe para dos casos — alguien que
 * ceremonio por fuera de la plataforma, y alguien a quien le sacaron el acceso
 * y se lo quieren devolver.
 *
 * No pide nivel ni nota: los dos los sabe el sistema. El nivel es `programa`,
 * que es el unico que se habilita, y de que solicitud sale queda en
 * `application_id`.
 */
export async function grantProgramAccess(
  userId: string,
  applicationId: string | null
) {
  const supabase = await createClient();

  // Si ya hay una fila para esta solicitud (revocada), se reactiva en vez de
  // insertar otra: el indice unico parcial no deja dos.
  if (applicationId) {
    const { data: existing } = await supabase
      .from("content_grants")
      .select("id")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("content_grants")
        .update({ revoked_at: null })
        .eq("id", existing.id);

      revalidateAccessPaths();
      revalidatePath("/admin/solicitudes", "layout");
      return;
    }
  }

  await supabase.from("content_grants").insert({
    user_id: userId,
    level: "programa",
    application_id: applicationId,
    note: applicationId ? "Habilitada a mano" : "Habilitada a mano, sin solicitud",
  });

  revalidateAccessPaths();
  revalidatePath("/admin/solicitudes", "layout");
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
  revalidatePath("/admin/solicitudes", "layout");
}
