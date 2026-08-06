import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { PortalsSection } from "@/components/PortalsSection";
import { AboutSection } from "@/components/AboutSection";
import { TripsSection } from "@/components/TripsSection";
import { EbookSection } from "@/components/EbookSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <HeroSection />
        <PortalsSection />
        <AboutSection />
        <TripsSection
          type="retiro"
          subtitle="Experiencias inmersivas de varios días en espacios exclusivos."
        />
        <TripsSection
          type="ceremonia"
          subtitle="Encuentros ceremoniales de jornada completa, con programa y cupo definidos."
        />
        <EbookSection />
        <TestimonialsSection />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
