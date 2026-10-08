import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleBody } from "@/components/ui/ArticleBody";
import { ArticleAudio } from "@/components/ui/ArticleAudio";
import { CreamSection } from "@/components/ui/CreamSection";
import { createClient } from "@/lib/supabase/server";
import { localizeRow } from "@/lib/localized";
import { parseArticleBody } from "@/lib/article";

/**
 * Un contenido abierto por link (pedido de la organización, 08/10): el admin lo
 * comparte desde `/admin/contenidos` y quien recibe el link lo lee entero, sin
 * cuenta, aunque sea de `programa` o esté en borrador.
 *
 * La lectura es la función `shared_article(token)` (`security definer`): quien
 * abre el link no puede leer ni `article_shares` ni el artículo cerrado, y la
 * función devuelve sólo lo que se muestra. Un token que no existe —o que se
 * dejó de compartir— da 404.
 *
 * **Es dinámica a propósito** (el cliente `server` lee cookies): si quedara en
 * caché, "Dejar de compartir" no cortaría el link. Y **no se indexa**: el link
 * es para quien lo recibe, no para el buscador.
 */
async function getShared(token: string, locale: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("shared_article", { p_token: token });
  const row = data?.[0];
  return row ? localizeRow(row, locale, ["title", "excerpt", "body"]) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}): Promise<Metadata> {
  const { locale, token } = await params;
  const article = await getShared(token, locale);
  return {
    title: article ? `${article.title} | Cosmic Eagle` : "Cosmic Eagle",
    robots: { index: false, follow: false },
  };
}

export default async function CompartidoPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Contenidos");
  const tCat = await getTranslations("ArticleCategories");

  const article = await getShared(token, locale);
  if (!article) notFound();

  const blocks = parseArticleBody(article.body);

  return (
    <>
      <Header />
      <main className="pt-[var(--navbar-h)]">
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
            <div className="absolute inset-0 bg-gradient-to-b from-[#05125a]/60 via-transparent to-[#05125a]/45" />
          </div>
        )}

        {/* La misma lectura que `/contenidos/[slug]`, sin el menú de temas ni
            "otros contenidos": quien llega por link no necesariamente tiene
            acceso al resto de la biblioteca. */}
        <CreamSection full={false}>
          <article className="mx-auto mt-4 max-w-3xl">
            <span className="rounded-full border border-on-primary-container/40 px-3 py-1 text-label-sm uppercase text-on-primary-container">
              {tCat(article.category)}
            </span>

            <h1 className="mt-5 font-display text-display-mobile font-bold text-[#05125a] text-balance md:text-display-lg">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mt-5 text-body-lg text-[#05125a]">{article.excerpt}</p>
            )}

            <div className="mt-10 border-t border-[#f9d78f] pt-10">
              {article.audio_url && (
                <ArticleAudio
                  src={article.audio_url}
                  label={t("library.listen")}
                  className="mb-6"
                />
              )}
              <div className="max-h-[70vh] overflow-y-auto overscroll-contain rounded-2xl border border-[#f9d78f] bg-white/60 p-5 sm:p-8">
                <ArticleBody blocks={blocks} tone="light" />
              </div>
            </div>
          </article>
        </CreamSection>
      </main>
      <Footer />
    </>
  );
}
