import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { ContentSection } from "@/components/ContentSection";

export const metadata: Metadata = {
  title: "Contenidos | Cosmic Eagle",
  description:
    "Programas, sesiones de audio, lecturas recomendadas, material de integración e investigación cósmica.",
};

/**
 * Provisoria: hasta cerrar la arquitectura de contenidos con Sofia
 * (docs/CONTENT_MAP.md), la pagina reusa tal cual la seccion "Contenidos" que
 * vivia en la home. Los CTAs "Ver Contenido" todavia no tienen destino.
 */
export default function ContenidosPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <ContentSection />
        <p className="pb-24 text-center text-body-md text-on-surface-variant px-margin-mobile">
          Estamos preparando el material de cada categoría.
        </p>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
