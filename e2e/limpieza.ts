import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Donde `auth.setup.ts` deja las cookies del admin. Vive acá y no en el setup
 * porque Playwright prohíbe que un spec importe otro archivo de test. */
export const ADMIN_STATE = path.join(__dirname, ".auth", "admin.json");

/**
 * Cliente con la `service_role`, SOLO para preparar y limpiar los tests de
 * escritura.
 *
 * Existe porque la suite corre contra la base de PRODUCCIÓN —no hay staging— y
 * el flujo del postulante crea filas que nadie puede borrar después: no hay
 * policies de DELETE sobre `applications`, `payment_proofs`,
 * `health_form_first_time` ni `admin_notifications`, y están bien así. Sin esta
 * llave, cada corrida dejaría basura permanente.
 *
 * **La key salta la RLS entera.** Sólo se usa acá, nunca en `src/`: si terminara
 * en el bundle del browser cualquiera podría leer y escribir toda la base. Vive
 * en `.env.local`, que está gitignoreado.
 */
export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local " +
        "(Supabase → Settings → API → service_role)."
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** El nombre con el que se registra el usuario de prueba. Se usa además para
 * encontrar los avisos que quedan sueltos al borrarlo. */
export const NOMBRE_DE_PRUEBA = "Viajera E2E";

/** Un correo distinto por corrida, para no chocar con el índice de una solicitud activa por viaje. */
export function emailDePrueba(): string {
  return `e2e+${Date.now()}@cosmiceaglejourney.com`;
}

/**
 * Borra todo lo que dejó una corrida.
 *
 * Alcanza con borrar el usuario de auth: `profiles` y `applications` cuelgan de
 * él con `on delete cascade`, y de `applications` cuelgan igual el formulario de
 * salud, los comprobantes, los consentimientos y los avisos del panel. Lo único
 * que no cascadea es Storage, porque los archivos no son filas.
 */
export async function borrarUsuarioDePrueba(userId: string) {
  const supabase = adminClient();

  // Storage primero: una vez borrado el usuario ya no se sabe qué prefijo mirar.
  const { data: solicitudes } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", userId);

  for (const { id } of solicitudes ?? []) {
    const { data: archivos } = await supabase.storage
      .from("comprobantes")
      .list(`${userId}/${id}`);

    const rutas = (archivos ?? []).map((a) => `${userId}/${id}/${a.name}`);
    if (rutas.length) await supabase.storage.from("comprobantes").remove(rutas);
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw new Error(`No se pudo borrar el usuario de prueba: ${error.message}`);

  // Los avisos de "no se pudo mandar el mail" NO cascadean: se guardan con
  // `application_id` nulo, así que sobreviven al borrado del postulante. Es
  // correcto para un caso real —el admin tiene que enterarse igual— pero acá
  // llenarían la campanita con una fila por corrida. Se borran por nombre.
  await supabase
    .from("admin_notifications")
    .delete()
    .like("title", `%${NOMBRE_DE_PRUEBA}%`);
}

/**
 * El id del usuario recién registrado, buscado por su correo.
 *
 * Reintenta porque la fila de `profiles` no la escribe el registro: la escribe
 * el trigger `handle_new_user` al insertarse el usuario, y esa escritura puede
 * llegar unos milisegundos después de que la pantalla ya navegó. Sin el
 * reintento el test es intermitente.
 */
export async function idPorEmail(email: string, intentos = 10): Promise<string> {
  const supabase = adminClient();

  for (let i = 0; i < intentos; i++) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (data?.id) return data.id;
    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(
    `No apareció el perfil de ${email} después de ${intentos} intentos. ` +
      "Si además la pantalla volvió al login, revisá que 'Confirm email' siga " +
      "APAGADO en Supabase → Authentication → Sign In / Providers → Email."
  );
}
