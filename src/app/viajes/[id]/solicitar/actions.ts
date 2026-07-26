"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ApplicationFormState = { error: string | null };

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function submitFirstTimeApplication(
  tripId: string,
  _prevState: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/cuenta?next=/viajes/${tripId}/solicitar`);

  const full_name = str(formData, "full_name");
  const age = str(formData, "age");
  const height = str(formData, "height");
  const weight = str(formData, "weight");
  const country = str(formData, "country");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  const occupation = str(formData, "occupation");

  if (
    !full_name ||
    !age ||
    !height ||
    !weight ||
    !country ||
    !email ||
    !phone ||
    !occupation
  ) {
    return { error: "Completá todos los campos requeridos." };
  }

  const { error } = await supabase.from("applications_first_time").insert({
    user_id: user.id,
    trip_id: tripId,
    full_name,
    age: Number(age),
    height,
    weight,
    country,
    email,
    phone,
    occupation,
    health_condition: bool(formData, "health_condition"),
    health_condition_detail: str(formData, "health_condition_detail") || null,
    stress_anxiety: bool(formData, "stress_anxiety"),
    stress_anxiety_detail: str(formData, "stress_anxiety_detail") || null,
    trauma: bool(formData, "trauma"),
    trauma_detail: str(formData, "trauma_detail") || null,
    substance_use: bool(formData, "substance_use"),
    substance_use_detail: str(formData, "substance_use_detail") || null,
    allergies: bool(formData, "allergies"),
    allergies_detail: str(formData, "allergies_detail") || null,
    spiritual_practice: bool(formData, "spiritual_practice"),
    spiritual_practice_detail: str(formData, "spiritual_practice_detail") || null,
    first_time_plants: bool(formData, "first_time_plants"),
    plants_detail: str(formData, "plants_detail") || null,
    has_themes: bool(formData, "has_themes"),
    themes_detail: str(formData, "themes_detail") || null,
    fears: bool(formData, "fears"),
    fears_detail: str(formData, "fears_detail") || null,
    comment: str(formData, "comment") || null,
  });

  if (error) {
    return { error: `No se pudo enviar la solicitud: ${error.message}` };
  }

  redirect(`/viajes/${tripId}/solicitar`);
}

export async function submitReturningApplication(
  tripId: string,
  _prevState: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/cuenta?next=/viajes/${tripId}/solicitar`);

  const full_name = str(formData, "full_name");
  const email = str(formData, "email");
  const theme = str(formData, "theme");
  const purpose = str(formData, "purpose");
  const previous_ceremonies = str(formData, "previous_ceremonies");
  const ceremony_date = str(formData, "ceremony_date");

  if (!full_name || !email || !theme || !purpose || !previous_ceremonies) {
    return { error: "Completá todos los campos requeridos." };
  }

  const { error } = await supabase.from("applications_returning").insert({
    user_id: user.id,
    trip_id: tripId,
    full_name,
    email,
    ceremony_date: ceremony_date || null,
    previous_ceremonies: Number(previous_ceremonies),
    new_treatment: bool(formData, "new_treatment"),
    new_treatment_detail: str(formData, "new_treatment_detail") || null,
    stress_anxiety: bool(formData, "stress_anxiety"),
    stress_anxiety_detail: str(formData, "stress_anxiety_detail") || null,
    theme,
    purpose,
  });

  if (error) {
    return { error: `No se pudo enviar la solicitud: ${error.message}` };
  }

  redirect(`/viajes/${tripId}/solicitar`);
}
