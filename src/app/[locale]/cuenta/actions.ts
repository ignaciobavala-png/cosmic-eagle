"use server";

import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type LoginState = { error: string | null };
export type SignupState = { error: string | null };
export type AvatarState = { error: string | null };
export type RecoverState = { error: string | null; sent: boolean };
export type NewPasswordState = { error: string | null };

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const next = formData.get("next");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Completa email y contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada." };
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
    return { error: "Completa nombre, email y contraseña." };
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
      // Hoy la confirmacion por mail esta apagada a proposito (el gate real es
      // la aprobacion manual del admin), asi que este link no se manda. Se deja
      // igual para que prenderla en el dashboard sea un toggle y no un deploy.
      emailRedirectTo: `${await getSiteUrl()}/auth/confirm`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { error: "Ya existe una cuenta con ese email. Inicia sesión." };
    }
    return { error: "No se pudo crear la cuenta. Prueba de nuevo." };
  }

  revalidatePath("/", "layout");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/cuenta");
}

/**
 * Paso 1 de recuperar la clave: manda el mail.
 *
 * Responde "listo" siempre, exista o no la cuenta. Si distinguiera los dos
 * casos, el formulario seria un oraculo para averiguar quien esta registrado —
 * y en esta plataforma estar registrado se correlaciona con haber participado
 * de una ceremonia, que es justo el dato sensible.
 */
export async function requestPasswordReset(
  _prevState: RecoverState,
  formData: FormData
): Promise<RecoverState> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email.includes("@")) {
    return { error: "Ingresa un email válido.", sent: false };
  }

  const supabase = await createClient();

  // El `next` no hace falta: la ruta de confirmacion ya manda las
  // recuperaciones a /cuenta/nueva-clave.
  await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${await getSiteUrl()}/auth/confirm`,
  });

  return { error: null, sent: true };
}

/**
 * Paso 2: la persona volvio del mail, ya tiene sesion (la creo el verifyOtp de
 * /auth/confirm) y define la clave nueva.
 */
export async function updatePassword(
  _prevState: NewPasswordState,
  formData: FormData
): Promise<NewPasswordState> {
  const password = formData.get("password");
  const confirm = formData.get("password_confirm");

  if (typeof password !== "string" || typeof confirm !== "string") {
    return { error: "Completa los dos campos." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "El enlace venció. Pide uno nuevo desde “¿Olvidaste tu contraseña?”." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    if (error.code === "same_password") {
      return { error: "La contraseña nueva tiene que ser distinta de la anterior." };
    }
    return { error: "No se pudo cambiar la contraseña. Prueba de nuevo." };
  }

  revalidatePath("/", "layout");
  redirect("/cuenta?aviso=clave-cambiada");
}

export async function updateAvatar(
  _prevState: AvatarState,
  formData: FormData
): Promise<AvatarState> {
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elige una imagen." };
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
    return { error: "Sesión expirada. Vuelve a iniciar sesión." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: "No se pudo subir la imagen. Prueba de nuevo." };
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
