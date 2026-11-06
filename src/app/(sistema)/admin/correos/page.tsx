import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EMAIL_TEMPLATES } from "@/lib/email/templates";

/**
 * Editor de correos (nov 2026): lista de los correos del embudo con cuántos
 * textos tienen cambiados. El marco, la lógica y los datos de pago siguen en
 * el código; se editan asuntos, títulos, párrafos y botones.
 */
export default async function AdminCorreosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("email_templates")
    .select("template_key, field_key");

  const edited: Record<string, number> = {};
  for (const row of data ?? []) {
    edited[row.template_key] = (edited[row.template_key] ?? 0) + 1;
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl text-primary-fixed-dim sm:text-3xl">
        Correos
      </h1>
      <p className="mb-8 max-w-2xl text-sm text-on-surface-variant">
        Los correos automáticos del embudo de inscripción. Puedes cambiar el
        asunto, el título, los párrafos y el texto de los botones; el diseño, el
        saludo y los datos de pago los pone el sistema. Si algo no te gusta,
        «Restaurar» devuelve el texto original.
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {EMAIL_TEMPLATES.map((t) => (
          <li key={t.key}>
            <Link
              href={`/admin/correos/${t.key}`}
              className="glass-card block h-full rounded-2xl p-5 transition-colors hover:border-primary-fixed-dim"
            >
              <p className="text-xs uppercase tracking-widest text-on-surface-variant/70">
                {t.code}
              </p>
              <h2 className="mt-1 font-display text-lg text-on-surface">{t.label}</h2>
              <p className="mt-2 text-sm text-on-surface-variant">{t.when}</p>
              <p className="mt-3 text-xs text-primary-fixed-dim">
                {edited[t.key]
                  ? `${edited[t.key]} ${edited[t.key] === 1 ? "texto editado" : "textos editados"}`
                  : "Con los textos originales"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
