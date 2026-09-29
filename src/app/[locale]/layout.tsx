import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site-url";
import { fontClassName } from "../fonts";
import "../globals.css";

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;

  return {
    metadataBase: new URL(SITE_URL),
    title: "Cosmic Eagle | Sabiduría Cósmica para la Evolución Humana",
    description:
      "Cosmic Eagle explora el potencial más profundo de la conciencia humana. A través de experiencias inmersivas, enseñanzas y prácticas de integración, reconectamos con la inteligencia del alma.",
    // El castellano va sin prefijo y el ingles con `/en` (docs/I18N.md §2).
    // `x-default` apunta a la version en castellano, que es la que recibe quien
    // todavia no eligio idioma.
    alternates: {
      languages: {
        es: "/",
        en: "/en",
        "x-default": "/",
      },
    },
    // Mientras el ingles no este publicado (boton apagado), `/en` no se indexa:
    // existe para trabajarlo, no para aparecer en Google a medias.
    ...(locale === "en"
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

/** Las dos versiones se prerenderizan: es lo que mantiene la home en `○`. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={fontClassName}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
