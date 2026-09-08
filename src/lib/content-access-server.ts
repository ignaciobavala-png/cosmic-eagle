import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ContentAccessLevel } from "@/lib/content-access";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * El nivel de quien esta mirando, para decidir que tarjeta va con candado.
 *
 * **Es un espejo de `private.content_level()`, no el gate.** El gate es la
 * policy `articles_select_published`: aunque esta funcion se equivoque hacia
 * arriba, el cuerpo del articulo no sale de la base. Se calcula acá en vez de
 * exponer la funcion de Postgres por RPC porque son datos que la sesion ya
 * puede leer (sus propias habilitaciones) y evita un round-trip mas.
 *
 * Ojo: la pagina que la llama queda dinamica, porque depende de la cookie de
 * sesion. /contenidos ya lo era.
 */
export async function viewerContentLevel(
  supabase: SupabaseClient
): Promise<ContentAccessLevel> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "publico";

  // Dos consultas en paralelo: el perfil (para el admin, que ve todo) y las
  // habilitaciones vigentes de esta persona.
  const [{ data: profile }, { data: grants }] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle(),
    supabase
      .from("content_grants")
      .select("level, expires_at")
      .is("revoked_at", null),
  ]);

  if (profile?.is_admin) return "programa";

  const now = Date.now();
  const vigente = (grants ?? []).some(
    (grant) =>
      grant.level === "programa" &&
      (grant.expires_at == null || new Date(grant.expires_at).getTime() > now)
  );

  return vigente ? "programa" : "miembros";
}
