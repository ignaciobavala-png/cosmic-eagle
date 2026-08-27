import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Cliente de lectura publica, SIN cookies.
 *
 * `createClient` (server.ts) lee `cookies()`, y eso vuelve dinamica a cualquier
 * pagina que lo use, aunque los datos sean publicos. Para el contenido que
 * cualquiera ve igual —los viajes publicados de la home— alcanza con el rol
 * `anon` y sin sesion, y asi la pagina puede prerenderizarse y revalidar por
 * tiempo (ISR) en vez de renderizarse en cada visita.
 *
 * Es el mismo patron que ya usaba `site-content.ts` para sus overrides; se
 * extrajo aca para poder compartirlo.
 *
 * **No usarlo donde importe quien es el visitante**: sin cookies no hay sesion,
 * asi que RLS lo ve siempre como `anon`.
 */
export function createPublicClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}
