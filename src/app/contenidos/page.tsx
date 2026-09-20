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
import { CTA_TONES } from "@/components/ui/CtaLink";
import { IMAGES } from "@/lib/constants";

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

  const filters = ARTICLE_CATEGORY_LIST.map((category) => ({
    label: category.label,
    href: `/contenidos?categoria=${category.value}`,
    active: active === category.value,
  }));

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
        {/* **La franja dorada no va pelada** (pedido de Ignacio, 17/09: "un
            golden plano no le hace gala a una seccion tan importante"). Lleva
            la marca de agua que el propio manual usa en sus fondos: el simbolo
            de marca gigante, tono sobre tono, CORTADO POR EL BORDE — es
            exactamente lo que hace `Fondos/2.png`, y por eso no hace falta
            inventar decoracion nueva.

            Los dos simbolos van al 16% y 12% (subidos desde 10% y 7% el mismo
            dia, se perdian): sobre el dorado el oro oscuro del asset a opacidad
            plena compite con las tarjetas, y la marca de agua tiene que leerse
            como textura del fondo y no como un elemento mas.

            Y en mobile van bastante mas chicos (190px y 160px contra 460 y 380):
            el mismo tamaño sobre 390px de ancho deja de ser marca de agua y
            pasa a cruzar por detras de los chips.

            `overflow-hidden` recorta lo que sobresale, que es justo el efecto
            buscado. Y el envoltorio va en `z-0` con el contenido en `z-10`, y
            NO con un z-index negativo: un `-z-10` lo manda detras del degrade
            del `body` y el simbolo desaparece (la trampa que ya costo una
            seccion entera en la home). */}
        <CreamSection
          id="biblioteca"
          background={GOLD}
          full={false}
          className="relative overflow-hidden"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
            {/* Arriba a la derecha, saliendose por el borde: el simbolo entra
                en diagonal con el degrade, que en 135 grados va del oro claro
                (arriba izquierda) al oscuro. */}
            <img
              src={IMAGES.simboloCirculos}
              alt=""
              className="absolute -right-16 -top-12 w-[190px] opacity-[0.16] md:-right-32 md:-top-16 md:w-[460px]"
            />
            {/* El segundo, abajo a la izquierda y mas tenue: cierra la diagonal
                sin cerrar la composicion. */}
            <img
              src={IMAGES.simboloCirculos}
              alt=""
              className="absolute -bottom-20 -left-16 w-[160px] opacity-[0.12] md:-bottom-28 md:-left-36 md:w-[380px]"
            />
          </div>
          <div className="relative z-10 mx-auto max-w-narrative">
            <Reveal amount={0.22} once={false} className="text-center">
              {/* **Sin "Explora" encima del titulo** (Ignacio, 17/09), como en
                  /viajes, que el mismo dia perdio su "Portales de
                  transformacion": el eyebrow en Montserrat versalita arriba de
                  un titulo en la display metia una segunda tipografia para no
                  decir nada que el titulo no diga.

                  `w-fit mx-auto`: el filete mide el ancho del titulo —que aca
                  va centrado— y no el de la columna entera. */}
              <div className="mx-auto w-fit">
                <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
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
                  //
                  // **El inactivo usa el hover del boton del sistema**
                  // (`CTA_TONES.dark`, el mismo `tone` que el resto de lo que
                  // vive sobre fondo claro) y no uno propio. Tenia
                  // `hover:bg-[#fff6eb]`: se rellenaba de blanco al pasar por
                  // encima, que es justo lo que el estandar del 15/09 saco de
                  // todo el sitio —no hay mas botones rellenados, el hover son
                  // el trazo, el brillo y la escala— (reporte de Ignacio,
                  // 17/09). El RELLENO azul del activo se queda: no es una
                  // variante de boton, es el estado seleccionado del filtro, y
                  // es lo unico que lo distingue de los otros seis.
                  className={`inline-flex items-center rounded-full border-[1.5px] px-5 py-2 text-label-sm uppercase transition-[color,background-color,border-color,box-shadow,transform] duration-[250ms] ${
                    filter.active
                      ? "border-[#05125a] bg-[#05125a] text-[#fff6eb]"
                      : `hover:scale-[1.04] ${CTA_TONES.dark}`
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
