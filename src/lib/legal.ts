import { createPublicClient } from "./supabase/public";

export type LegalSlug = (typeof LEGAL_DOCUMENTS)[number]["slug"];

export type LegalDocument = {
  slug: string;
  title: string;
  body: string;
  isProvisional: boolean;
  updatedAt: string;
};

/**
 * Los documentos legales del sitio.
 *
 * **El registro vive en el código, no en la base** — igual que los slots de
 * `site-content.ts` y al revés de `faqs`, `articles` y `testimonials`. La razón
 * es que cada documento es una RUTA: un documento nuevo necesita un `page.tsx`,
 * una entrada en el footer y su propia migración. Que la tabla no acepte insert
 * ni delete (ni siquiera del admin) es la otra mitad de la misma decisión: nadie
 * puede borrar /privacidad desde el panel y dejar el link del footer en 404.
 *
 * `descripcion` es lo que lee la clienta en /admin/legales; no sale en el sitio.
 */
export const LEGAL_DOCUMENTS = [
  {
    slug: "privacidad",
    label: "Privacidad",
    href: "/privacidad",
    descripcion:
      "Qué información se le pide a quien se inscribe, quién la ve y qué puede pedir. Es la página que respalda las preguntas de salud del formulario.",
  },
  {
    slug: "terminos",
    label: "Términos de Servicio",
    href: "/terminos",
    descripcion:
      "Las condiciones de inscripción, pago y participación, y la aclaración de que las experiencias no son un tratamiento médico.",
  },
] as const satisfies readonly {
  slug: string;
  label: string;
  href: string;
  descripcion: string;
}[];

export function isLegalSlug(value: unknown): value is LegalSlug {
  return LEGAL_DOCUMENTS.some((d) => d.slug === value);
}

export function legalDocumentMeta(slug: LegalSlug) {
  return LEGAL_DOCUMENTS.find((d) => d.slug === slug)!;
}

/**
 * Un documento por su slug, o `null` si la fila todavía no está sembrada.
 *
 * Lee con el cliente **sin cookies** a propósito: son públicos, y así las dos
 * páginas pueden ser estáticas con ISR (ver src/lib/supabase/public.ts). Los
 * server actions de /admin/legales hacen `revalidatePath` de la ruta pública, o
 * la clienta guarda y no ve el cambio hasta dentro de una hora.
 */
export async function getLegalDocument(
  slug: LegalSlug
): Promise<LegalDocument | null> {
  const { data } = await createPublicClient()
    .from("legal_documents")
    .select("slug, title, body, is_provisional, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;

  return {
    slug: data.slug,
    title: data.title,
    body: data.body,
    isProvisional: data.is_provisional,
    updatedAt: data.updated_at,
  };
}
