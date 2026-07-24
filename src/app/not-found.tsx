import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-nebula-glow blur-[120px] opacity-30" />

        <div className="relative z-10 text-center px-5 flex flex-col items-center">
          <span className="font-display text-[120px] md:text-[180px] leading-none text-primary/20 font-medium">
            404
          </span>
          <h1 className="font-display text-[32px] md:text-[40px] font-medium text-primary -mt-8 mb-4">
            Portal Perdido
          </h1>
          <p className="text-on-surface-variant max-w-md mb-10 leading-relaxed">
            Esta dimensión no existe en nuestro mapa cósmico. Quizás la
            frecuencia vibratoria de esta ruta se ha desvanecido en el
            espacio-tiempo.
          </p>
          <Link
            href="/"
            className="px-8 py-4 bg-primary text-on-primary text-sm font-semibold tracking-[0.1em] rounded-full hover:shadow-[0_0_20px_rgba(229,194,120,0.5)] transition-all duration-300"
          >
            Volver al Inicio
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
