"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  SITE_CONTENT_TAG,
  SITE_GROUPS,
  SITE_SLOTS,
  isSlotKey,
  type Slot,
} from "@/lib/site-content";

export type SlotState = { error: string | null };

const BUCKET = "site-assets";
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function findSlot(key: string): Slot | null {
  return SITE_SLOTS.find((slot) => slot.key === key) ?? null;
}

/**
 * Invalida el cache de contenido y las rutas que muestran el grupo del slot.
 * El tag alcanza para la lectura, pero las paginas estaticas (/nosotros) hay
 * que revalidarlas igual o siguen sirviendo el HTML viejo.
 *
 * `updateTag` y no `revalidateTag`: el segundo deja servir el valor viejo
 * mientras revalida en background, y aca la clienta guarda y mira el resultado
 * en el acto — tiene que ver lo que acaba de cargar, no lo anterior.
 */
function revalidateSlot(key: string) {
  updateTag(SITE_CONTENT_TAG);

  const group = SITE_GROUPS.find((g) => g.slots.some((s) => s.key === key));
  if (group) revalidatePath(group.href);
}

/** Borra el asset anterior si vivia en nuestro bucket, para no dejar huerfanos. */
async function removeStored(supabase: SupabaseClient, url: string | undefined) {
  if (!url?.includes(PUBLIC_PREFIX)) return;

  const path = url.split(PUBLIC_PREFIX)[1]?.split("?")[0];
  if (path) await supabase.storage.from(BUCKET).remove([decodeURIComponent(path)]);
}

async function currentValue(supabase: SupabaseClient, key: string) {
  const { data } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  return data?.value;
}

/**
 * Guarda un slot. La key llega del form pero se valida contra el registro: solo
 * se escriben slots que existen en el codigo, nunca una key arbitraria.
 * El upload y el write estan restringidos a admin por RLS, asi que no hace
 * falta chequear el rol aca de nuevo — igual el layout del admin ya lo hizo.
 */
export async function saveSlot(
  _prevState: SlotState,
  formData: FormData
): Promise<SlotState> {
  const key = formData.get("key");
  if (typeof key !== "string" || !isSlotKey(key)) {
    return { error: "Ese contenido no existe." };
  }

  const slot = findSlot(key);
  if (!slot) return { error: "Ese contenido no existe." };

  const supabase = await createClient();
  const previous = await currentValue(supabase, key);

  let value: string;

  if (slot.type === "image") {
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return { error: "Elegí una imagen para subir." };
    }

    if (!file.type.startsWith("image/")) {
      return { error: "El archivo tiene que ser una imagen." };
    }

    // El bucket es publico y un SVG servido inline puede llevar script adentro.
    // El bucket tambien lo rechaza por `allowed_mime_types`; esto es para que el
    // mensaje diga algo util en vez del error crudo de Storage.
    if (file.type === "image/svg+xml") {
      return { error: "Los SVG no están permitidos. Subí JPG, PNG o WebP." };
    }

    // Llega ya comprimida del browser; el tope es una red de contencion por si
    // la compresion no corrio (SVG, o el fallback al original).
    if (file.size > 5 * 1024 * 1024) {
      return { error: "La imagen no puede superar los 5MB." };
    }

    // Normalmente llega WebP del compresor, pero si la compresion fallo sube el
    // original: la extension sale del tipo real, no se asume.
    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "webp";
    // Nombre nuevo en cada subida a proposito: con un path fijo por slot la URL
    // no cambia y el CDN sigue sirviendo la imagen vieja despues de reemplazarla.
    const path = `${key}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      return { error: "No se pudo subir la imagen. Probá de nuevo." };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    value = publicUrl;
  } else {
    const raw = formData.get("value");

    if (typeof raw !== "string" || !raw.trim()) {
      return { error: "El texto no puede quedar vacío." };
    }

    // Los saltos de linea son significativos en los titulos (marcan el quiebre
    // en desktop), asi que solo se recortan los extremos.
    value = raw.trim();
  }

  const { error } = previous
    ? await supabase.from("site_content").update({ value }).eq("key", key)
    : await supabase.from("site_content").insert({ key, value });

  if (error) {
    return { error: `No se pudo guardar: ${error.message}` };
  }

  if (slot.type === "image") await removeStored(supabase, previous);

  revalidateSlot(key);
  return { error: null };
}

/** Vuelve el slot a su valor original: borra la fila y el asset subido. */
export async function resetSlot(
  _prevState: SlotState,
  formData: FormData
): Promise<SlotState> {
  const key = formData.get("key");
  if (typeof key !== "string" || !isSlotKey(key)) {
    return { error: "Ese contenido no existe." };
  }

  const supabase = await createClient();
  const previous = await currentValue(supabase, key);

  const { error } = await supabase.from("site_content").delete().eq("key", key);
  if (error) return { error: `No se pudo restaurar: ${error.message}` };

  await removeStored(supabase, previous);

  revalidateSlot(key);
  return { error: null };
}
