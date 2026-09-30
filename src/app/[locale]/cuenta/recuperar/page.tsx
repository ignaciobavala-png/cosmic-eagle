import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthScreen } from "@/components/ui/AuthScreen";
import { getSiteContent } from "@/lib/site-content";
import { RecoverForm } from "../RecoverForm";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cuenta/recuperar">): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Cuenta");

  return {
    title: t("meta.recoverTitle"),
    robots: { index: false },
  };
}

export default async function RecuperarPage({
  params,
}: PageProps<"/[locale]/cuenta/recuperar">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Cuenta");
  const content = await getSiteContent();

  return (
    <>
      <Header />
      <main className="pt-[var(--navbar-h)]">
        <AuthScreen
          image={content("cuenta.acceso.image")}
          eyebrow={t("recover.eyebrow")}
          title={t("recover.title")}
          subtitle={t("recover.subtitle")}
          footer={
            <Link href="/cuenta" className="text-primary-container underline">
              {t("recover.back")}
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
