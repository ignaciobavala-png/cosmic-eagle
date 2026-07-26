"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";

export type TripFormState = { error: string | null };

function parseTripForm(formData: FormData) {
  const title = formData.get("title");
  const description = formData.get("description");
  const location = formData.get("location");
  const start_date = formData.get("start_date");
  const end_date = formData.get("end_date");
  const capacity = formData.get("capacity");
  const price = formData.get("price");
  const status = formData.get("status");

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof start_date !== "string" ||
    !start_date ||
    typeof end_date !== "string" ||
    !end_date ||
    typeof capacity !== "string" ||
    !capacity ||
    typeof status !== "string"
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
    },
  } as const;
}

export async function createTrip(
  _prevState: TripFormState,
  formData: FormData
): Promise<TripFormState> {
  const parsed = parseTripForm(formData);
  if (parsed.error) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("trips").insert(parsed.data);
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
  const { error } = await supabase
    .from("trips")
    .update(parsed.data)
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
