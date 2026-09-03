import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthScreen } from "@/components/ui/AuthScreen";
import { createClient } from "@/lib/supabase/server";
import { getSiteContent } from "@/lib/site-content";
import { NewPasswordForm } from "../NewPasswordForm";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  robots: { index: false },
};

export default async function NuevaClavePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se llega aca con la sesion que creo el verifyOtp de /auth/confirm. Sin
  // sesion, el enlace vencio o alguien entro a la URL de prepo.
  if (!user) redirect("/cuenta?error=enlace-vencido");

  const content = await getSiteContent();

  return (
    <>
      <Header />
      <main className="pt-18 md:pt-24">
        <AuthScreen
          image={content("cuenta.acceso.image")}
          eyebrow="Nueva contraseña"
          title="Elige tu clave"
          subtitle={`Estás cambiando la contraseña de ${user.email}.`}
        >
          <NewPasswordForm />
        </AuthScreen>
      </main>
      <Footer />
    </>
  );
}
