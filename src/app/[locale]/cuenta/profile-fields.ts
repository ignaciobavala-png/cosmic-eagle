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
