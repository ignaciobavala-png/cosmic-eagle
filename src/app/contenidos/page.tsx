import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PageHero } from "@/components/ui/PageHero";
import { CreamSection, GOLD } from "@/components/ui/CreamSection";
import {
  ContentLibrary,
  type LibraryArticle,
} from "@/components/ui/ContentLibrary";
import { createClient } from "@/lib/supabase/server";
import { getSiteContent, isEnabled } from "@/lib/site-content";
import {
  ARTICLE_CATEGORY_LIST,
  isArticleCategory,
  parseArticleBody,
} from "@/lib/article";
import { canRead } from "@/lib/content-access";
import { viewerContentLevel } from "@/lib/content-access-server";
import { IMAGES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contenidos | Cosmic Eagle",
  description:
    "Preparación e integración, salud, evolución, tecnología humana y testimonios: la biblioteca de contenidos de Cosmic Eagle.",
};

/**
 * Biblioteca de contenidos, rediseñada según el pedido de la organización del
 * 23/09 (docs/entregas/2026-09-23-feedback-org/CEJ_Correcciones_Contenidos.docx):
 * cinco temas como menú fijo, los textos de la categoría elegida, y la lectura
 * dentro de un recuadro acotado sin salir de la biblioteca. Toda la interacción
 * vive en `ContentLibrary`.
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

  const [{ data: metas }, viewerLevel] = await Promise.all([
    supabase
      .from("articles_public")
      .select(
        "slug, title, excerpt, cover_url, category, published_at, access_level"
      )
      .order("published_at", { ascending: false, nullsFirst: false }),
    viewerContentLevel(supabase),
  ]);

  // El cuerpo, sólo de lo que la RLS deja leer. `articles_public` no expone
  // `body` a propósito.
  const { data: readable } = await supabase
    .from("articles")
    .select("slug, body");

  const bodyBySlug = new Map(
    (readable ?? []).map((row) => [row.slug, row.body])
  );

  const articles: LibraryArticle[] = (metas ?? []).map((meta) => {
    const slug = meta.slug!;
    const locked = !canRead(meta.access_level ?? "miembros", viewerLevel);
    const body = locked ? null : (bodyBySlug.get(slug) ?? null);

    return {
      slug,
      title: meta.title!,
      excerpt: meta.excerpt,
      cover_url: meta.cover_url,
      category: meta.category!,
      published_at: meta.published_at,
      locked,
      blocks: body ? parseArticleBody(body) : null,
    };
  });

  const categories = ARTICLE_CATEGORY_LIST.map((category) => ({
    value: category.value,
    label: category.label,
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

        {/* La biblioteca vive sobre la banda dorada. **El envoltorio NO lleva
            `overflow-hidden`**: el menú de temas es `sticky` y un ancestro
            recortado le impide pegarse (el scroll container pasa a ser esa caja
            que no scrollea). La marca de agua, que sí necesita recorte, vive en
            su propia capa absoluta. */}
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
              initialCategory={active}
            />
          </div>
        </CreamSection>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
