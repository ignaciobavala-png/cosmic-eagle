import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <>
      <Header />
      <main className="pt-[var(--navbar-h)] min-h-screen flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-nebula-glow blur-[120px] opacity-30" />

        <div className="relative z-10 text-center px-5 flex flex-col items-center">
          <span className="font-display text-[120px] md:text-[180px] leading-none text-primary-fixed-dim/20 font-medium">
            404
          </span>
          <h1 className="font-display text-[32px] md:text-[40px] font-medium text-primary-fixed-dim -mt-8 mb-4">
            {t("title")}
          </h1>
          <p className="text-on-surface-variant max-w-md mb-10 leading-relaxed">
            {t("body")}
          </p>
          <Link
            href="/"
            className="px-8 py-4 bg-primary-container text-on-primary text-sm font-semibold tracking-[0.1em] rounded-full hover:shadow-[0_0_20px_rgba(227,195,125,0.5)] transition-all duration-300"
          >
            {t("cta")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
