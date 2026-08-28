import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthScreen } from "@/components/ui/AuthScreen";
import { getSiteContent } from "@/lib/site-content";
import { RecoverForm } from "../RecoverForm";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false },
};

export default async function RecuperarPage() {
  const content = await getSiteContent();

  return (
    <>
      <Header />
      <main className="pt-16 lg:pt-21">
        <AuthScreen
          image={content("cuenta.acceso.image")}
          eyebrow="Recuperar acceso"
          title="Volver a entrar"
          subtitle="Escribe tu email y te mandamos un enlace para crear una contraseña nueva."
          footer={
            <Link href="/cuenta" className="text-primary-container underline">
              Volver al inicio de sesión
            </Link>
          }
        >
          <RecoverForm />
        </AuthScreen>
      </main>
      <Footer />
    </>
  );
}
