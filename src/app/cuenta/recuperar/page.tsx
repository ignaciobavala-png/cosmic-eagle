import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RecoverForm } from "../RecoverForm";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false },
};

export default function RecuperarPage() {
  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center px-5 flex flex-col items-center gap-6 py-12">
          <div>
            <h1 className="font-display text-[32px] md:text-[40px] font-medium text-primary-fixed-dim mb-2">
              Recuperar contraseña
            </h1>
            <p className="text-on-surface-variant max-w-md">
              Escribí tu email y te mandamos un enlace para crear una nueva.
            </p>
          </div>
          <RecoverForm />
          <Link
            href="/cuenta"
            className="text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors underline"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
