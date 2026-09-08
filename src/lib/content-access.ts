/**
 * Niveles de acceso a la biblioteca. Ver docs/BIBLIOTECA.md §1.4 y la migracion
 * 20260908160000_content_access_levels.sql.
 *
 * **El orden del arreglo es el orden del enum en Postgres**, y de ahi sale la
 * comparacion: `publico < miembros < programa`. Si se agrega un nivel, va en su
 * lugar de la escala en los dos lados o el muro deja pasar lo que no debe.
 *
 * Ojo: esto NO es el gate. El gate vive en la policy `articles_select_published`
 * y en `private.content_level()`. Lo de aca es lo que se muestra: la etiqueta
 * del panel, el candado de la tarjeta y el texto del muro.
 */

import type { Enums } from "@/lib/supabase/types";

export type ContentAccessLevel = Enums<"content_access_level">;

export const CONTENT_ACCESS_LEVELS = [
  {
    value: "publico",
    label: "Abierto",
    // Lo que lee la clienta al elegir el nivel en /admin/contenidos.
    hint: "Lo puede leer cualquiera, con o sin cuenta.",
  },
  {
    value: "miembros",
    label: "Con cuenta",
    hint: "Hay que estar registrado para leerlo.",
  },
  {
    value: "programa",
    label: "Del programa",
    hint: "Solo quien fue habilitado desde el panel o canjeó un código.",
  },
] as const satisfies readonly {
  value: ContentAccessLevel;
  label: string;
  hint: string;
}[];

/** Los dos niveles que una habilitacion puede otorgar: `publico` no habilita nada. */
export const GRANTABLE_LEVELS = CONTENT_ACCESS_LEVELS.filter(
  (level) => level.value !== "publico"
);

const RANK: Record<ContentAccessLevel, number> = {
  publico: 0,
  miembros: 1,
  programa: 2,
};

export function isContentAccessLevel(value: unknown): value is ContentAccessLevel {
  return typeof value === "string" && value in RANK;
}

export function contentAccessLabel(value: string): string {
  return (
    CONTENT_ACCESS_LEVELS.find((level) => level.value === value)?.label ?? value
  );
}

/**
 * Si quien mira alcanza el nivel que pide el texto. Es el mismo `<=` que hace
 * la policy, repetido en el cliente para decidir si la tarjeta va con candado.
 *
 * **No sustituye a la RLS**: el cuerpo del articulo no llega al browser cuando
 * la respuesta es `false`, porque la base no lo devuelve.
 */
export function canRead(
  required: ContentAccessLevel,
  viewer: ContentAccessLevel
): boolean {
  return RANK[required] <= RANK[viewer];
}

/**
 * El copy del muro es de la clienta (docs/BIBLIOTECA.md §1.4), literal. No se
 * reescribe sin consultar.
 */
export const CONTENT_WALL_COPY =
  "Estos contenidos se entregan a quienes participan del programa evolutivo. Para acceder, es necesario completar el formulario de postulación y participar de una primera experiencia.";

/** Los resultados que devuelve `public.redeem_access_code`. */
export type RedeemResult =
  | "ok"
  | "invalido"
  | "vencido"
  | "agotado"
  | "sin_sesion";

export function redeemMessage(result: RedeemResult): string {
  switch (result) {
    case "ok":
      return "Listo: tu cuenta quedó habilitada.";
    case "vencido":
      return "Ese código ya venció. Escribinos y te damos uno nuevo.";
    case "agotado":
      return "Ese código ya se usó todas las veces disponibles.";
    case "sin_sesion":
      return "Iniciá sesión para canjear el código.";
    default:
      return "No encontramos ese código. Revisá que esté bien escrito.";
  }
}
