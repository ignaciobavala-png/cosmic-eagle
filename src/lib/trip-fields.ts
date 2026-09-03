import type { Enums } from "@/lib/supabase/types";

/**
 * Los campos de logistica que se agregaron el 03/09 (migracion
 * `20260903060000_trip_logistics_fields.sql`), y lo que cambia entre una Sesion
 * y un Viaje.
 *
 * Vive suelto de `trip-type.ts` porque eso describe *que es* cada tipo (rutas,
 * titulos del panel) y esto describe *que se le pide* — son dos ejes distintos
 * y mezclarlos hace que agregar un campo obligue a tocar la identidad del tipo.
 */

export type TripCategory = Enums<"trip_category">;

export const TRIP_CATEGORIES: { value: TripCategory; label: string }[] = [
  { value: "mixto", label: "Mixto" },
  { value: "mujeres", label: "Solo mujeres" },
  { value: "hombres", label: "Solo hombres" },
  { value: "avanzados", label: "Avanzados" },
];

export function isTripCategory(value: unknown): value is TripCategory {
  return TRIP_CATEGORIES.some((c) => c.value === value);
}

/** Etiqueta para mostrar. `mixto` no se muestra: es el default y no dice nada. */
export function tripCategoryLabel(value: string): string | null {
  if (value === "mixto") return null;
  return TRIP_CATEGORIES.find((c) => c.value === value)?.label ?? null;
}

/**
 * "Que incluye" (traslado, comidas, alojamiento) es propio del Viaje.
 *
 * Es la unica diferencia de CAMPOS entre los dos tipos, y sale de ellas mismas
 * (sesion del 06/08: "no existe como campo y es tipico de retiro, no de
 * ceremonia"). Lo demas cambia de redaccion, no de existencia.
 *
 * **Lo que sigue sin confirmar es si una Sesion es siempre de un dia.** Si lo
 * fuera, se le pediria una sola fecha y `end_date` se derivaria; mientras no lo
 * digan, el formulario sigue pidiendo las dos para los dos tipos.
 */
export function tripHasIncludes(type: string): boolean {
  return type === "retiro";
}

/** Formatea `time` de Postgres ("11:00:00") como "11:00". */
export function formatTripTime(value: string | null): string | null {
  return value ? value.slice(0, 5) : null;
}

/** "11:00 a 21:00", o sólo la que haya. `null` si no hay ninguna. */
export function formatTripHours(
  start: string | null,
  end: string | null
): string | null {
  const from = formatTripTime(start);
  const to = formatTripTime(end);

  if (from && to) return `${from} a ${to}`;
  return from ?? (to ? `hasta ${to}` : null);
}
