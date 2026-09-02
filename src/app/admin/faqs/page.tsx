import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FAQ_PLACEMENTS } from "@/lib/faqs";
import { DeleteFaqButton } from "./DeleteFaqButton";

/**
 * Listado del panel, agrupado por bloque. El admin ve tambien las ocultas (la
 * policy `faqs_select_admin` las deja pasar); el sitio publico no.
 */
export default async function AdminFaqsPage() {
  const supabase = await createClient();
  const { data: faqs } = await supabase
    .from("faqs")
    .select("id, placement, question, answer, is_published, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-primary-fixed-dim sm:text-3xl">
          Preguntas frecuentes
        </h1>
        <Link
          href="/admin/faqs/nuevo"
          className="whitespace-nowrap rounded-lg bg-primary-container px-4 py-2.5 text-sm font-medium tracking-[0.05em] text-on-primary transition-colors hover:bg-primary-fixed"
        >
          Nueva pregunta
        </Link>
      </div>

      <p className="mb-8 max-w-2xl text-sm text-on-surface-variant">
        Son los tres bloques de la página de preguntas frecuentes. Si un bloque
        queda sin ninguna pregunta, no se muestra en el sitio; si no hay ninguna
        en total, la página avisa que todavía no hay preguntas cargadas.
      </p>

      <div className="space-y-10">
        {FAQ_PLACEMENTS.map((placement) => {
          const rows = faqs?.filter((f) => f.placement === placement.value) ?? [];

          return (
            <section key={placement.value}>
              <h2 className="font-display text-lg text-on-surface">
                {placement.label}
              </h2>
              <p className="mb-4 text-sm text-on-surface-variant">
                {placement.where}
              </p>

              {rows.length === 0 ? (
                <p className="glass-card rounded-2xl px-5 py-4 text-sm text-on-surface-variant">
                  Todavía no hay preguntas en este bloque.
                </p>
              ) : (
                <ul className="space-y-3">
                  {rows.map((f) => (
                    <li key={f.id} className="glass-card rounded-2xl p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-on-surface">
                            {f.question}
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant">
                            {f.answer}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-4 text-sm">
                          {!f.is_published && (
                            <span className="rounded-full border border-outline px-3 py-1 text-xs text-on-surface-variant">
                              Oculta
                            </span>
                          )}
                          <Link
                            href={`/admin/faqs/${f.id}/editar`}
                            className="text-secondary hover:underline"
                          >
                            Editar
                          </Link>
                          <DeleteFaqButton id={f.id} question={f.question} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
