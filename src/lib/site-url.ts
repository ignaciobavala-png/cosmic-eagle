import { headers } from "next/headers";

/**
 * Origen absoluto del sitio, para armar los links que Supabase mete adentro de
 * los mails de auth (recuperar clave, confirmar cuenta).
 *
 * No se puede hardcodear: el mismo codigo corre en localhost, en los previews de
 * Vercel y en produccion, y el link tiene que volver al lugar de donde salio.
 * Por eso se deduce del request, con `NEXT_PUBLIC_SITE_URL` como override.
 *
 * OJO: la URL que se le pasa a Supabase como `redirectTo` tiene que estar en la
 * lista blanca del dashboard (Authentication -> URL Configuration -> Redirect
 * URLs) o Supabase la ignora y manda al Site URL. Ver docs/AUTH_EMAIL.md.
 */
export async function getSiteUrl(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const h = await headers();
  // x-forwarded-* es lo que llega detras del proxy de Vercel.
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "http://localhost:3000";

  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return `${proto}://${host}`;
}
