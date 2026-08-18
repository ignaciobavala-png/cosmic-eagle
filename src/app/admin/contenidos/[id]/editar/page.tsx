import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ArticleForm } from "../../ArticleForm";
import { updateArticle } from "../../actions";

export default async function EditarContenidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (!article) notFound();

  return (
    <div>
      <Link
        href="/admin/contenidos"
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Contenidos
      </Link>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-primary-fixed-dim">
          Editar contenido
        </h1>
        {article.status === "published" && (
          <Link
            href={`/contenidos/${article.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-secondary hover:underline"
          >
            Ver en el sitio
            <ExternalLink size={14} />
          </Link>
        )}
      </div>
      <ArticleForm article={article} action={updateArticle.bind(null, id)} />
    </div>
  );
}
