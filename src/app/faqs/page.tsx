import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PageHero } from "@/components/ui/PageHero";
import { CreamSection } from "@/components/ui/CreamSection";
import { Reveal } from "@/components/ui/Reveal";
import { FaqList } from "@/components/ui/FaqList";
import { getSiteContent, isEnabled } from "@/lib/site-content";
import { getFaqs, FAQ_PLACEMENTS } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "Preguntas frecuentes | Cosmic Eagle",
  description:
    "Preparación, salud, qué llevar, integración: lo que suelen preguntarnos antes de una Sesión o un Viaje Cósmico.",
};

/**
 * Se lee con el cliente sin cookies (`getFaqs`), asi que la pagina puede ser
 * estatica y revalidar cada hora. Los server actions de /admin/faqs hacen
 * `revalidatePath("/faqs")`, o una pregunta nueva tardaria hasta una hora.
 */
export const revalidate = 3600;

/**
 * Preguntas frecuentes. Existe porque "Salud y Seguridad" de /viajes ya remitia
 * acá ("visita nuestras FAQs") y era un link muerto del codigo aprobado.
 *
 * El texto lo cargan ellas desde /admin/faqs: los dos juegos que escribio Sofia
 * estaban en los anexos de `web-cosmic-journey-ES.md`, que se perdio.
 *
 * No hace falta filtrar despublicadas acá: la policy `faqs_select_published` no
 * las deja salir de la base.
 */
export default async function FaqsPage() {
  const content = await getSiteContent();
  const faqs = await getFaqs();

  const blocks = FAQ_PLACEMENTS.filter((p) => faqs[p.value].length > 0);

  return (
    <>
      <Header />
      <main className="pt-16 lg:pt-21">
        <PageHero
          image={content("faqs.hero.image")}
          imageAlt="Partículas de luz sobre un cielo estrellado"
          title={content("faqs.hero.title")}
          subtitle={content("faqs.hero.subtitle")}
          scrollHint="Leer"
          scrollTo="preguntas"
          overlay={isEnabled(content("faqs.hero.overlay"))}
        />

        {/* La seccion NO es el elemento observado, a diferencia del resto del
            sitio. El umbral de `Reveal` se mide sobre lo observado, y el ratio
            de interseccion maximo alcanzable es alto-de-pantalla / alto-del-
            elemento: una seccion mas alta que unas pocas pantallas nunca llega
            al umbral y el contenido no aparece NUNCA (ver CLAUDE.md, sesion del
            28/08). Acá el alto lo decide la clienta —carga las preguntas que
            quiera— asi que no puede haber un umbral atado a él. Se revela solo
            el encabezado, que mide lo mismo siempre, y la lista queda visible
            desde el arranque. */}
        <CreamSection id="preguntas" full={false}>
          <div className="mx-auto max-w-3xl">
            {blocks.length === 0 ? (
              // Al salir a produccion la tabla esta vacia a proposito: el texto
              // es de la clienta. Sin esto la pagina quedaria en blanco.
              <Reveal amount={0.22} once={false}>
                <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                  Preguntas frecuentes
                </h2>
                <div
                  aria-hidden="true"
                  className="mt-3 mb-7 h-0.5 w-16 bg-[#f9d78f]"
                />
                <p className="text-body-md leading-relaxed text-[#333]">
                  Estamos preparando esta sección. Mientras tanto, escribinos y
                  te respondemos cualquier duda sobre las experiencias.
                </p>
              </Reveal>
            ) : (
              blocks.map((placement, index) => (
                <section
                  key={placement.value}
                  id={placement.value}
                  className={index > 0 ? "mt-16" : ""}
                >
                  <Reveal amount={0.22} once={false}>
                    <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                      {placement.label}
                    </h2>
                    <div
                      aria-hidden="true"
                      className="mt-3 mb-7 h-0.5 w-16 bg-[#f9d78f]"
                    />
                  </Reveal>

                  <FaqList faqs={faqs[placement.value]} />
                </section>
              ))
            )}
          </div>
        </CreamSection>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
