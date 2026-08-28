import { createClient } from "@/lib/supabase/server";
import { CopyEmails } from "./CopyEmails";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Suscriptores del "Sintoniza" del footer. Solo lectura: la baja y el envio de
 * campañas no estan en alcance, la lista se copia y se pega en la herramienta
 * de mailing que use la clienta.
 *
 * El SELECT lo habilita la policy newsletter_subscribers_select_admin; el
 * layout de /admin ya bloquea a los no-admin antes de llegar aca.
 */
export default async function AdminSuscriptoresPage() {
  const supabase = await createClient();
  const { data: subscribers, count } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  const emails = (subscribers ?? []).map((s) => s.email);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-primary-fixed-dim">
            Suscriptores
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {count ?? 0}{" "}
            {count === 1 ? "correo registrado" : "correos registrados"} desde el
            formulario del pie de página.
          </p>
        </div>
        {emails.length > 0 && <CopyEmails emails={emails} />}
      </div>

      {!subscribers || subscribers.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-on-surface-variant">
            Todavía no se suscribió nadie.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/40 text-xs uppercase tracking-[0.05em] text-on-surface-variant">
                <th className="px-6 py-4 font-medium">Correo</th>
                <th className="px-6 py-4 font-medium">Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id}>
                  <td className="px-6 py-3 text-on-surface">
                    {subscriber.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-on-surface-variant">
                    {formatDateTime(subscriber.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
