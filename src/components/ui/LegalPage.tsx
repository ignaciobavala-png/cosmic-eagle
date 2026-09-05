import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { ArticleBody } from "@/components/ui/ArticleBody";
import { Reveal } from "@/components/ui/Reveal";
import { parseArticleBody, formatArticleDate } from "@/lib/article";
import { CreamSection } from "./CreamSection";
import { getLegalDocument, legalDocumentMeta, type LegalSlug } from "@/lib/legal";

/**
 * Las dos páginas legales son la misma página con otro texto, así que viven acá
 * y sus `page.tsx` son tres líneas.
 *
 * Reusa `ArticleBody` tal cual: el cuerpo se guarda con las mismas reglas de
 * texto plano que un contenido de la biblioteca y se renderiza con la misma
 * plantilla de lectura. Nada de HTML del formulario — no hay sanitizador en el
 * proyecto y sería un XSS almacenado.
 *
 * **No lleva `PageHero`.** El resto del sitio abre con una imagen a pantalla
 * completa, y acá eso obligaría a scrollear una pantalla entera para empezar a
 * leer un documento que se consulta para buscar un dato puntual.
 */
export async function legalMetadata(slug: LegalSlug): Promise<Metadata> {
  const doc = await getLegalDocument(slug);
  const meta = legalDocumentMeta(slug);

  return {
    title: `${doc?.title ?? meta.label} | Cosmic Eagle`,
    description: meta.descripcion,
  };
}

export async function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = await getLegalDocument(slug);

  // La fila la siembra la migración, así que esto sólo pasa si alguien la borró
  // a mano en la base: el panel no puede.
  if (!doc) notFound();

  const blocks = parseArticleBody(doc.body);

  return (
    <>
      <Header />
      {/* Sobre crema, como el resto del texto largo del sitio (05/09/2026). El
          `pt` es el del navbar opaco; el fondo lo pone la seccion. */}
      <main className="pt-18 md:pt-24">
        <CreamSection full={false}>
        <article className="mx-auto max-w-3xl">
          {/* Se observa sólo el encabezado y no la sección, por lo mismo que
              /faqs: el alto del documento lo decide la clienta, y el ratio de
              intersección máximo alcanzable es alto-de-pantalla / alto-del-
              elemento. Un documento largo nunca llegaría al umbral y, con
              `once`, no aparecería nunca. El cuerpo queda visible desde el
              arranque (ver CLAUDE.md, sesión del 02/09). */}
          <Reveal amount={0.3}>
            <h1 className="font-display text-headline-lg font-bold text-[#05125a] md:text-display-lg">
              {doc.title}
            </h1>
            <div aria-hidden="true" className="mt-5 h-0.5 w-16 bg-[#f9d78f]" />
          </Reveal>

          {doc.isProvisional && (
            <p className="mt-8 rounded-2xl border border-[#f9d78f] border-l-2 bg-white/70 px-5 py-4 text-body-md leading-relaxed text-[#333]">
              <strong className="text-[#05125a]">
                Versión preliminar.
              </strong>{" "}
              Este texto está en revisión y puede cambiar. Si algo de lo que leés
              acá no coincide con lo que te dijimos, escribinos y lo aclaramos.
            </p>
          )}

          <div className="mt-10">
            <ArticleBody blocks={blocks} tone="light" />
          </div>

          <p className="mt-14 border-t border-[#f9d78f] pt-6 text-label-sm uppercase tracking-wider text-on-primary-container">
            Última actualización: {formatArticleDate(doc.updatedAt)}
          </p>
        </article>
        </CreamSection>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
