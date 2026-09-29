import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { refreshSession } from "@/lib/supabase/proxy";

const handleI18nRouting = createMiddleware(routing);

/** Lo que no es sitio publico no lleva idioma: el panel y las APIs quedan igual. */
const SIN_IDIOMA = /^\/(admin|api)(\/|$)/;

/**
 * Orden: primero Supabase refresca la sesion y escribe las cookies nuevas en
 * el REQUEST; despues next-intl reescribe (`/viajes` → `/es/viajes`) copiando
 * esos headers, asi los Server Components ven el token refrescado. Al final
 * las mismas cookies se copian a la RESPUESTA para el browser.
 */
export async function proxy(request: NextRequest) {
  const cookies = await refreshSession(request);

  const response = SIN_IDIOMA.test(request.nextUrl.pathname)
    ? NextResponse.next({ request })
    : handleI18nRouting(request);

  cookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  return response;
}

export const config = {
  matcher: [
    // Excluir auth/ para no pisar cookies de sesion (ej. code_verifier de PKCE).
    "/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
