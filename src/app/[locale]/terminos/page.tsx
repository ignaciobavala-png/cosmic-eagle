import { setRequestLocale } from "next-intl/server";
import { LegalPage, legalMetadata } from "@/components/ui/LegalPage";

/** ISR: el texto lo edita la clienta desde /admin/legales, que revalida esta
 * ruta al guardar. */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terminos">) {
  const { locale } = await params;
  return legalMetadata("terminos", locale);
}

export default async function TerminosPage({
  params,
}: PageProps<"/[locale]/terminos">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage slug="terminos" locale={locale === "en" ? "en" : "es"} />;
}
