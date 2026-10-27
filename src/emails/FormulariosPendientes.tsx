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
    <BaseLayout preview="Ya falta poco para completar tu inscripción">
      <Title>
        {falta === "ambos"
          ? "Ya falta poco para completar tu inscripción"
          : "Te falta un paso"}
      </Title>

      <Paragraph>Hola {nombre},</Paragraph>

      {falta === "ambos" ? (
        <>
          {/* Texto de Sofía del 27/10, literal (tuteo). */}
          <Paragraph>
            Qué alegría que pronto nos acompañarás en <strong>{viaje}</strong>
            {fechas ? ` (${fechas})` : ""}.
          </Paragraph>
          <Paragraph>
            Tu cupo ya está reservado. Solo quedan dos pasos para completar tu
            inscripción: el formulario de salud y el consentimiento informado.
          </Paragraph>
          <Paragraph>
            El formulario nos ayudará a conocerte mejor y preparar tu
            experiencia con el cuidado que merece.
          </Paragraph>
          <Paragraph>
            Luego podrás revisar y firmar el consentimiento informado.
          </Paragraph>
        </>
      ) : (
        <Paragraph>
          Tu cupo en <strong>{viaje}</strong>
          {fechas ? ` (${fechas})` : ""} está reservado, pero todavía nos falta
          tu consentimiento informado firmado.
        </Paragraph>
      )}

      {falta === "ambos" ? null : (
        <Paragraph>
          Es el documento que explica en qué consiste la experiencia, cuál es el
          rol del facilitador y cómo cuidamos tu información. Se lee con calma y
          se firma escribiendo tu nombre completo.
        </Paragraph>
      )}

      <CtaButton href={url}>
        {falta === "ambos"
          ? "Completar formulario de salud y consentimiento informado"
          : "Leer y firmar"}
      </CtaButton>

      <Paragraph>
        Si tienes alguna duda o necesitas ayuda, escríbenos con confianza.
      </Paragraph>
    </BaseLayout>
  );
}

export default FormulariosPendientes;
