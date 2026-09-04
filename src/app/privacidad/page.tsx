import { LegalPage, legalMetadata } from "@/components/ui/LegalPage";

/** ISR: el texto lo edita la clienta desde /admin/legales, que revalida esta
 * ruta al guardar. */
export const revalidate = 3600;

export const generateMetadata = () => legalMetadata("privacidad");

export default function PrivacidadPage() {
  return <LegalPage slug="privacidad" />;
}
