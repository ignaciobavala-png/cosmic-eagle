import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { PortalsSection } from "@/components/PortalsSection";
import { AboutSection } from "@/components/AboutSection";
import { TripsSection } from "@/components/TripsSection";
import { EbookSection } from "@/components/EbookSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { PORTAL_ALTS } from "@/lib/constants";
import { getSiteContent } from "@/lib/site-content";

export default async function Home() {
  const content = await getSiteContent();

  const portals = [
    { image: content("home.portales.image1"), alt: PORTAL_ALTS[0] },
    { image: content("home.portales.image2"), alt: PORTAL_ALTS[1] },
    { image: content("home.portales.image3"), alt: PORTAL_ALTS[2] },
  ];

  return (
    <>
      <Header />
      <main className="pt-16">
        <HeroSection />
        <PortalsSection
          title={content("home.portales.title")}
          subtitle={content("home.portales.subtitle")}
          portals={portals}
        />
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
