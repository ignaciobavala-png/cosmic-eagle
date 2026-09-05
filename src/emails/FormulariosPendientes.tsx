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
}: {
  nombre: string;
  viaje: string;
  fechas: string;
  /** Que le falta: los dos formularios, o solo la firma. */
  falta: "ambos" | "consentimiento";
  url: string;
}) {
  return (
    <BaseLayout preview="Te faltan unos pasos para completar tu inscripción">
      <Title>Te faltan unos pasos</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph>
        Tu cupo en <strong>{viaje}</strong>
        {fechas ? ` (${fechas})` : ""} está reservado, pero todavía nos falta
        {falta === "ambos"
          ? " tu formulario de salud y tu consentimiento informado."
          : " tu consentimiento informado firmado."}
      </Paragraph>

      {falta === "ambos" ? (
        <Paragraph>
          Para poder confirmar tu participación necesitamos que los completes. El
          formulario de salud es más largo que el primero y es lo que nos permite
          preparar la ceremonia y cuidar tu proceso, así que tómate el tiempo de
          responderlo con calma. El consentimiento se firma después, y explica en
          qué consiste la experiencia y cómo te acompañamos.
        </Paragraph>
      ) : (
        <Paragraph>
          Es el documento que explica en qué consiste la experiencia, cuál es el
          rol del facilitador y cómo cuidamos tu información. Se lee con calma y
          se firma escribiendo tu nombre completo.
        </Paragraph>
      )}

      <CtaButton href={url}>
        {falta === "ambos" ? "Completar mi formulario" : "Leer y firmar"}
      </CtaButton>

      <Paragraph>
        Si tuviste algún problema para completarlo o quieres conversar algo
        antes, escríbenos.
      </Paragraph>
    </BaseLayout>
  );
}

export default FormulariosPendientes;
