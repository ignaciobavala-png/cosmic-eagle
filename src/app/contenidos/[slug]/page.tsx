import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { ArticleBody } from "@/components/ui/ArticleBody";
import { CreamSection } from "@/components/ui/CreamSection";
import { createClient } from "@/lib/supabase/server";
import { AccessCodeForm } from "@/components/ui/AccessCodeForm";
import { CONTENT_WALL_COPY } from "@/lib/content-access";
import {
  articleCategoryLabel,
  formatArticleDate,
  parseArticleBody,
} from "@/lib/article";

/**
 * La portada del articulo, que es publica para todos: titulo, bajada, categoria
 * e imagen. Sale de la vista `articles_public`, que no expone el cuerpo.
 *
 * Existe separada de `getArticle` porque un texto cerrado **tiene pagina igual**:
 * muestra el muro con el copy de la clienta y el canje del codigo. Devolver 404
 * dejaria a la persona sin saber que ese contenido existe ni como pedirlo, y
 * ademas sacaria del buscador la ficha, que si es publica.
 */
async function getTeaser(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles_public")
    .select("title, excerpt, cover_url, category, published_at, access_level")
    .eq("slug", slug)
    .maybeSingle();

  return data;
}

/**
 * El cuerpo. Vuelve `null` cuando la policy no deja pasar la fila: o el
 * articulo no existe, o esta en borrador, o pide un nivel que quien mira no
 * alcanza. **El texto nunca llega al browser en ese caso** — no se filtra acá,
 * no sale de la base.
 */
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
  // La ficha (no el cuerpo): un contenido cerrado tiene titulo y descripcion
  // publicos, y su pagina existe.
  const teaser = await getTeaser((await params).slug);

  if (!teaser) return { title: "Contenido no encontrado | Cosmic Eagle" };

  return {
    title: `${teaser.title} | Cosmic Eagle`,
    description: teaser.excerpt ?? undefined,
    openGraph: teaser.cover_url ? { images: [teaser.cover_url] } : undefined,
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
  const { slug } = await params;
  const [teaser, article] = await Promise.all([
    getTeaser(slug),
    getArticle(slug),
  ]);

  // Sin ficha publica no hay contenido: ni existe ni esta publicado.
  if (!teaser) notFound();

  // Hay ficha pero no cuerpo: el texto pide un nivel que esta persona no
  // alcanza. La pagina se dibuja igual, con el muro en lugar del texto.
  const locked = !article;

  const blocks = article ? parseArticleBody(article.body) : [];
  const date = formatArticleDate(teaser.published_at);

  return (
    <>
      <Header />
      <main className="pt-[var(--navbar-h)]">
        {teaser.cover_url && (
          <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9] md:aspect-[21/9]">
            <Image
              src={teaser.cover_url}
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
                {articleCategoryLabel(teaser.category!)}
              </span>
              {date && (
                <span className="text-label-sm uppercase text-on-primary-container">
                  {date}
                </span>
              )}
            </div>

            <h1 className="mt-5 font-display text-display-mobile font-bold text-[#05125a] text-balance md:text-display-lg">
              {teaser.title}
            </h1>

            {teaser.excerpt && (
              <p className="mt-5 text-body-lg text-[#333]">{teaser.excerpt}</p>
            )}

            <div className="mt-10 border-t border-[#f9d78f] pt-10">
              {locked ? (
                <div className="rounded-2xl border border-[#f9d78f] bg-[#fff6eb] px-6 py-8 text-center sm:px-10">
                  <Lock
                    size={22}
                    aria-hidden="true"
                    className="mx-auto text-on-primary-container"
                  />
                  <p className="mt-4 text-body-lg text-[#333]">
                    {CONTENT_WALL_COPY}
                  </p>
                  <AccessCodeForm tone="light" />
                  <p className="mt-6 text-body-md text-[#333]">
                    <Link
                      href="/viajes"
                      className="text-on-primary-container underline underline-offset-4"
                    >
                      Ver las próximas experiencias
                    </Link>
                  </p>
                </div>
              ) : (
                <ArticleBody blocks={blocks} tone="light" />
              )}
            </div>
          </article>
        </CreamSection>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
