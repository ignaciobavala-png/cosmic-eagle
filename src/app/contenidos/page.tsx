import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PageHero } from "@/components/ui/PageHero";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { Reveal } from "@/components/ui/Reveal";
import { createClient } from "@/lib/supabase/server";
import { getSiteContent } from "@/lib/site-content";
import { ARTICLE_CATEGORY_LIST, isArticleCategory } from "@/lib/article";

export const metadata: Metadata = {
  title: "Contenidos | Cosmic Eagle",
  description:
    "Biblioteca, ciencia almática y testimonios: material de lectura para acompañar el camino.",
};

/**
 * Hub de contenidos (docs/CONTENT_MAP.md): hero P1 + filtro por categoria +
 * grilla de tarjetas. Dejo de ser la seccion mock que se habia mudado de la
 * home: los articulos salen de la tabla `articles` y los carga la clienta desde
 * /admin/contenidos.
 *
 * No hace falta filtrar borradores acá: la policy `articles_select_published`
 * no los deja salir de la base (a diferencia de `trips`, donde el filtro de
 * borradores lo hace cada pagina).
 */
export default async function ContenidosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  // Una categoria desconocida cae en el listado completo en vez de 404: es un
  // filtro, no una ruta (mismo criterio que `?tipo=` en /viajes).
  const active = isArticleCategory(categoria) ? categoria : null;
  const content = await getSiteContent();

  const supabase = await createClient();
  let query = supabase
    .from("articles")
    .select("slug, title, excerpt, cover_url, category, published_at");

  if (active) query = query.eq("category", active);

  const { data: articles } = await query.order("published_at", {
    ascending: false,
    nullsFirst: false,
  });

  const filters = [
    { label: "Todos", href: "/contenidos", active: !active },
    ...ARTICLE_CATEGORY_LIST.map((category) => ({
      label: category.label,
      href: `/contenidos?categoria=${category.value}`,
      active: active === category.value,
    })),
  ];

  return (
    <>
      <Header />
      <main className="pt-16 lg:pt-21">
        <PageHero
          image={content("contenidos.hero.image")}
          title={content("contenidos.hero.title")}
          subtitle={content("contenidos.hero.subtitle")}
          scrollHint="Explorar"
          scrollTo="biblioteca"
        />

        <Reveal className="py-20 md:py-24">
          <div
            id="biblioteca"
            className="mx-auto max-w-narrative px-margin-mobile md:px-margin-desktop scroll-mt-24"
          >
            <div className="mb-8 text-center">
              <span className="text-label-sm uppercase text-on-surface-variant">
                Explora
              </span>
              <h2 className="mt-2 font-display text-headline-md sm:text-headline-lg text-on-surface">
                {active
                  ? ARTICLE_CATEGORY_LIST.find((c) => c.value === active)!.label
                  : "Biblioteca"}
              </h2>
            </div>

            <div className="mb-12 flex flex-wrap justify-center gap-2">
              {filters.map((filter) => (
                <Link
                  key={filter.href}
                  href={filter.href}
                  scroll={false}
                  aria-current={filter.active ? "page" : undefined}
                  className={`rounded-full border px-5 py-2 text-label-sm uppercase transition-colors ${
                    filter.active
                      ? "border-primary-fixed-dim bg-primary-container text-on-primary"
                      : "border-primary-fixed-dim/25 text-on-surface-variant hover:border-primary-fixed-dim/50 hover:text-on-surface"
                  }`}
                >
                  {filter.label}
                </Link>
              ))}
            </div>

            {!articles || articles.length === 0 ? (
              <p className="mx-auto max-w-md text-center text-body-md text-on-surface-variant">
                {active
                  ? "Todavía no hay contenidos publicados en esta categoría."
                  : "Estamos preparando el material. Vuelve a visitarnos pronto."}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            )}
          </div>
        </Reveal>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
