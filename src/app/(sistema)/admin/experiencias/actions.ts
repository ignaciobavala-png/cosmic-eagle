"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TRIP_TYPES, tripAdminPath } from "@/lib/trip-type";
import { uploadTripCover } from "@/lib/trip-cover";
import { publicPath } from "@/i18n/public-path";
import { parseTripForm } from "@/lib/trip-form";

export type TripFormState = { error: string | null };

/**
 * Sesiones y viajes tienen listado propio en el admin y comparten el listado
 * publico, asi que cualquier escritura invalida las tres rutas.
 */
function revalidateTripPaths() {
  revalidatePath(TRIP_TYPES.retiro.adminPath);
  revalidatePath(TRIP_TYPES.ceremonia.adminPath);
  revalidatePath(publicPath("/viajes"), "page");
  revalidatePath(publicPath("/"), "page");
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * El bucket de las portadas. `trip-cover.ts` lo tiene igual, pero solo exporta
 * la subida (que es lo que se comparte con /admin/multimedia) y no un helper
 * para deducir la ruta desde la URL publica. Se repite aca, que es el unico
 * lugar que borra un viaje entero.
 */
const COVER_BUCKET = "trip-images";
const COVER_PUBLIC_PREFIX = `/storage/v1/object/public/${COVER_BUCKET}/`;

/**
 * Saca la portada del bucket. Sin esto cada viaje borrado deja su imagen
 * huerfana ocupando lugar para siempre: nadie vuelve a tener su URL.
 *
 * Si la URL no es del bucket (o no hay portada) no hace nada, y un fallo del
 * remove no se propaga: la fila ya no esta, el borrado fue exitoso igual.
 */
async function deleteTripCover(
  supabase: SupabaseClient,
  imageUrl: string | null | undefined
) {
  if (!imageUrl?.includes(COVER_PUBLIC_PREFIX)) return;

  const path = imageUrl.split(COVER_PUBLIC_PREFIX)[1]?.split("?")[0];
  if (!path) return;

  await supabase.storage
    .from(COVER_BUCKET)
    .remove([decodeURIComponent(path)]);
}

/**
 * Envuelve `uploadTripCover` para el form del viaje, donde la portada es un
 * campo mas del formulario y puede no venir. Devuelve `url: undefined` cuando
 * no hay archivo, para distinguir "no tocar la portada" de "portada vacia".
 */
async function uploadCover(
  supabase: SupabaseClient,
  formData: FormData,
  currentUrl?: string | null
): Promise<{ error: string | null; url?: string }> {
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) return { error: null };

  return uploadTripCover(supabase, file, currentUrl);
}

export async function createTrip(
  _prevState: TripFormState,
  formData: FormData
): Promise<TripFormState> {
  const parsed = parseTripForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();

  const cover = await uploadCover(supabase, formData);
  if (cover.error) return { error: cover.error };

  const { error } = await supabase
    .from("trips")
    .insert({ ...parsed.data, image_url: cover.url ?? null });
  if (error) return { error: `No se pudo crear el viaje: ${error.message}` };

  revalidateTripPaths();
  redirect(tripAdminPath(parsed.data.type));
}

export async function updateTrip(
  id: string,
  _prevState: TripFormState,
  formData: FormData
): Promise<TripFormState> {
  const parsed = parseTripForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("trips")
    .select("image_url, type")
    .eq("id", id)
    .single();

  const cover = await uploadCover(supabase, formData, current?.image_url);
  if (cover.error) return { error: cover.error };

  // El tipo no se edita: manda el que ya tiene el viaje en la base, no el que
  // llego en el form. Un retiro no se convierte en ceremonia por un hidden.
  const type = current?.type ?? parsed.data.type;

  // Sin archivo nuevo la portada queda como esta: no se pisa con null.
  const values = { ...parsed.data, type };
  const { error } = await supabase
    .from("trips")
    .update(cover.url ? { ...values, image_url: cover.url } : values)
    .eq("id", id);
  if (error)
    return { error: `No se pudo actualizar el viaje: ${error.message}` };

  revalidateTripPaths();
  redirect(tripAdminPath(type));
}

export type DeleteTripState = { error: string | null };

/**
 * Borra el viaje, y si sale bien se lleva tambien la portada del bucket.
 *
 * El error NO se descarta: `applications.trip_id` y `consents.trip_id` apuntan a
 * `trips` con ON DELETE RESTRICT, asi que un viaje con gente anotada no se puede
 * borrar y Postgres devuelve 23503. Tragarse ese error dejaba la fila en su
 * lugar, la pagina revalidada y a Estela apretando "Eliminar" tres veces
 * pensando que el panel estaba roto.
 */
export async function deleteTrip(
  id: string,
  _prevState: DeleteTripState,
  _formData: FormData
): Promise<DeleteTripState> {
  const supabase = await createClient();

  // La portada se relee antes de borrar la fila: despues del delete ya no hay
  // de donde sacar la URL.
  const { data: trip } = await supabase
    .from("trips")
    .select("image_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("trips").delete().eq("id", id);

  if (error) {
    // 23503 = foreign_key_violation. Es el caso ESPERABLE, no una falla: el
    // mensaje tiene que explicar la causa real y la salida que ya existe, que es
    // sacarlo de la vista con el estado del formulario, no borrarlo.
    if (error.code === "23503") {
      return {
        error:
          "No se puede eliminar un viaje que ya tiene gente inscripta: se perderían sus solicitudes y consentimientos. Para que deje de verse en el sitio, editalo y cambiale el estado a Borrador o Cerrado.",
      };
    }
    return { error: `No se pudo eliminar el viaje: ${error.message}` };
  }

  // La portada se borra despues de la fila y solo si el delete funciono: si
  // falla por RLS o por una FK, el viaje sigue en pie y con su imagen.
  await deleteTripCover(supabase, trip?.image_url);

  revalidateTripPaths();
  return { error: null };
}
