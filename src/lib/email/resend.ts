import "server-only";
import { Resend } from "resend";

/**
 * Cliente de Resend, para los mails que dispara la app (aprobacion de una
 * solicitud, avisos del admin).
 *
 * **No cubre los mails de auth** — recuperar contraseña, confirmar mail — que los
 * manda Supabase por su cuenta. Esos se arreglan cargando el SMTP de Resend en el
 * dashboard de Supabase, no desde acá. Ver `docs/AUTH_EMAIL.md`.
 */

/**
 * Lazy init a proposito. `new Resend(...)` a nivel de modulo corre durante el
 * "Collect Page Data" del build de Vercel: si la env var todavia no esta cargada,
 * **se cae el build entero**, no solo el envio de mails. Instanciandolo recien al
 * usarse, un mail sin configurar falla como mail, no como deploy.
 */
let client: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

/**
 * Remitente. Va contra un subdominio (`mail.`) y no contra el dominio raiz para
 * aislar la reputacion de envio del correo humano de Google Workspace, que usa
 * el MX del dominio. Hasta verificar el dominio en Resend queda el sandbox, que
 * **solo entrega a la casilla dueña de la cuenta de Resend**.
 */
const FROM = process.env.RESEND_FROM ?? "Cosmic Eagle <onboarding@resend.dev>";

/**
 * Resend no tiene bandeja de entrada: sin `reply_to`, una respuesta se pierde en
 * el vacio. Apunta a la casilla real de Workspace.
 */
const REPLY_TO = process.env.RESEND_REPLY_TO ?? "contacto@cosmiceaglejourney.com";

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; reason: "not_configured" | "failed"; error?: string };

/**
 * Manda un mail y **nunca lanza**.
 *
 * Devuelve el resultado en vez de tirar excepcion porque quien llama siempre es
 * una accion cuyo objetivo principal es otro (aprobar una solicitud, por ejemplo):
 * si el mail no sale, la aprobacion tiene que quedar hecha igual. El llamador
 * decide si avisa del fallo.
 */
export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactNode;
}): Promise<SendResult> {
  const resend = getResend();

  // Sin API key no es un error: es el estado normal en local y en cualquier
  // entorno donde todavia no se cargo la variable.
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY sin configurar, no se envió: "${subject}"`);
    return { ok: false, reason: "not_configured" };
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    replyTo: REPLY_TO,
    subject,
    react,
  });

  if (error || !data) {
    // El detalle del error importa: distingue cuota agotada de dominio sin
    // verificar de payload invalido, y los logs de Vercel se vencen a las 24hs.
    console.error(`[email] falló "${subject}": ${error?.name} — ${error?.message}`);
    return { ok: false, reason: "failed", error: error?.message };
  }

  return { ok: true, id: data.id };
}
