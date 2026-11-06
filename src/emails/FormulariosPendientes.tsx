import { copyFor, rich, fill, type CopyOverrides } from "@/lib/email/templates";
import { BaseLayout, CtaButton, Paragraph, Title } from "./BaseLayout";

/**
 * Correo [4A] de docs/COMUNICACIONES.md: pago pero no completo los formularios.
 *
 * Lo manda el cron diario unos dias despues de registrado el pago (la regla
 * exacta esta en `src/lib/email/scheduled-rules.ts`). Es el unico correo del
 * documento que atiende un abandono a mitad del embudo: hoy, si alguien paga y
 * no vuelve a entrar, la solicitud se queda quieta y nadie se entera hasta que
 * Estela mira el panel.
 *
 * Hasta el 05/09/2026 nombraba SOLO el formulario de salud, a contramano del
 * copy de Sofia ("necesitamos el formulario de salud y el consentimiento
 * informado completos"): el consentimiento no existia como pantalla y mandar a
 * alguien a completar algo que no puede completar es peor que pedirle una cosa
 * sola. Ahora existe (`/viajes/[id]/consentimiento`) y el correo nombra lo que
 * de verdad falta — los dos, o solo el consentimiento cuando el de salud ya
 * llego o no corresponde.
 */
export function FormulariosPendientes({
  nombre,
  viaje,
  fechas,
  falta,
  url,
  copy,
}: {
  nombre: string;
  viaje: string;
  fechas: string;
  /** Que le falta: los dos formularios, o solo la firma. */
  falta: "ambos" | "consentimiento";
  url: string;
  copy?: CopyOverrides;
}) {
  const k = copyFor("formularios", copy);
  const vars = { nombre, viaje, fechas };
  const ambos = falta === "ambos";
  return (
    <BaseLayout preview={fill(k.preview, vars)}>
      <Title>{fill(ambos ? k.title_both : k.title_consent, vars)}</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      {ambos ? (
        <>
          <Paragraph preLine>{rich(k.both_1, vars)}</Paragraph>
          <Paragraph preLine>{rich(k.both_2, vars)}</Paragraph>
          <Paragraph preLine>{rich(k.both_3, vars)}</Paragraph>
          <Paragraph preLine>{rich(k.both_4, vars)}</Paragraph>
        </>
      ) : (
        <>
          <Paragraph preLine>{rich(k.consent_1, vars)}</Paragraph>
          <Paragraph preLine>{rich(k.consent_2, vars)}</Paragraph>
        </>
      )}

      <CtaButton href={url}>
        {fill(ambos ? k.button_both : k.button_consent, vars)}
      </CtaButton>

      <Paragraph preLine>{rich(k.closing, vars)}</Paragraph>
    </BaseLayout>
  );
}

export default FormulariosPendientes;
