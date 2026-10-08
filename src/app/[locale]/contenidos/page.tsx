import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/ui/PageHero";
import { CreamSection, GOLD } from "@/components/ui/CreamSection";
import {
  ContentLibrary,
  type LibraryArticle,
} from "@/components/ui/ContentLibrary";
import { createClient } from "@/lib/supabase/server";
import { localized } from "@/lib/localized";
import { getSiteContent, isEnabled } from "@/lib/site-content";
import {
  ARTICLE_CATEGORY_LIST,
  parseArticleBody,
} from "@/lib/article";
import { canRead } from "@/lib/content-access";
import { viewerContentLevel } from "@/lib/content-access-server";
import { IMAGES } from "@/lib/constants";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contenidos">): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Contenidos");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

/**
 * Biblioteca de contenidos, según los pedidos de la organización del 23/09
 * (docs/entregas/2026-09-23-feedback-org/CEJ_Correcciones_Contenidos.docx) y
 * del 08/10: un índice de cinco tarjetas de tema, los textos del tema elegido,
 * y la lectura dentro de un recuadro acotado sin salir de la biblioteca. Toda
 * la interacción vive en `ContentLibrary`.
 *
 * **Se lee la vista `articles_public` para el listado** (trae los metadatos de
 * TODO lo publicado, incluido lo que esta persona no puede leer: la clienta pide
 * ver las categorias y las portadas con candado, no la ausencia) y **la tabla
 * `articles` para el cuerpo**. La policy filtra la tabla, asi que de acá sólo
 * salen los cuerpos que la RLS dejó pasar: lo cerrado viaja sin `blocks` y su
 * tarjeta abre la ficha, donde vive el muro y el canje del código.
 *
 * No hace falta filtrar borradores: la policy `articles_select_published` no los
 * deja salir de la base (a diferencia de `trips`, donde el filtro lo hace cada
 * página).
 */
export default async function ContenidosPage({
  params,
}: PageProps<"/[locale]/contenidos">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Contenidos");
  const tCat = await getTranslations("ArticleCategories");
  const content = await getSiteContent(locale);

  const supabase = await createClient();

  const [{ data: metas }, viewerLevel] = await Promise.all([
    supabase
      .from("articles_public")
      .select(
        "slug, title, title_en, excerpt, excerpt_en, cover_url, category, published_at, access_level"
      )
      .order("published_at", { ascending: false, nullsFirst: false }),
    viewerContentLevel(supabase),
  ]);

  // El cuerpo, sólo de lo que la RLS deja leer. `articles_public` no expone
  // `body` a propósito.
  const { data: readable } = await supabase
    .from("articles")
    .select("slug, body, body_en, audio_url");

  // En /en cada campo usa su `_en` si está cargado (docs/I18N.md §6).
  const audioBySlug = new Map(
    (readable ?? []).map((row) => [row.slug, row.audio_url])
  );
  const bodyBySlug = new Map(
    (readable ?? []).map((row) => [row.slug, localized(locale, row.body, row.body_en)])
  );

  const articles: LibraryArticle[] = (metas ?? []).map((meta) => {
    const slug = meta.slug!;
    const locked = !canRead(meta.access_level ?? "miembros", viewerLevel);
    const body = locked ? null : (bodyBySlug.get(slug) ?? null);

    return {
      slug,
      title: localized(locale, meta.title!, meta.title_en),
      excerpt: localized(locale, meta.excerpt, meta.excerpt_en),
      cover_url: meta.cover_url,
      category: meta.category!,
      published_at: meta.published_at,
      locked,
      blocks: body ? parseArticleBody(body) : null,
      audio_url: body ? (audioBySlug.get(slug) ?? null) : null,
    };
  });

  const categories = ARTICLE_CATEGORY_LIST.map((category) => ({
    value: category.value,
    label: tCat(category.value),
    image: content(`contenidos.tema.${category.value}.image` as const),
  }));

  return (
    <>
      <Header />
      <main className="pt-[var(--navbar-h)]">
        <PageHero
          image={content("contenidos.hero.image")}
          title={content("contenidos.hero.title")}
          subtitle={content("contenidos.hero.subtitle")}
          scrollHint={t("hero.scrollHint")}
          scrollTo="biblioteca"
          overlay={isEnabled(content("contenidos.hero.overlay"))}
          titleClassName="text-primary-fixed-dim"
          titleRule="gold"
          raised
        />

        {/* La biblioteca vive sobre la banda dorada. La marca de agua, que
            necesita recorte, vive en su propia capa absoluta: el envoltorio no
            lleva `overflow-hidden` (lo pedía el menú `sticky` de temas que
            hubo hasta el 08/10, y sigue siendo lo seguro si vuelve algo fijo). */}
        <CreamSection
          id="biblioteca"
          background={GOLD}
          full={false}
          className="relative"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          >
            <img
              src={IMAGES.simboloCirculos}
              alt=""
              className="absolute -right-16 -top-12 w-[190px] opacity-[0.16] md:-right-32 md:-top-16 md:w-[460px]"
            />
            <img
              src={IMAGES.simboloCirculos}
              alt=""
              className="absolute -bottom-20 -left-16 w-[160px] opacity-[0.12] md:-bottom-28 md:-left-36 md:w-[380px]"
            />
          </div>

          <div className="relative z-10 mx-auto max-w-narrative">
            <ContentLibrary
              categories={categories}
              articles={articles}
            />
          </div>
        </CreamSection>
      </main>
      <Footer />
    </>
  );
}
