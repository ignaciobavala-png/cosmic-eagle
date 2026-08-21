import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <>
      <Header />
      <main className="pt-16 lg:pt-21 min-h-screen flex items-center justify-center">
        <div className="text-center px-5 flex flex-col items-center gap-6 py-12">
          <div>
            <h1 className="font-display text-[32px] md:text-[40px] font-medium text-primary-fixed-dim mb-2">
              Nueva contraseña
            </h1>
            <p className="text-on-surface-variant max-w-md">
              Elegí una contraseña nueva para {user.email}.
            </p>
          </div>
          <NewPasswordForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
