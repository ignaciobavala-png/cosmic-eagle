import { redirect } from "@/i18n/redirect";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthScreen } from "@/components/ui/AuthScreen";
import { createClient } from "@/lib/supabase/server";
import { getSiteContent } from "@/lib/site-content";
import { NewPasswordForm } from "../NewPasswordForm";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cuenta/nueva-clave">): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Cuenta");

  return {
    title: t("meta.newPasswordTitle"),
    robots: { index: false },
  };
}

export default async function NuevaClavePage({
  params,
}: PageProps<"/[locale]/cuenta/nueva-clave">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Cuenta");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se llega aca con la sesion que creo el verifyOtp de /auth/confirm. Sin
  // sesion, el enlace vencio o alguien entro a la URL de prepo.
  if (!user) return await redirect("/cuenta?error=enlace-vencido");

  const content = await getSiteContent();

  return (
    <>
      <Header />
      <main className="pt-[var(--navbar-h)]">
        <AuthScreen
          image={content("cuenta.acceso.image")}
          eyebrow={t("newPassword.eyebrow")}
          title={t("newPassword.title")}
          subtitle={t("newPassword.subtitle", { email: user.email ?? "" })}
        >
          <NewPasswordForm />
        </AuthScreen>
      </main>
      <Footer />
    </>
  );
}
