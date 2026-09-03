import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente con la **service role key**: saltea la RLS por completo.
 *
 * Existe por un solo motivo y tiene un solo consumidor: el cron de correos
 * programados (`/api/cron/emails`). Ese proceso corre **sin usuario** —no hay
 * sesion que leer ni cookie que mandar— y necesita ver las solicitudes de todo
 * el mundo para saber a quien le toca un recordatorio. Con `anon` no ve nada
 * (la RLS de `applications` es admin o dueño), y no hay forma de "loguear" a un
 * cron sin dejarle credenciales de una persona.
 *
 * **Reglas para no convertir esto en un agujero:**
 *
 * 1. `import "server-only"`: si algun dia alguien lo importa desde un componente
 *    de cliente, el build falla en vez de filtrar la llave al bundle.
 * 2. La variable **no lleva `NEXT_PUBLIC_`**. Nunca. Con ese prefijo, Next la
 *    inlinea en el JavaScript que se descarga el visitante.
 * 3. **Ningun otro archivo importa esto.** Toda la app —panel de admin incluido—
 *    trabaja con la sesion del usuario y su RLS, que es lo que hace que un bug
 *    de policy se note. Si aparece un segundo consumidor, hay que justificar por
 *    que no puede usar `createClient` de server.ts.
 * 4. La ruta que lo usa exige `CRON_SECRET`, sin excepcion.
 *
 * Lazy a proposito, igual que el cliente de Resend: instanciarlo a nivel de
 * modulo corre durante el build de Vercel y, si la variable todavia no esta
 * cargada, se cae el deploy entero en vez de fallar solo esta ruta.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
