import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TESTIMONIAL_PLACEMENTS } from "@/lib/testimonials";
import { DeleteTestimonialButton } from "./DeleteTestimonialButton";

/**
 * Listado del panel, agrupado por seccion. El admin ve tambien los ocultos (la
 * policy `testimonials_select_admin` los deja pasar); el sitio publico no.
 */
export default async function AdminTestimoniosPage() {
  const supabase = await createClient();
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("id, placement, quote, author_name, author_location, is_published, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-primary-fixed-dim sm:text-3xl">
          Testimonios
        </h1>
        <Link
          href="/admin/testimonios/nuevo"
          className="whitespace-nowrap rounded-lg bg-primary-container px-4 py-2.5 text-sm font-medium tracking-[0.05em] text-on-primary transition-colors hover:bg-primary-fixed"
        >
          Nuevo testimonio
        </Link>
      </div>

      <p className="mb-8 max-w-2xl text-sm text-on-surface-variant">
        Hay tres secciones de testimonios y cada una lleva sus propios textos. Si
        una sección queda sin ninguno, no se muestra en el sitio.
      </p>

      <div className="space-y-10">
        {TESTIMONIAL_PLACEMENTS.map((placement) => {
          const rows =
            testimonials?.filter((t) => t.placement === placement.value) ?? [];

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
                  Todavía no hay testimonios en esta sección.
                </p>
              ) : (
                <ul className="space-y-3">
                  {rows.map((t) => (
                    <li key={t.id} className="glass-card rounded-2xl p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-on-surface">
                            {t.author_name}
                            {t.author_location ? ` — ${t.author_location}` : ""}
                          </p>
                          <p className="mt-2 line-clamp-3 text-sm text-on-surface-variant">
                            {t.quote}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-4 text-sm">
                          {!t.is_published && (
                            <span className="rounded-full border border-outline px-3 py-1 text-xs text-on-surface-variant">
                              Oculto
                            </span>
                          )}
                          <Link
                            href={`/admin/testimonios/${t.id}/editar`}
                            className="text-secondary hover:underline"
                          >
                            Editar
                          </Link>
                          <DeleteTestimonialButton
                            id={t.id}
                            author={t.author_name}
                          />
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
