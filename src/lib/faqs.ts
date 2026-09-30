import { createPublicClient } from "./supabase/public";
import type { Database } from "./supabase/types";

export type FaqPlacement = Database["public"]["Enums"]["faq_placement"];

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

/**
 * Los juegos de preguntas frecuentes.
 *
 * Sofia escribio DOS en los anexos de `web-cosmic-journey-ES.md`, uno por tipo
 * de experiencia, con respuestas distintas para preguntas parecidas (la
 * preparacion previa son cinco dias en Sesiones y una semana en Viajes). El
 * tercero, "general", es para lo que no es de un tipo ni del otro.
 *
 * El `label` es lo que lee la clienta en el panel; `where` le dice donde va a
 * caer lo que cargue.
 */
export const FAQ_PLACEMENTS = [
  {
    value: "general",
    label: "Generales",
    where: "Arriba de todo en la página de Preguntas frecuentes.",
  },
  {
    value: "sesiones",
    label: "Sesiones Cósmicas",
    where: "El bloque de las experiencias de un día.",
  },
  {
    value: "viajes",
    label: "Viajes Cósmicos",
    where: "El bloque de las experiencias de una semana.",
  },
] as const satisfies readonly {
  value: FaqPlacement;
  label: string;
  where: string;
}[];

export function isFaqPlacement(value: unknown): value is FaqPlacement {
  return FAQ_PLACEMENTS.some((p) => p.value === value);
}

export function faqPlacementLabel(value: FaqPlacement) {
  return FAQ_PLACEMENTS.find((p) => p.value === value)!.label;
}

/**
 * Todas las FAQs publicadas, agrupadas por juego y en el orden que fijo la
 * clienta.
 *
 * Lee con el cliente **sin cookies** a proposito: son datos publicos y asi
 * /faqs puede ser estatica con ISR (ver src/lib/supabase/public.ts).
 *
 * Las despublicadas no llegan: las filtra la policy, no esta funcion.
 *
 * Devuelve el mapa completo aunque un juego venga vacio; quien llama decide
 * si dibuja el bloque, igual que con los testimonios.
 */
export async function getFaqs(
  locale = "es"
): Promise<Record<FaqPlacement, Faq[]>> {
  const { data } = await createPublicClient()
    .from("faqs")
    .select("id, question, answer, question_en, answer_en, placement")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const grouped: Record<FaqPlacement, Faq[]> = {
    general: [],
    sesiones: [],
    viajes: [],
  };

  for (const row of data ?? []) {
    // En inglés, la pregunta y la respuesta van juntas: con sólo una de las
    // dos traducida el par quedaría en dos idiomas, así que cae entero al
    // castellano (mismo criterio que los testimonios).
    const en = locale === "en" && !!row.question_en?.trim() && !!row.answer_en?.trim();
    grouped[row.placement].push({
      id: row.id,
      question: en ? row.question_en! : row.question,
      answer: en ? row.answer_en! : row.answer,
    });
  }

  return grouped;
}
