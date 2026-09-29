import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArticleForm } from "../ArticleForm";
import { createArticle } from "../actions";

export default function NuevoContenidoPage() {
  return (
    <div>
      <Link
        href="/admin/contenidos"
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Contenidos
      </Link>
      <h1 className="font-display text-3xl text-primary-fixed-dim mb-8">
        Nuevo contenido
      </h1>
      <ArticleForm action={createArticle} />
    </div>
  );
}
