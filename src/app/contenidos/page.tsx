import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PageHero } from "@/components/ui/PageHero";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { CreamSection, GOLD } from "@/components/ui/CreamSection";
import { Reveal } from "@/components/ui/Reveal";
import { TitleRule } from "@/components/ui/TitleRule";
import { YouTubeFacade } from "@/components/ui/YouTubeFacade";
import { createClient } from "@/lib/supabase/server";
import { getSiteContent, isEnabled } from "@/lib/site-content";
import { ARTICLE_CATEGORY_LIST, isArticleCategory } from "@/lib/article";
import { canRead, CONTENT_WALL_COPY } from "@/lib/content-access";
import { viewerContentLevel } from "@/lib/content-access-server";
import { AccessCodeForm } from "@/components/ui/AccessCodeForm";

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

  // **Se lee la vista `articles_public`, no la tabla.** La vista trae los
  // metadatos de TODO lo publicado, incluido lo que esta persona no puede leer:
  // §1.4 del documento de Sofia pide que quien no tiene acceso vea igual las
  // categorias y las portadas, y el mockup de Julia muestra candados, no
  // ausencia. El cuerpo del texto no esta en la vista, y la tabla (que si lo
  // tiene) sigue filtrando por RLS.
  let query = supabase
    .from("articles_public")
    .select("slug, title, excerpt, cover_url, category, published_at, access_level");

  if (active) query = query.eq("category", active);

  const [{ data: articles }, viewerLevel] = await Promise.all([
    query.order("published_at", { ascending: false, nullsFirst: false }),
    viewerContentLevel(supabase),
  ]);

  const locked = (articles ?? []).filter(
    (article) => !canRead(article.access_level ?? "miembros", viewerLevel)
  ).length;

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
      <main className="pt-[var(--navbar-h)]">
        <PageHero
          image={content("contenidos.hero.image")}
          title={content("contenidos.hero.title")}
          subtitle={content("contenidos.hero.subtitle")}
          scrollHint="Ver la biblioteca"
          scrollTo="biblioteca"
          overlay={isEnabled(content("contenidos.hero.overlay"))}
          hardEdge
        />

        {/* La biblioteca vive sobre la banda dorada. Hasta el 15/09 era el
            crema del sistema, como /viajes y /nosotros; el dorado entra aca
            como PRUEBA —la segunda franja del sitio con este fondo, despues de
            Tecnologia Humana en la home— para decidir mirandolo si reemplaza al
            crema en todo el sitio. Si se revierte, vuelve `CREAM` por `GOLD` y
            el hero vuelve a `fadeTo={CREAM_HEX}` en lugar de `hardEdge`, y con
            eso alcanza salvo por los colores de adentro que anota cada bloque.

            Lo que arrastro el dorado, medido y no a ojo (los numeros estan en
            `GOLD`): el filete, los chips, el muro y el texto de vacio cambiaron
            de color porque sobre este fondo el oro claro y el `#755c21` del
            crema no llegan al minimo.

            Antes de todo esto era una seccion sin fondo propio: se
            apoyaba en el degrade del `body`, que es el chrome del sistema
            anterior, y con tarjetas de vidrio dorado.

            **El reveal observa solo el encabezado y no la seccion**, igual que
            /faqs: el ratio de interseccion maximo alcanzable es alto-de-pantalla
            / alto-del-observado, y aca el alto lo decide la clienta —publica los
            articulos que quiera—. Con suficientes tarjetas la seccion nunca
            llegaria al umbral y, siendo reversible, la grilla quedaria invisible
            para siempre. El encabezado mide lo mismo con dos articulos que con
            cincuenta. */}
        <CreamSection id="biblioteca" background={GOLD} full={false}>
          <div className="mx-auto max-w-narrative">
            <Reveal amount={0.22} once={false} className="text-center">
              {/* Azul y no `on-primary-container`: ese es el color de texto
                  chico sobre CREMA y sobre el dorado cae a 2,23:1. */}
              <p className="text-label-sm font-bold uppercase text-[#05125a]">
                Explora
              </p>
              {/* `w-fit mx-auto`: el filete mide el ancho del titulo —que aca
                  va centrado— y no el de la columna entera. */}
              <div className="mx-auto w-fit">
                <h2 className="mt-3 font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                  {active
                    ? ARTICLE_CATEGORY_LIST.find((c) => c.value === active)!.label
                    : "Biblioteca"}
                </h2>
                <TitleRule tone="goldDark" align="center" className="mt-3 mb-10" />
              </div>
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
                  // El chip activo era una pildora dorada y sobre este fondo
                  // desaparecia: va la azul, la misma del boton de Tecnologia
                  // Humana. El inactivo pasa a borde y texto azules por lo
                  // mismo que el kicker.
                  className={`rounded-full border px-5 py-2 text-label-sm uppercase transition-colors ${
                    filter.active
                      ? "border-[#05125a] bg-[#05125a] text-[#fff6eb]"
                      : "border-[#05125a]/35 text-[#05125a] hover:border-[#05125a] hover:bg-[#fff6eb]"
                  }`}
                >
                  {filter.label}
                </Link>
              ))}
            </div>

            {!articles || articles.length === 0 ? (
              <p className="mx-auto max-w-md text-center text-body-md text-[#05125a]">
                {active
                  ? "Todavía no hay contenidos publicados en esta categoría."
                  : "Estamos preparando el material. Vuelve a visitarnos pronto."}
              </p>
            ) : (
              <>
                {locked > 0 && (
                  <div className="mx-auto mb-12 max-w-2xl rounded-2xl border border-[#b3964b] bg-[#fff6eb] px-6 py-6 text-center">
                    <p className="text-body-md text-[#05125a]">
                      {CONTENT_WALL_COPY}
                    </p>
                    <AccessCodeForm tone="light" />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {articles.map((article) => (
                    <ArticleCard
                      key={article.slug}
                      article={{
                        slug: article.slug!,
                        title: article.title!,
                        excerpt: article.excerpt,
                        cover_url: article.cover_url,
                        category: article.category!,
                        published_at: article.published_at,
                      }}
                      locked={
                        !canRead(article.access_level ?? "miembros", viewerLevel)
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </CreamSection>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
