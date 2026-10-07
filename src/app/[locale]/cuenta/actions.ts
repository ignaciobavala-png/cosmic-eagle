"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/redirect";
import { publicPath } from "@/i18n/public-path";
import { dialCodeFor } from "@/lib/phone-countries";
import { capitalizeName } from "@/lib/person-name";
import { REFERRAL_SOURCES } from "./profile-fields";

export type LoginState = { error: string | null };
export type SignupState = { error: string | null };
export type AvatarState = { error: string | null };
export type RecoverState = { error: string | null; sent: boolean };
export type NewPasswordState = { error: string | null };
export type ProfileState = { error: string | null; saved: boolean };

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const t = await getTranslations("Cuenta");
  const email = formData.get("email");
  const password = formData.get("password");
  const next = formData.get("next");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: t("formErrors.loginIncomplete") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: t("formErrors.emailNotConfirmed") };
    }
    return { error: t("formErrors.badCredentials") };
  }

  revalidatePath(publicPath("/"), "layout");

  if (typeof next === "string" && next.startsWith("/")) {
    return await redirect(next);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single();

  // El viajero vuelve a la home ya con sesión, no a su perfil (Sofía, 06/10):
  // `/cuenta` queda a un click en el navbar. El admin sigue yendo al panel.
  return await redirect(profile?.is_admin ? "/admin" : "/");
}

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const t = await getTranslations("Cuenta");
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
    return { error: t("formErrors.signupIncomplete") };
  }

  if (password.length < 8) {
    return { error: t("formErrors.shortPassword") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: capitalizeName(fullName) },
      // Hoy la confirmacion por mail esta apagada a proposito (el gate real es
      // la aprobacion manual del admin), asi que este link no se manda. Se deja
      // igual para que prenderla en el dashboard sea un toggle y no un deploy.
      emailRedirectTo: `${await getSiteUrl()}/auth/confirm`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { error: t("formErrors.userExists") };
    }
    return { error: t("formErrors.signupFailed") };
  }

  revalidatePath(publicPath("/"), "layout");
  return await redirect(typeof next === "string" && next.startsWith("/") ? next : "/cuenta");
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
  const t = await getTranslations("Cuenta");
  const email = formData.get("email");

  if (typeof email !== "string" || !email.includes("@")) {
    return { error: t("formErrors.invalidEmail"), sent: false };
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
  const t = await getTranslations("Cuenta");
  const password = formData.get("password");
  const confirm = formData.get("password_confirm");

  if (typeof password !== "string" || typeof confirm !== "string") {
    return { error: t("formErrors.updateIncomplete") };
  }

  if (password.length < 8) {
    return { error: t("formErrors.shortPassword") };
  }

  if (password !== confirm) {
    return { error: t("formErrors.mismatch") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: t("formErrors.linkExpired") };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    if (error.code === "same_password") {
      return { error: t("formErrors.samePassword") };
    }
    return { error: t("formErrors.updateFailed") };
  }

  revalidatePath(publicPath("/"), "layout");
  return await redirect("/cuenta?aviso=clave-cambiada");
}

export async function updateAvatar(
  _prevState: AvatarState,
  formData: FormData
): Promise<AvatarState> {
  const t = await getTranslations("Cuenta");
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: t("formErrors.chooseImage") };
  }

  if (!file.type.startsWith("image/")) {
    return { error: t("formErrors.notImage") };
  }

  if (file.size > 3 * 1024 * 1024) {
    return { error: t("formErrors.tooBig") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: t("formErrors.sessionExpired") };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: t("formErrors.uploadFailed") };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  await supabase
    .from("profiles")
    .update({ avatar_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", user.id);

  revalidatePath(publicPath("/"), "layout");
  return { error: null };
}

/**
 * El perfil personal de /cuenta (correcciones de la organización, 03/10,
 * §5.1, opción A): lo estable de la persona. La salud no pasa por acá.
 *
 * Escribe sólo las columnas que `profiles` tiene otorgadas a `authenticated`
 * (ver la migración `profile_personal_fields`); la RLS acota a la fila propia.
 */
export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const t = await getTranslations("Cuenta");
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  const fullName = text("full_name");
  const phoneNumber = text("phone_number");
  const dial = dialCodeFor(text("phone_country"));
  const profession = text("profession");
  const socialUrl = text("social_url");
  const priorExperience = text("prior_experience");
  const spiritualPractices = text("spiritual_practices");
  const referralSource = text("referral_source");
  const referredBy = text("referred_by");

  if (
    !fullName ||
    !phoneNumber ||
    !dial ||
    !profession ||
    !priorExperience ||
    !spiritualPractices ||
    !(REFERRAL_SOURCES as readonly string[]).includes(referralSource)
  ) {
    return { error: t("profile.errors.incomplete"), saved: false };
  }

  if (referralSource === "referido" && !referredBy) {
    return { error: t("profile.errors.referredBy"), saved: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: t("formErrors.sessionExpired"), saved: false };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: capitalizeName(fullName),
      phone: `+${dial} ${phoneNumber}`,
      profession,
      social_url: socialUrl || null,
      prior_experience: priorExperience,
      spiritual_practices: spiritualPractices,
      referral_source: referralSource,
      referred_by: referralSource === "referido" ? referredBy : null,
      profile_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: t("profile.errors.failed"), saved: false };
  }

  revalidatePath(publicPath("/cuenta"), "page");
  return { error: null, saved: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath(publicPath("/cuenta"), "page");
}
