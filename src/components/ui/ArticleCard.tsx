import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { articleCategoryLabel, formatArticleDate } from "@/lib/article";

export type ArticleCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  category: string;
  published_at: string | null;
};

/**
 * Tarjeta de contenido. Misma anatomia que `TripCard` (portada 16:9, badge
 * superpuesto, titulo serif, pie con fecha y accion) para que el listado de
 * /contenidos se lea como parte del mismo sistema y no como otra web.
 *
 * La portada va en 16:9 y no en 4:3 como la del viaje: acá es una sola imagen,
 * la misma que encabeza el articulo, y no hace falta que sobreviva a dos
 * recortes distintos.
 *
 * **Vive sobre crema** (05/09/2026): la tarjeta es blanca con filete dorado,
 * como las fichas del detalle de una experiencia. Antes era `glass-card`, que
 * es vidrio dorado pensado para el fondo oscuro del sistema anterior y sobre
 * crema no se ve.
 */
export function ArticleCard({ article }: { article: ArticleCardData }) {
  const date = formatArticleDate(article.published_at);

  return (
    <Link
      href={`/contenidos/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#f9d78f] bg-white/70 transition-colors duration-300 hover:border-on-primary-container/50"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#05125a]">
        {article.cover_url ? (
          <Image
            src={article.cover_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          // Sin portada no se inventa una imagen: queda un panel del sistema,
          // que es mejor que una foto de stock que no dice nada del texto.
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a2a52] to-[#05060a]" />
        )}
        <div className="absolute inset-0 bg-[#05102a]/20" />
        {/* La etiqueta va sobre la foto: opaca, no translucida. */}
        <span className="absolute left-4 top-4 rounded-full bg-[#f9d78f] px-3 py-1 text-label-sm uppercase text-[#05125a]">
          {articleCategoryLabel(article.category)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-headline-md font-bold text-[#05125a]">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="mt-3 line-clamp-4 text-body-md text-[#333]">
            {article.excerpt}
          </p>
        )}

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-[#f9d78f]/70 pt-4">
          <div>
            {/* El oro de acento no sirve como texto chico sobre fondo claro
                (2,66:1): va `on-primary-container`, que es el rol del sistema
                para eso. Regla del 28/08. */}
            <span className="block text-label-sm uppercase text-on-primary-container">
              Publicado
            </span>
            <span className="mt-1 block text-body-md text-[#05125a]">
              {date ?? "—"}
            </span>
          </div>
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-on-primary-container/40 text-on-primary-container transition-colors group-hover:bg-[#f9d78f] group-hover:text-[#05125a]"
          >
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>
    </Link>
  );
}
