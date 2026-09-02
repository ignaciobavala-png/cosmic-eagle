import type { Enums } from "@/lib/supabase/types";

export type TripType = Enums<"trip_type">;

/**
 * Sesiones y viajes son la misma tabla (`trips`) con un enum `type`, pero en
 * el admin son dos secciones separadas: la clienta entra a crear "una sesion",
 * no "un viaje de tipo sesion". Todo lo que cambia entre uno y otro (rutas,
 * titulos, copy) vive aca para no repetir el `TYPE_LABEL` suelto en cada pagina.
 *
 * Ojo con los valores del enum: en la base siguen siendo `retiro` y `ceremonia`,
 * los nombres con los que nacio el schema. Lo que cambio (entrega de Julia del
 * 02/09) es como se llaman de cara a la gente: "Ceremonias" paso a ser
 * "Sesiones" y "Retiros" a "Viajes", en el sitio y en el panel. Renombrar el
 * enum obligaria a una migracion y a tocar cada query; la etiqueta es lo que se
 * lee, y vive aca.
 */
export const TRIP_TYPES = {
  retiro: {
    value: "retiro",
    label: "Viaje",
    plural: "Viajes",
    adminPath: "/admin/viajes",
    newLabel: "Nuevo viaje",
    newTitle: "Nuevo viaje",
    editTitle: "Editar viaje",
    emptyHint: "No hay viajes creados todavía.",
  },
  ceremonia: {
    value: "ceremonia",
    label: "Sesión",
    plural: "Sesiones",
    adminPath: "/admin/sesiones",
    newLabel: "Nueva sesión",
    newTitle: "Nueva sesión",
    editTitle: "Editar sesión",
    emptyHint: "No hay sesiones creadas todavía.",
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

/** Sesiones primero: es la puerta de entrada, el viaje es el paso siguiente. */
export const TRIP_TYPE_LIST = [TRIP_TYPES.ceremonia, TRIP_TYPES.retiro] as const;

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
