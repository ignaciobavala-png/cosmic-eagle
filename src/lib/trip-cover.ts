import type { createClient } from "./supabase/server";

/**
 * La portada de un viaje: el estandar de recorte y la subida al bucket.
 *
 * Se sube desde **dos lugares** — el form del viaje (`/admin/experiencias/...`) y la
 * seccion Portadas de `/admin/multimedia` — y por eso vive aca y no en uno de
 * los dos: dos implementaciones se separan en cuanto alguien toca una.
 *
 * El recorte y el porque de 16:9 estan en `docs/PORTADAS.md`.
 */

/** Toda portada se guarda en 16:9. La recorta el browser antes de subirla. */
export const TRIP_COVER_ASPECT = 16 / 9;
export const TRIP_COVER_MAX_PX = 1600;

const BUCKET = "trip-images";
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Sube la portada y devuelve su URL publica. La escritura del bucket esta
 * restringida a admin por RLS (migracion `20260731182000_trip_cover_image.sql`),
 * asi que no hace falta chequear el rol de nuevo: si no es admin, falla el
 * upload.
 *
 * `currentUrl` es la portada que se reemplaza: se borra despues de subir la
 * nueva para que el bucket no crezca sin limite.
 */
export async function uploadTripCover(
  supabase: SupabaseClient,
  file: File,
  currentUrl?: string | null
): Promise<{ error: string | null; url?: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "La portada debe ser una imagen." };
  }

  // El bucket es publico y un SVG servido inline puede llevar script adentro.
  if (file.type === "image/svg+xml") {
    return { error: "Los SVG no están permitidos. Sube JPG, PNG o WebP." };
  }

  // Llega ya recortada y comprimida del browser; el tope es la red de
  // contencion por si la compresion no corrio y subio el original.
  if (file.size > 5 * 1024 * 1024) {
    return { error: "La portada no puede superar los 5MB." };
  }

  // La extension sale del tipo real y no del nombre del archivo.
  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "webp";
  // Nombre nuevo en cada subida: con un path fijo la URL no cambia y el CDN
  // sigue sirviendo la imagen vieja despues de reemplazarla.
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) {
    return { error: "No se pudo subir la portada. Prueba de nuevo." };
  }

  if (currentUrl?.includes(PUBLIC_PREFIX)) {
    const oldPath = currentUrl.split(PUBLIC_PREFIX)[1]?.split("?")[0];
    if (oldPath) {
      await supabase.storage.from(BUCKET).remove([decodeURIComponent(oldPath)]);
    }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { error: null, url: publicUrl };
}
