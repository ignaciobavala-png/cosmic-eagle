import type { SupabaseClient } from "@supabase/supabase-js";
import { buildContacts } from "@/lib/crm";
import type { Database } from "@/lib/supabase/types";

/**
 * Lee todo lo que el CRM necesita y arma los contactos. Lo comparten la página
 * y el envío de correos segmentados, para que el público de un envío se calcule
 * en el servidor con la misma regla que ve la tabla.
 *
 * Va con la sesión del admin (la RLS de estas tablas ya lo deja leer todo).
 */
export async function loadContacts(supabase: SupabaseClient<Database>) {
  const [{ data: profiles }, { data: applications }, { data: healthForms }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, is_admin, created_at, country, gender")
        .order("created_at", { ascending: false }),
      supabase
        .from("applications")
        .select("user_id, trip_id, residence_country, status, previous_ceremonies, created_at"),
      supabase
        .from("health_form_first_time")
        .select("country, created_at, applications(user_id)"),
    ]);

  return buildContacts({
    profiles: profiles ?? [],
    applications: applications ?? [],
    // El pais cuelga del formulario extenso; se aplana el join acá para que
    // `buildContacts` no dependa de la forma que devuelve PostgREST.
    healthForms: (healthForms ?? []).flatMap((h) =>
      h.applications
        ? [
            {
              user_id: h.applications.user_id,
              country: h.country,
              created_at: h.created_at,
            },
          ]
        : []
    ),
  });
}
