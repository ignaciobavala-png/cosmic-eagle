"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CONSENT_CONFIRMATIONS,
  CONSENT_VERSION,
  type ConsentConfirmationRecord,
} from "@/lib/consent";

export type ConsentFormState = { error: string | null };

/**
 * La firma del consentimiento informado.
 *
 * Se guarda **qué texto** aceptó la persona, no sólo que aceptó: cada
 * confirmación viaja con su etiqueta literal y la fila lleva la versión del
 * texto (`CONSENT_VERSION`). Si mañana la clienta cambia una frase, los
 * consentimientos firmados siguen diciendo lo que decían cuando se firmaron.
 *
 * No manda `user_id`, `trip_id` ni `date`: los pone el trigger
 * `private.set_consent_owner` leyendo la solicitud (migración
 * 20260905160000). Quién puede escribir acá lo decide la RLS
 * (`owns_approved_application`), no este código.
 */
export async function submitConsent(
  tripId: string,
  applicationId: string,
  _prevState: ConsentFormState,
  formData: FormData
): Promise<ConsentFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/cuenta?next=/viajes/${tripId}/consentimiento`);

  // Las cuatro son obligatorias (ver el comentario de CONSENT_CONFIRMATIONS).
  const confirmations: ConsentConfirmationRecord[] = [];
  for (const item of CONSENT_CONFIRMATIONS) {
    if (formData.get(item.id) !== "on") {
      return { error: "Marca las cuatro confirmaciones para poder firmar." };
    }
    confirmations.push({ id: item.id, label: item.label, accepted: true });
  }

  const signature = String(formData.get("signature") ?? "").trim();
  // Un nombre y un apellido. No se compara con el nombre de la cuenta a
  // propósito: el del perfil lo escribió la misma persona y validar uno contra
  // el otro sólo trabaría a quien tenga un tipeo distinto.
  if (signature.length < 5 || !signature.includes(" ")) {
    return { error: "Escribe tu nombre completo, como figura en tu documento." };
  }

  const { error } = await supabase.from("consents").insert({
    application_id: applicationId,
    // El trigger los reescribe con los de la solicitud. Van igual porque son
    // NOT NULL: mandar null fallaria antes de llegar a la base.
    user_id: user.id,
    trip_id: tripId,
    confirmations,
    digital_signature: signature,
    consent_version: CONSENT_VERSION,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya tenemos tu consentimiento firmado para este viaje." };
    }
    return { error: `No se pudo registrar la firma: ${error.message}` };
  }

  redirect(`/viajes/${tripId}/solicitar`);
}
