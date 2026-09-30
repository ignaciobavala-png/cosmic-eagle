import { NextResponse, type NextRequest } from "next/server";

/**
 * El modo "en construcción" del dominio propio (30/09/2026).
 *
 * Con `MAINTENANCE_MODE=on` en Vercel, lo público de cosmiceaglejourney.com
 * muestra `/mantenimiento`. Todo lo demás sigue igual:
 *
 * - `cosmic-eagle.vercel.app` (y localhost) no se tocan: ahí se prueba.
 * - `/admin`, `/api` (el cron de correos) y `/auth` (el canje de links de
 *   Supabase) pasan siempre.
 * - Quien entra una vez con `?preview=<MAINTENANCE_BYPASS>` recibe una cookie y
 *   ve el sitio entero en el dominio: hace falta para probar los links de los
 *   correos, que apuntan a `NEXT_PUBLIC_SITE_URL`.
 *
 * Apagarlo es sacar la variable y redeployar: no hay que tocar código.
 */

const DOMINIOS = new Set([
  "cosmiceaglejourney.com",
  "www.cosmiceaglejourney.com",
]);

const SIEMPRE_ABIERTO = /^\/(admin|api|auth|mantenimiento)(\/|$)/;

const PREVIEW_COOKIE = "ce_preview";

/** `null` = seguir con el proxy normal; si no, la respuesta a devolver. */
export function maintenanceResponse(request: NextRequest): NextResponse | null {
  if (process.env.MAINTENANCE_MODE !== "on") return null;

  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (!DOMINIOS.has(host)) return null;

  const { pathname, searchParams } = request.nextUrl;
  if (SIEMPRE_ABIERTO.test(pathname)) return null;

  const token = process.env.MAINTENANCE_BYPASS;

  if (token) {
    // Entrada con el token: se deja la cookie y se limpia la URL, para que el
    // token no quede en el historial ni se comparta copiando la barra.
    if (searchParams.get("preview") === token) {
      const clean = request.nextUrl.clone();
      clean.searchParams.delete("preview");
      const response = NextResponse.redirect(clean);
      response.cookies.set(PREVIEW_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    if (request.cookies.get(PREVIEW_COOKIE)?.value === token) return null;
  }

  const response = NextResponse.rewrite(new URL("/mantenimiento", request.url));
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}
