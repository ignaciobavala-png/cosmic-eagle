import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refresca la sesion y devuelve si hay usuario y las cookies que hay que mandarle al browser.
 * No arma la respuesta: la arma `proxy.ts`, que puede ser un rewrite de
 * next-intl. Las cookies nuevas se escriben tambien en `request.cookies`, que
 * actualiza el header `cookie` que next-intl copia al reescribir.
 */
export async function refreshSession(
  request: NextRequest
): Promise<{ cookies: CookieToSet[]; signedIn: boolean }> {
  let pending: CookieToSet[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          pending = cookiesToSet;
        },
      },
    }
  );

  // Refresca la sesion (getUser valida el JWT contra Supabase, getSession no).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { cookies: pending, signedIn: Boolean(user) };
}
