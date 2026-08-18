import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { articleCategoryLabel, formatArticleDate } from "@/lib/article";
import { DeleteArticleButton } from "./DeleteArticleButton";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "border-outline text-on-surface-variant",
  published: "border-primary-fixed-dim/50 text-primary-fixed-dim",
};

/**
 * Listado de contenidos del panel. El admin ve borradores y publicados (la
 * policy `articles_select_admin` los deja pasar); el sitio publico solo ve los
 * publicados, y eso lo garantiza la base, no esta pagina.
 */
export default async function AdminContenidosPage() {
  const supabase = await createClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, slug, category, status, cover_url, published_at, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-primary-fixed-dim">
          Contenidos
        </h1>
        <Link
          href="/admin/contenidos/nuevo"
          className="bg-primary-container text-on-primary font-medium tracking-[0.05em] rounded-lg px-4 py-2.5 text-sm whitespace-nowrap hover:bg-primary-fixed transition-colors"
        >
          Nuevo contenido
        </Link>
      </div>

      <p className="mb-8 max-w-2xl text-sm text-on-surface-variant">
        Lo que cargues acá aparece en{" "}
        <Link href="/contenidos" className="text-secondary hover:underline">
          /contenidos
        </Link>
        . Mientras esté en borrador no lo ve nadie más que vos.
      </p>

      {!articles || articles.length === 0 ? (
        <p className="text-on-surface-variant">
          Todavía no hay contenidos cargados.
        </p>
      ) : (
        <div className="glass-card rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-on-surface-variant">
                <th className="px-5 py-3 font-medium">Título</th>
                <th className="px-5 py-3 font-medium">Categoría</th>
                <th className="px-5 py-3 font-medium">Publicado</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className="border-b border-outline-variant/40 last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-surface-container-lowest">
                        {article.cover_url && (
                          <Image
                            src={article.cover_url}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-on-surface font-medium">
                          {article.title}
                        </p>
                        <p className="text-on-surface-variant text-xs truncate">
                          /contenidos/{article.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {articleCategoryLabel(article.category)}
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {formatArticleDate(article.published_at) ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${
                        STATUS_CLASS[article.status] ?? ""
                      }`}
                    >
                      {STATUS_LABEL[article.status] ?? article.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/contenidos/${article.id}/editar`}
                        className="text-secondary hover:underline"
                      >
                        Editar
                      </Link>
                      <DeleteArticleButton
                        id={article.id}
                        title={article.title}
                      />
                    </div>
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
