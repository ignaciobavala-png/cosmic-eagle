import type { Enums } from "@/lib/supabase/types";

export type TripType = Enums<"trip_type">;

/**
 * Retiros y ceremonias son la misma tabla (`trips`) con un enum `type`, pero en
 * el admin son dos secciones separadas: la clienta entra a crear "una ceremonia",
 * no "un viaje de tipo ceremonia". Todo lo que cambia entre uno y otro (rutas,
 * titulos, copy) vive aca para no repetir el `TYPE_LABEL` suelto en cada pagina.
 */
export const TRIP_TYPES = {
  retiro: {
    value: "retiro",
    label: "Retiro",
    plural: "Retiros",
    adminPath: "/admin/retiros",
    newLabel: "Nuevo retiro",
    newTitle: "Nuevo retiro",
    editTitle: "Editar retiro",
    emptyHint: "No hay retiros creados todavía.",
  },
  ceremonia: {
    value: "ceremonia",
    label: "Ceremonia",
    plural: "Ceremonias",
    adminPath: "/admin/ceremonias",
    newLabel: "Nueva ceremonia",
    newTitle: "Nueva ceremonia",
    editTitle: "Editar ceremonia",
    emptyHint: "No hay ceremonias creadas todavía.",
  },
} as const satisfies Record<
  TripType,
  {
    value: TripType;
    label: string;
    plural: string;
    adminPath: string;
    newLabel: string;
    newTitle: string;
    editTitle: string;
    emptyHint: string;
  }
>;

export const TRIP_TYPE_LIST = [TRIP_TYPES.retiro, TRIP_TYPES.ceremonia] as const;

export function isTripType(value: unknown): value is TripType {
  return value === "retiro" || value === "ceremonia";
}

/** Etiqueta para mostrar. Acepta `string` porque muchas queries no tipan la columna. */
export function tripTypeLabel(value: string): string {
  return isTripType(value) ? TRIP_TYPES[value].label : value;
}

/** Ruta del listado del admin al que pertenece un viaje. */
export function tripAdminPath(value: string): string {
  return isTripType(value) ? TRIP_TYPES[value].adminPath : TRIP_TYPES.retiro.adminPath;
}
