import type { Enums } from "@/lib/supabase/types";
import { parseSchedule, sortSchedule } from "@/lib/trip-schedule";
import { isTripType, tripTypeLabel } from "@/lib/trip-type";
import { isTripCategory } from "@/lib/trip-fields";
import { MAX_GALLERY_IMAGES, parseRoomOptions } from "@/lib/trip-rooms";

/**
 * Validacion del formulario de un viaje o sesion. Vive aca (y no dentro del
 * "use server" de `experiencias/actions.ts`) para que el panel y el asistente de
 * IA usen EXACTAMENTE las mismas reglas: una regla nueva se escribe una vez.
 */

/**
 * El programa llega como un unico campo con el JSON que arma ScheduleEditor.
 * Nunca se confia en el: se parsea con el mismo validador que usa la lectura y
 * se guarda ordenado por hora, asi el orden no depende de como se cargo.
 */
export function parseScheduleField(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    return sortSchedule(parseSchedule(JSON.parse(value)));
  } catch {
    return [];
  }
}

/** Campo de texto opcional: `null` si vino vacio, sin espacios de mas. */
export function optionalText(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseTripForm(formData: FormData) {
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

  // Galería y habitaciones sólo viajan en los retiros: en una Sesión el form ni
  // los dibuja, y sin `has` un guardado la pisaría con vacío.
  const extras: { gallery?: string[]; room_options?: { label: string; price: number }[] } = {};
  if (formData.has("gallery")) {
    let urls: unknown = [];
    try {
      urls = JSON.parse(String(formData.get("gallery")));
    } catch {}
    // Sólo URLs https; la subida la hace el browser al bucket público.
    extras.gallery = (Array.isArray(urls) ? urls : [])
      .filter((u): u is string => typeof u === "string" && /^https:\/\/[^\s]+$/.test(u))
      .slice(0, MAX_GALLERY_IMAGES);
  }
  if (formData.has("room_options")) {
    let rooms: unknown = [];
    try {
      rooms = JSON.parse(String(formData.get("room_options")));
    } catch {}
    extras.room_options = parseRoomOptions(rooms);
  }

  return {
    error: null,
    data: {
      ...extras,
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
      // La versión en inglés: todo opcional, vacío = cae al castellano.
      title_en: optionalText(formData, "title_en"),
      description_en: optionalText(formData, "description_en"),
      venue_type_en: optionalText(formData, "venue_type_en"),
      includes_en: optionalText(formData, "includes_en"),
      arrival_notes_en: optionalText(formData, "arrival_notes_en"),
      packing_list_en: optionalText(formData, "packing_list_en"),
      terms_en: optionalText(formData, "terms_en"),
    },
  } as const;
}

