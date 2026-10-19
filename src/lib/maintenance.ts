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
 * Apagarlo: el botón "Salida oficial" del dashboard (`/admin`), que escribe
 * `site_content.site_launched = "true"` y no requiere redeploy ni tocar Vercel.
 * Con `MAINTENANCE_MODE` fuera de `on` también queda abierto, como antes.
 */

const DOMINIOS = new Set([
  "cosmiceaglejourney.com",
  "www.cosmiceaglejourney.com",
]);

const SIEMPRE_ABIERTO = /^\/(admin|api|auth|mantenimiento)(\/|$)/;

const PREVIEW_COOKIE = "ce_preview";

/** La fila de `site_content` que escribe el botón del dashboard. */
export const LAUNCH_KEY = "site_launched";

// El proxy corre en cada request: no se puede ir a la base en todos. Cada
// instancia recuerda la respuesta unos segundos, así que el botón tarda como
// mucho este tiempo en verse en el dominio.
const LAUNCH_TTL_MS = 10_000;
let launchCache: { at: number; launched: boolean } | null = null;

async function isLaunched(): Promise<boolean> {
  const now = Date.now();
  if (launchCache && now - launchCache.at < LAUNCH_TTL_MS) return launchCache.launched;

  try {
    // PostgREST directo con la anon key (la fila es de lectura pública): el
    // cliente de @supabase/ssr no tiene nada que hacer en este camino caliente.
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_content?select=value&key=eq.${LAUNCH_KEY}`,
      {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      }
    );
    if (!res.ok) throw new Error(String(res.status));
    const rows = (await res.json()) as { value: string }[];
    const launched = rows[0]?.value === "true";
    launchCache = { at: now, launched };
    return launched;
  } catch {
    // Si la base no contesta se conserva lo último que se supo; sin dato, la
    // pantalla de mantenimiento: es el lado seguro de equivocarse.
    return launchCache?.launched ?? false;
  }
}

/** ¿El dominio propio muestra la pantalla de "en construcción"? */
export async function isMaintenanceActive(): Promise<boolean> {
  if (process.env.MAINTENANCE_MODE !== "on") return false;
  return !(await isLaunched());
}

/** `null` = seguir con el proxy normal; si no, la respuesta a devolver. */
export async function maintenanceResponse(
  request: NextRequest
): Promise<NextResponse | null> {
  if (process.env.MAINTENANCE_MODE !== "on") return null;

  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (!DOMINIOS.has(host)) return null;

  const { pathname, searchParams } = request.nextUrl;
  if (SIEMPRE_ABIERTO.test(pathname)) return null;

  if (await isLaunched()) return null;

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
