import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LEGAL_DOCUMENTS } from "@/lib/legal";
import { formatArticleDate } from "@/lib/article";

/**
 * Los dos documentos legales. No hay botón de "nuevo" ni de borrar a propósito:
 * la cantidad la decide el código (una ruta por documento) y la base no le da a
 * `authenticated` insert ni delete sobre esta tabla.
 */
export default async function LegalesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("legal_documents")
    .select("slug, title, is_provisional, updated_at");

  const porSlug = new Map((data ?? []).map((d) => [d.slug, d]));

  return (
    <div>
      <h1 className="font-display text-headline-lg text-primary-fixed-dim">
        Privacidad y Términos
      </h1>
      <p className="mt-3 max-w-2xl text-body-md text-on-surface/80">
        Los dos documentos legales del sitio. Salen publicados con un texto
        preliminar que escribimos nosotros: hay que revisarlo y completar los
        datos que faltan, que están marcados entre corchetes.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {LEGAL_DOCUMENTS.map((doc) => {
          const fila = porSlug.get(doc.slug);

          return (
            <Link
              key={doc.slug}
              href={`/admin/legales/${doc.slug}`}
              className="glass-card rounded-2xl px-6 py-5 transition-colors hover:border-primary-fixed-dim/60"
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <h2 className="font-display text-body-lg text-primary-container">
                  {fila?.title ?? doc.label}
                </h2>
                <code className="text-label-sm text-on-surface/60">
                  {doc.href}
                </code>
                {fila?.is_provisional && (
                  <span className="rounded-full border border-primary-fixed-dim/50 px-3 py-1 text-label-sm uppercase tracking-wider text-primary-fixed-dim">
                    Preliminar
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-2xl text-body-md text-on-surface/75">
                {doc.descripcion}
              </p>
              {fila && (
                <p className="mt-3 text-label-sm uppercase tracking-wider text-on-surface/50">
                  Actualizado el {formatArticleDate(fila.updated_at)}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
