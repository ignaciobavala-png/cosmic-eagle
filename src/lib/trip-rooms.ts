/**
 * Tipos de habitación de un retiro (pedido de Sofía, 27/10): "private room",
 * "shared room", "healers & artists", cada una con su precio. Viven en
 * `trips.room_options` (jsonb) y sólo se muestran en el detalle público: el
 * monto que cobra el embudo sigue siendo `trips.price`.
 */
export type RoomOption = { label: string; price: number };

export const MAX_ROOM_OPTIONS = 6;
export const MAX_GALLERY_IMAGES = 12;

/** Lee el jsonb de la base sin confiar en su forma. */
export function parseRoomOptions(raw: unknown): RoomOption[] {
  if (!Array.isArray(raw)) return [];
  const out: RoomOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { label, price } = item as { label?: unknown; price?: unknown };
    if (typeof label !== "string" || !label.trim()) continue;
    const n = Number(price);
    if (!Number.isFinite(n) || n < 0) continue;
    out.push({ label: label.trim().slice(0, 60), price: n });
  }
  return out.slice(0, MAX_ROOM_OPTIONS);
}
