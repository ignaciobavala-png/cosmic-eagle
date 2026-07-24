import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";

export default function ViajesPage() {
  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center px-5">
          <h1 className="font-display text-[32px] md:text-[40px] font-medium text-primary mb-4">
            Viajes
          </h1>
          <p className="text-on-surface-variant max-w-md">
            Explorá nuestros retiros y ceremonias. Esta página está en
            construcción.
          </p>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
