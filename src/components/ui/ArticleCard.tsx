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
 */
export function ArticleCard({ article }: { article: ArticleCardData }) {
  const date = formatArticleDate(article.published_at);

  return (
    <Link
      href={`/contenidos/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl glass-card transition-colors duration-300 hover:border-primary-fixed-dim/35"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-container-lowest">
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
        <span className="absolute left-4 top-4 rounded-full bg-primary-container/90 px-3 py-1 text-label-sm uppercase text-on-primary backdrop-blur-md">
          {articleCategoryLabel(article.category)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-headline-md text-on-surface">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="mt-3 text-body-md text-on-surface-variant line-clamp-4">
            {article.excerpt}
          </p>
        )}

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-primary-fixed-dim/12 pt-4">
          <div>
            <span className="block text-label-sm uppercase text-on-surface-variant/60">
              Publicado
            </span>
            <span className="mt-1 block text-body-md text-on-surface">
              {date ?? "—"}
            </span>
          </div>
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary-fixed-dim/35 text-primary-fixed-dim transition-colors group-hover:bg-primary-container group-hover:text-on-primary"
          >
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>
    </Link>
  );
}
