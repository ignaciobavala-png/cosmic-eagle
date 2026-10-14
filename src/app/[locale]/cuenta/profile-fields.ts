/**
 * Las respuestas posibles de "¿Cómo llegaste a nosotros?". El valor se guarda
 * tal cual en `profiles.referral_source`; la etiqueta sale de
 * `Cuenta.profile.referral.<valor>`. Vive fuera de `actions.ts` porque un
 * archivo `"use server"` sólo puede exportar funciones async.
 */
export const REFERRAL_SOURCES = [
  "referido",
  "instagram",
  "redes",
  "busqueda",
  "otro",
] as const;

export type ReferralSource = (typeof REFERRAL_SOURCES)[number];

/**
 * Género, para segmentar los correos del CRM. El valor se guarda en
 * `profiles.gender` (hay un CHECK con la misma lista); la etiqueta sale de
 * `Cuenta.profile.genders.<valor>` y, en el panel, de `GENDER_LABELS`.
 */
export const GENDERS = ["mujer", "hombre", "no_binario", "prefiero_no_decir"] as const;

export type Gender = (typeof GENDERS)[number];
