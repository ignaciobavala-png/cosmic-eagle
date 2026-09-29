import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { fontClassName } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "Cosmic Eagle | Sabiduría Cósmica para la Evolución Humana",
  description:
    "Cosmic Eagle explora el potencial más profundo de la conciencia humana. A través de experiencias inmersivas, enseñanzas y prácticas de integración, reconectamos con la inteligencia del alma.",
};

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
