import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PageHero } from "@/components/ui/PageHero";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { CreamSection } from "@/components/ui/CreamSection";
import { Reveal } from "@/components/ui/Reveal";
import { YouTubeFacade } from "@/components/ui/YouTubeFacade";
import { createClient } from "@/lib/supabase/server";
import { getSiteContent, isEnabled } from "@/lib/site-content";
import { ARTICLE_CATEGORY_LIST, isArticleCategory } from "@/lib/article";

export const metadata: Metadata = {
  title: "Contenidos | Cosmic Eagle",
  description:
    "Preparación e integración, salud, evolución, tecnología humana y testimonios: la biblioteca de contenidos de Cosmic Eagle.",
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
      <main className="pt-18 md:pt-24">
        <PageHero
          image={content("contenidos.hero.image")}
          title={content("contenidos.hero.title")}
          subtitle={content("contenidos.hero.subtitle")}
          scrollHint="Explorar"
          scrollTo="biblioteca"
          overlay={isEnabled(content("contenidos.hero.overlay"))}
        />

        {/* La biblioteca vive sobre crema, como los bloques narrativos de
            /viajes y /nosotros. Antes era una seccion sin fondo propio: se
            apoyaba en el degrade del `body`, que es el chrome del sistema
            anterior, y con tarjetas de vidrio dorado.

            **El reveal observa solo el encabezado y no la seccion**, igual que
            /faqs: el ratio de interseccion maximo alcanzable es alto-de-pantalla
            / alto-del-observado, y aca el alto lo decide la clienta —publica los
            articulos que quiera—. Con suficientes tarjetas la seccion nunca
            llegaria al umbral y, siendo reversible, la grilla quedaria invisible
            para siempre. El encabezado mide lo mismo con dos articulos que con
            cincuenta. */}
        <CreamSection id="biblioteca" full={false}>
          <div className="mx-auto max-w-narrative">
            <Reveal amount={0.22} once={false} className="text-center">
              <p className="text-label-sm font-bold uppercase text-on-primary-container">
                Explora
              </p>
              <h2 className="mt-3 font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                {active
                  ? ARTICLE_CATEGORY_LIST.find((c) => c.value === active)!.label
                  : "Biblioteca"}
              </h2>
              <div
                aria-hidden="true"
                className="mx-auto mt-3 mb-10 h-0.5 w-16 bg-[#f9d78f]"
              />
            </Reveal>

            {active === "testimonios" && (
              <div className="mx-auto mb-12 max-w-3xl">
                <YouTubeFacade
                  videoId="SbTmftGZZfo"
                  title="Teaser Testimonials Cosmic Journeys 2026"
                  cover="/img/portal-1.webp"
                />
              </div>
            )}

            <div className="mb-12 flex flex-wrap justify-center gap-2">
              {filters.map((filter) => (
                <Link
                  key={filter.href}
                  href={filter.href}
                  scroll={false}
                  aria-current={filter.active ? "page" : undefined}
                  className={`rounded-full border px-5 py-2 text-label-sm uppercase transition-colors ${
                    filter.active
                      ? "border-[#f9d78f] bg-[#f9d78f] text-[#05125a]"
                      : "border-on-primary-container/35 text-on-primary-container hover:border-on-primary-container hover:bg-white/60"
                  }`}
                >
                  {filter.label}
                </Link>
              ))}
            </div>

            {!articles || articles.length === 0 ? (
              <p className="mx-auto max-w-md text-center text-body-md text-[#333]">
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
        </CreamSection>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
