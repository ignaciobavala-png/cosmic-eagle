"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import { parseSchedule, sortSchedule } from "@/lib/trip-schedule";

export type TripFormState = { error: string | null };

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
    typeof type !== "string"
  ) {
    return { error: "Completá los campos requeridos.", data: null } as const;
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
      type: type as Enums<"trip_type">,
      terms: typeof terms === "string" && terms.trim() ? terms.trim() : null,
      schedule,
    },
  } as const;
}

const BUCKET = "trip-images";
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Sube la portada si vino un archivo nuevo. Devuelve `undefined` cuando no hay
 * archivo, para poder distinguir "no tocar la portada" de "portada vacia".
 * La escritura del bucket esta restringida a admin por RLS (ver la migracion
 * 20260731182000_trip_cover_image.sql), asi que no hace falta chequear el rol
 * aca de nuevo: si no es admin, el upload falla.
 */
async function uploadCover(
  supabase: SupabaseClient,
  formData: FormData,
  currentUrl?: string | null
): Promise<{ error: string | null; url?: string }> {
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) return { error: null };

  if (!file.type.startsWith("image/")) {
    return { error: "La portada debe ser una imagen." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "La portada no puede superar los 5MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) {
    return { error: "No se pudo subir la portada. Probá de nuevo." };
  }

  // Reemplazo: borra la anterior para que el bucket no crezca sin limite.
  if (currentUrl?.includes(PUBLIC_PREFIX)) {
    const oldPath = currentUrl.split(PUBLIC_PREFIX)[1]?.split("?")[0];
    if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { error: null, url: publicUrl };
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

  revalidatePath("/admin/viajes");
  revalidatePath("/viajes");
  redirect("/admin/viajes");
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
    .select("image_url")
    .eq("id", id)
    .single();

  const cover = await uploadCover(supabase, formData, current?.image_url);
  if (cover.error) return { error: cover.error };

  // Sin archivo nuevo la portada queda como esta: no se pisa con null.
  const { error } = await supabase
    .from("trips")
    .update(cover.url ? { ...parsed.data, image_url: cover.url } : parsed.data)
    .eq("id", id);
  if (error)
    return { error: `No se pudo actualizar el viaje: ${error.message}` };

  revalidatePath("/admin/viajes");
  revalidatePath("/viajes");
  redirect("/admin/viajes");
}

export async function deleteTrip(id: string) {
  const supabase = await createClient();
  await supabase.from("trips").delete().eq("id", id);
  revalidatePath("/admin/viajes");
  revalidatePath("/viajes");
}
