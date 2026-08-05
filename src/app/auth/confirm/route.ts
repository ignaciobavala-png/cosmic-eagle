import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Canjea el token de un mail de auth por una sesion.
 *
 * Es el endpoint al que apuntan las plantillas de mail de Supabase (ver
 * docs/AUTH_EMAIL.md). Se usa el flujo de `token_hash` y no el
 * `{{ .ConfirmationURL }}` que viene por defecto, porque ese ultimo depende de
 * PKCE: el `code_verifier` vive en una cookie del navegador que pidio el mail,
 * asi que si la persona abre el link desde el telefono habiendo pedido el
 * cambio en la compu, el canje falla. Con `token_hash` el link funciona desde
 * cualquier dispositivo.
 *
 * `proxy.ts` excluye /auth/ del matcher a proposito: no queremos que el refresco
 * de sesion pise las cookies que setea el verifyOtp de aca.
 */

const VALID_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next");

  // `next` llega desde una URL de un mail: solo se acepta una ruta interna, si
  // no es un open redirect servido en bandeja. "//evil.com" es protocol-relative.
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;

  // Se parte del request para conservar el origen, pero sin la query: el token
  // no tiene por que seguir viaje a la pagina siguiente ni quedar en el historial.
  const redirectTo = request.nextUrl.clone();
  redirectTo.search = "";

  function fail(reason: string) {
    redirectTo.pathname = "/cuenta";
    redirectTo.searchParams.set("error", reason);
    return NextResponse.redirect(redirectTo);
  }

  if (!tokenHash || !type || !VALID_TYPES.includes(type)) {
    return fail("enlace-invalido");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    // El caso comun no es un link falso sino uno vencido o ya usado (los de
    // recuperacion son de un solo uso).
    return fail("enlace-vencido");
  }

  // Recuperacion: la persona ya tiene sesion, pero vino a cambiar la clave.
  redirectTo.pathname = next ?? (type === "recovery" ? "/cuenta/nueva-clave" : "/cuenta");
  return NextResponse.redirect(redirectTo);
}
