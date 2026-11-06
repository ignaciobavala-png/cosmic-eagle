"use server";

import { revalidatePath } from "next/cache";
import { render } from "react-email";
import { createClient } from "@/lib/supabase/server";
import { PREVIEWS } from "@/lib/email/previews";
import { getTemplateDef, unknownVars } from "@/lib/email/templates";

export type SaveCopyState = { ok: boolean; message: string };

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

/**
 * Guarda los textos de un correo. Sólo quedan filas de lo que difiere del
 * original: un campo vacío o igual al de fábrica borra su fila y el correo
 * vuelve al texto del código.
 */
export async function saveEmailCopy(
  templateKey: string,
  values: Record<string, string>
): Promise<SaveCopyState> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "No tienes permiso para hacer esto." };

  const def = getTemplateDef(templateKey);
  if (!def) return { ok: false, message: "Ese correo no existe." };

  const upserts: {
    template_key: string;
    field_key: string;
    value: string;
    updated_by: string;
    updated_at: string;
  }[] = [];
  const reset: string[] = [];

  for (const field of def.fields) {
    const value = (values[field.key] ?? "").replace(/\r\n/g, "\n").trim();
    if (!value || value === field.default.trim()) {
      reset.push(field.key);
      continue;
    }
    if (value.length > 4000) {
      return { ok: false, message: `«${field.label}» es demasiado largo.` };
    }
    const bad = unknownVars(def, value);
    if (bad.length > 0) {
      return {
        ok: false,
        message: `«${field.label}» usa ${bad.map((v) => `{${v}}`).join(", ")}, que no existe en este correo.`,
      };
    }
    upserts.push({
      template_key: def.key,
      field_key: field.key,
      value,
      updated_by: admin.userId,
      updated_at: new Date().toISOString(),
    });
  }

  if (upserts.length > 0) {
    const { error } = await admin.supabase.from("email_templates").upsert(upserts);
    if (error) {
      console.error(`[correos] no se pudo guardar ${def.key}: ${error.message}`);
      return { ok: false, message: "No se pudo guardar. Inténtalo de nuevo." };
    }
  }
  if (reset.length > 0) {
    const { error } = await admin.supabase
      .from("email_templates")
      .delete()
      .eq("template_key", def.key)
      .in("field_key", reset);
    if (error) {
      console.error(`[correos] no se pudo restaurar ${def.key}: ${error.message}`);
      return { ok: false, message: "No se pudo guardar. Inténtalo de nuevo." };
    }
  }

  revalidatePath("/admin/correos");
  return { ok: true, message: "Guardado. El próximo correo ya sale con estos textos." };
}

/** HTML del correo de ejemplo con los textos que se están escribiendo (sin guardar). */
export async function renderEmailPreview(
  previewKey: string,
  draft: Record<string, string>
): Promise<string> {
  const admin = await requireAdmin();
  if (!admin) return "<p>Sin permiso.</p>";
  const preview = PREVIEWS[previewKey];
  if (!preview) return "<p>No hay una vista previa para este correo.</p>";
  return render(preview.el(draft));
}
