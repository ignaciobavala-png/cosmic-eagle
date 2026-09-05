import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { ArticleBody } from "@/components/ui/ArticleBody";
import { CreamSection } from "@/components/ui/CreamSection";
import { createClient } from "@/lib/supabase/server";
import {
  articleCategoryLabel,
  formatArticleDate,
  parseArticleBody,
} from "@/lib/article";

async function getArticle(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("title, excerpt, body, cover_url, category, published_at")
    .eq("slug", slug)
    .maybeSingle();

  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const article = await getArticle((await params).slug);

  if (!article) return { title: "Contenido no encontrado | Cosmic Eagle" };

  return {
    title: `${article.title} | Cosmic Eagle`,
    description: article.excerpt ?? undefined,
    openGraph: article.cover_url ? { images: [article.cover_url] } : undefined,
  };
}

/**
 * Detalle publico de un contenido. Un borrador no llega hasta acá: la policy
 * `articles_select_published` lo filtra en la base, asi que la lectura vuelve
 * vacia y la pagina hace 404 — igual que un slug que no existe.
 */
export default async function ContenidoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const article = await getArticle((await params).slug);

  if (!article) notFound();

  const blocks = parseArticleBody(article.body);
  const date = formatArticleDate(article.published_at);

  return (
    <>
      <Header />
      <main className="pt-18 md:pt-24">
        {article.cover_url && (
          <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9] md:aspect-[21/9]">
            <Image
              src={article.cover_url}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[#05102a]/35" />
            {/* El pie se funde con la crema de abajo, no con el negro del
                sistema anterior. */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#05125a]/60 via-transparent to-[#05125a]/45" />
          </div>
        )}

        {/* El artículo se lee sobre crema, como el resto de los bloques de
            texto largo del sitio. El fondo oscuro del `body` era el chrome del
            sistema anterior y acá, con una lectura de varios minutos, es
            justamente donde peor se sostiene. */}
        <CreamSection full={false}>
          <article className="mx-auto max-w-3xl">
            <Link
              href="/contenidos"
              className="inline-flex items-center gap-2 text-label-sm uppercase text-on-primary-container transition-colors hover:text-[#05125a]"
            >
              <ArrowLeft size={15} />
              Contenidos
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-on-primary-container/40 px-3 py-1 text-label-sm uppercase text-on-primary-container">
                {articleCategoryLabel(article.category)}
              </span>
              {date && (
                <span className="text-label-sm uppercase text-on-primary-container">
                  {date}
                </span>
              )}
            </div>

            <h1 className="mt-5 font-display text-display-mobile font-bold text-[#05125a] text-balance md:text-display-lg">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mt-5 text-body-lg text-[#333]">{article.excerpt}</p>
            )}

            <div className="mt-10 border-t border-[#f9d78f] pt-10">
              <ArticleBody blocks={blocks} tone="light" />
            </div>
          </article>
        </CreamSection>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
