"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import { parseSchedule, sortSchedule } from "@/lib/trip-schedule";
import { TRIP_TYPES, isTripType, tripAdminPath, tripTypeLabel } from "@/lib/trip-type";
import { isTripCategory } from "@/lib/trip-fields";
import { uploadTripCover } from "@/lib/trip-cover";

export type TripFormState = { error: string | null };

/**
 * Sesiones y viajes tienen listado propio en el admin y comparten el listado
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

/** Campo de texto opcional: `null` si vino vacio, sin espacios de mas. */
function optionalText(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseTripForm(formData: FormData) {
  const title = formData.get("title");
  const description = formData.get("description");
  const country = formData.get("country");
  const city = formData.get("city");
  const start_date = formData.get("start_date");
  const end_date = formData.get("end_date");
  const capacity = formData.get("capacity");
  const price = formData.get("price");
  const deposit = formData.get("deposit_amount");
  const status = formData.get("status");
  const type = formData.get("type");
  const terms = formData.get("terms");
  const paymentUrl = formData.get("payment_url");
  const schedule = parseScheduleField(formData.get("schedule"));

  if (
    typeof title !== "string" ||
    typeof country !== "string" ||
    !country.trim() ||
    typeof city !== "string" ||
    !city.trim() ||
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

  // La seña es opcional (vacío = este viaje se paga completo), pero si está
  // tiene que ser menor que el total: una "seña" igual o mayor al precio no
  // reserva nada, cobra todo. La base tiene el mismo CHECK; esto existe para
  // que el error se lea en el formulario y no como un fallo de Postgres.
  const priceValue = typeof price === "string" && price ? Number(price) : 0;
  const depositValue =
    typeof deposit === "string" && deposit.trim() ? Number(deposit) : null;

  if (depositValue !== null && !(depositValue > 0 && depositValue < priceValue)) {
    return {
      error:
        "La seña tiene que ser mayor que cero y menor que el precio total. Dejala vacía si el viaje se paga completo.",
      data: null,
    } as const;
  }

  // El link de pago se pega desde Encuadrado, asi que llega tipeado a mano.
  // Se exige `https://` y no solo "que parezca una URL": este valor termina en
  // el `href` de un boton, y un `javascript:` ahi seria un XSS. La base tiene el
  // mismo CHECK; esto existe para que el error se lea en el formulario.
  const paymentUrlValue =
    typeof paymentUrl === "string" && paymentUrl.trim()
      ? paymentUrl.trim()
      : null;

  if (paymentUrlValue !== null && !/^https:\/\/[^\s]+$/.test(paymentUrlValue)) {
    return {
      error: "El link de pago tiene que empezar con https://",
      data: null,
    } as const;
  }

  // El mapa se pega desde Google Maps, o sea tipeado a mano y a parar en un
  // `href`. Mismo criterio que el link de pago: `https://` o nada.
  const mapUrlValue = optionalText(formData, "map_url");

  if (mapUrlValue !== null && !/^https:\/\/[^\s]+$/.test(mapUrlValue)) {
    return { error: "El link del mapa tiene que empezar con https://", data: null } as const;
  }

  // Un valor raro en el desplegable cae a 'mixto', que es el default de la
  // columna: la categoria no puede tumbar el guardado de un viaje entero.
  const rawCategory = formData.get("category");
  const categoryValue = isTripCategory(rawCategory) ? rawCategory : "mixto";

  return {
    error: null,
    data: {
      // El titulo es OPCIONAL desde la correccion del 03/09 ("por el momento el
      // cliente prefiere no poner titulo"), pero la columna es NOT NULL y el
      // nombre del viaje se usa en todos lados: el asunto de cada correo, el
      // panel, la pantalla del postulante y el `<title>` de la pagina. Asi que
      // vacio no se guarda vacio: se deriva del tipo y la ciudad
      // ("Sesion Cosmica en Santiago"), que describe sin inventar copy.
      title: title.trim() || `${tripTypeLabel(type)} en ${city.trim()}`,
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,
      // `location` NO se manda: desde la migracion 20260903060000 es una columna
      // generada a partir de estas tres. Escribirla es un error de Postgres.
      country: country.trim(),
      city: city.trim(),
      area: optionalText(formData, "area"),
      venue_type: optionalText(formData, "venue_type"),
      address: optionalText(formData, "address"),
      map_url: mapUrlValue,
      category: categoryValue,
      start_time: optionalText(formData, "start_time"),
      end_time: optionalText(formData, "end_time"),
      includes: optionalText(formData, "includes"),
      arrival_notes: optionalText(formData, "arrival_notes"),
      packing_list: optionalText(formData, "packing_list"),
      start_date,
      end_date,
      capacity: Number(capacity),
      price: priceValue,
      deposit_amount: depositValue,
      status: status as Enums<"trip_status">,
      type,
      terms: typeof terms === "string" && terms.trim() ? terms.trim() : null,
      payment_url: paymentUrlValue,
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
