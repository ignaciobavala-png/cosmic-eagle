"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type LoginState = { error: string | null };
export type SignupState = { error: string | null };
export type AvatarState = { error: string | null };

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const next = formData.get("next");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Completá email y contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Confirmá tu email antes de iniciar sesión. Revisá tu bandeja de entrada." };
    }
    return { error: "Email o contraseña incorrectos." };
  }

  revalidatePath("/", "layout");

  if (typeof next === "string" && next.startsWith("/")) {
    redirect(next);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single();

  redirect(profile?.is_admin ? "/admin" : "/cuenta");
}

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const fullName = formData.get("full_name");
  const next = formData.get("next");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof fullName !== "string" ||
    fullName.trim().length === 0
  ) {
    return { error: "Completá nombre, email y contraseña." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName.trim() },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { error: "Ya existe una cuenta con ese email. Iniciá sesión." };
    }
    return { error: "No se pudo crear la cuenta. Probá de nuevo." };
  }

  revalidatePath("/", "layout");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/cuenta");
}

export async function updateAvatar(
  _prevState: AvatarState,
  formData: FormData
): Promise<AvatarState> {
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elegí una imagen." };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "El archivo debe ser una imagen." };
  }

  if (file.size > 3 * 1024 * 1024) {
    return { error: "La imagen no puede superar los 3MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesión expirada. Volvé a iniciar sesión." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: "No se pudo subir la imagen. Probá de nuevo." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  await supabase
    .from("profiles")
    .update({ avatar_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", user.id);

  revalidatePath("/", "layout");
  return { error: null };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/cuenta");
}
