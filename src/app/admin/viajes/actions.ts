"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import { parseSchedule, sortSchedule } from "@/lib/trip-schedule";
import { TRIP_TYPES, isTripType, tripAdminPath } from "@/lib/trip-type";
import { uploadTripCover } from "@/lib/trip-cover";

export type TripFormState = { error: string | null };

/**
 * Retiros y ceremonias tienen listado propio en el admin y comparten el listado
 * publico, asi que cualquier escritura invalida las tres rutas.
 */
function revalidateTripPaths() {
  revalidatePath(TRIP_TYPES.retiro.adminPath);
  revalidatePath(TRIP_TYPES.ceremonia.adminPath);
  revalidatePath("/viajes");
}

/**
 * El programa llega como un unico campo con el JSON que arma ScheduleEditor.
 * Nunca se confia en el: se parsea con el mismo validador que usa la lectura y
 * se guarda ordenado por hora, asi el orden no depende de como se cargo.
 */
function parseScheduleField(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    return sortSchedule(parseSchedule(JSON.parse(value)));
  } catch {
    return [];
  }
}

function parseTripForm(formData: FormData) {
  const title = formData.get("title");
  const description = formData.get("description");
  const location = formData.get("location");
  const start_date = formData.get("start_date");
  const end_date = formData.get("end_date");
  const capacity = formData.get("capacity");
  const price = formData.get("price");
  const status = formData.get("status");
  const type = formData.get("type");
  const terms = formData.get("terms");
  const schedule = parseScheduleField(formData.get("schedule"));

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof start_date !== "string" ||
    !start_date ||
    typeof end_date !== "string" ||
    !end_date ||
    typeof capacity !== "string" ||
    !capacity ||
    typeof status !== "string" ||
    !isTripType(type)
  ) {
    return { error: "Completa los campos requeridos.", data: null } as const;
  }

  if (end_date < start_date) {
    return {
      error: "La fecha de fin no puede ser anterior a la de inicio.",
      data: null,
    } as const;
  }

  return {
    error: null,
    data: {
      title: title.trim(),
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,
      location:
        typeof location === "string" && location.trim()
          ? location.trim()
          : null,
      start_date,
      end_date,
      capacity: Number(capacity),
      price: typeof price === "string" && price ? Number(price) : 0,
      status: status as Enums<"trip_status">,
      type,
      terms: typeof terms === "string" && terms.trim() ? terms.trim() : null,
      schedule,
    },
  } as const;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

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

export async function deleteTrip(id: string) {
  const supabase = await createClient();
  await supabase.from("trips").delete().eq("id", id);
  revalidateTripPaths();
}
