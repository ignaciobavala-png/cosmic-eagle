"use server";

import { createClient } from "@/lib/supabase/server";

export type NewsletterState = { ok: boolean; message: string } | null;

// Misma forma que el CHECK de la tabla: si pasa aca, pasa en Postgres.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Alta en el "Sintoniza" del footer. No requiere sesion: la policy
 * newsletter_subscribers_insert_public deja escribir a `anon`, y los grants
 * limitan el insert a la columna `email`.
 *
 * Un mail repetido responde igual que uno nuevo: la lista de suscriptores no
 * es publica, asi que el formulario no deberia servir para averiguar quien
 * esta suscripto.
 */
export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!EMAIL_RE.test(email) || email.length > 320) {
    return { ok: false, message: "Revisa el correo, no parece válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email });

  // 23505 = unique_violation: ya estaba suscripto.
  if (error && error.code !== "23505") {
    return { ok: false, message: "No pudimos registrarte. Prueba de nuevo." };
  }

  return { ok: true, message: "Listo, te vamos a escribir." };
}
