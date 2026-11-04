import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { GuestNotice } from "@/components/ui/GuestNotice";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleBody } from "@/components/ui/ArticleBody";
import { HtmlFrame } from "@/components/ui/HtmlFrame";
import { ShareButton } from "@/components/ui/ShareButton";
import { ArticleAudio } from "@/components/ui/ArticleAudio";
import { CreamSection } from "@/components/ui/CreamSection";
import { LibraryNav } from "@/components/ui/LibraryNav";
import { createClient } from "@/lib/supabase/server";
import { localizeRow } from "@/lib/localized";
import { AccessCodeForm } from "@/components/ui/AccessCodeForm";
import { articleCover, parseArticleBody } from "@/lib/article";
import { getTranslations, setRequestLocale } from "next-intl/server";

/**
 * La portada del articulo, que es publica para todos: titulo, bajada, categoria
 * e imagen. Sale de la vista `articles_public`, que no expone el cuerpo.
 *
 * Existe separada de `getArticle` porque un texto cerrado **tiene pagina igual**:
 * muestra el muro con el copy de la clienta y el canje del codigo. Devolver 404
 * dejaria a la persona sin saber que ese contenido existe ni como pedirlo, y
 * ademas sacaria del buscador la ficha, que si es publica.
 */
async function getTeaser(slug: string, locale: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles_public")
    .select(
      "title, title_en, excerpt, excerpt_en, category, access_level"
    )
    .eq("slug", slug)
    .maybeSingle();

  return data && localizeRow(data, locale, ["title", "excerpt"]);
}

/**
 * El cuerpo. Vuelve `null` cuando la policy no deja pasar la fila: o el
 * articulo no existe, o esta en borrador, o pide un nivel que quien mira no
 * alcanza. **El texto nunca llega al browser en ese caso** — no se filtra acá,
 * no sale de la base.
 */
async function getArticle(slug: string, locale: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("title, excerpt, body, body_en, body_format, category, audio_url")
    .eq("slug", slug)
    .maybeSingle();

  return data && localizeRow(data, locale, ["body"]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Contenidos");
  // La ficha (no el cuerpo): un contenido cerrado tiene titulo y descripcion
  // publicos, y su pagina existe.
  const teaser = await getTeaser(slug, locale);

  if (!teaser) return { title: t("meta.notFound") };
  const cover = articleCover(teaser.category!);

  return {
    title: `${teaser.title} | Cosmic Eagle`,
    description: teaser.excerpt ?? undefined,
    openGraph: cover ? { images: [cover.src] } : undefined,
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
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  setRequestLocale(rawLocale);
  const t = await getTranslations("Contenidos");
  const tCat = await getTranslations("ArticleCategories");
  const [teaser, article] = await Promise.all([
    getTeaser(slug, rawLocale),
    getArticle(slug, rawLocale),
  ]);

  // Sin ficha publica no hay contenido: ni existe ni esta publicado.
  if (!teaser) notFound();

  // Hay ficha pero no cuerpo: el texto pide un nivel que esta persona no
  // alcanza. La pagina se dibuja igual, con el muro en lugar del texto.
  const locked = !article;

  const isHtml = article?.body_format === "html";
  const blocks = article && !isHtml ? parseArticleBody(article.body) : [];
  const cover = articleCover(teaser.category!);

  return (
    <>
      <Header />
      <main className="pt-[var(--navbar-h)]">
        {cover && (
          <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9] md:aspect-[21/9]">
            <Image
              src={cover.src}
              alt=""
              fill
              priority
              style={{ objectPosition: cover.position }}
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
          <LibraryNav active={teaser.category!} />

          <article className="mx-auto mt-12 max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/contenidos"
                className="inline-flex items-center gap-2 text-label-sm uppercase text-on-primary-container transition-colors hover:text-[#05125a]"
              >
                <ArrowLeft size={15} />
                {t("library.backToLibrary")}
              </Link>
              <ShareButton
                title={teaser.title!}
                label={t("library.share")}
                copiedLabel={t("library.shared")}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-on-primary-container/40 px-3 py-1 text-label-sm uppercase text-on-primary-container">
                {tCat(teaser.category!)}
              </span>
            </div>

            <h1 className="mt-5 font-display text-display-mobile font-bold text-[#05125a] text-balance md:text-display-lg">
              {teaser.title}
            </h1>

            {teaser.excerpt && (
              <p className="mt-5 text-body-lg text-[#05125a]">{teaser.excerpt}</p>
            )}

            <div className="mt-10 sm:mt-14">
              {locked ? (
                <div className="rounded-2xl border border-[#f9d78f] bg-[#fff6eb] px-6 py-8 text-center sm:px-10">
                  <Lock
                    size={22}
                    aria-hidden="true"
                    className="mx-auto text-on-primary-container"
                  />
                  <div className="mt-5">
                    <GuestNotice next={`/contenidos/${slug}`} />
                  </div>
                  <p className="mt-4 text-body-lg text-[#05125a]">
                    {t("library.wall")}
                  </p>
                  <AccessCodeForm tone="light" />
                  <p className="mt-6 text-body-md text-[#05125a]">
                    <Link
                      href="/viajes"
                      className="text-on-primary-container underline underline-offset-4"
                    >
                      {t("library.nextExperiences")}
                    </Link>
                  </p>
                </div>
              ) : (
                // El recuadro de lectura acotado: el cuerpo scrollea adentro y
                // la página no se convierte en el artículo entero, como pide el
                // documento §5.
                <>
                  {/* El audio va AFUERA del recuadro con scroll: si quedara
                      adentro, se iría de la vista apenas se empieza a leer. */}
                  {article?.audio_url && (
                    <ArticleAudio
                      src={article.audio_url}
                      label={t("library.listen")}
                      className="mb-6"
                    />
                  )}
                  {isHtml ? (
                    <div className="overflow-hidden rounded-2xl border border-[#f9d78f]">
                      <HtmlFrame html={article!.body} title={teaser.title!} />
                    </div>
                  ) : (
                    <ArticleBody blocks={blocks} tone="light" floating />
                  )}
                </>
              )}
            </div>
          </article>
        </CreamSection>
      </main>
      <Footer />
    </>
  );
}
