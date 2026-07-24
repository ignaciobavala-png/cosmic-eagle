import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";

export default function CuentaPage() {
  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center px-5">
          <h1 className="font-display text-[32px] md:text-[40px] font-medium text-primary mb-4">
            Mi Cuenta
          </h1>
          <p className="text-on-surface-variant max-w-md">
            Iniciá sesión para acceder a tu cuenta. Esta página está en
            construcción.
          </p>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
