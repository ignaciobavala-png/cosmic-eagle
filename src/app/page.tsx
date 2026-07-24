import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { RetreatsSection } from "@/components/RetreatsSection";
import { ContentSection } from "@/components/ContentSection";
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
        <AboutSection />
        <RetreatsSection />
        <ContentSection />
        <EbookSection />
        <TestimonialsSection />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
