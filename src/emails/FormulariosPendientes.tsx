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
 * **Divergencia deliberada con el copy de Sofia**: el original dice "necesitamos
 * el formulario de salud y el consentimiento informado completos", y aca se
 * nombra solo el de salud. El consentimiento todavia no existe como pantalla —la
 * tabla `consents` esta desde el schema original y sigue sin UI, y los textos
 * legales son de la clienta. Mandar a alguien a completar algo que no puede
 * completar es peor que pedirle una cosa sola. Cuando exista, vuelve la frase
 * entera.
 */
export function FormulariosPendientes({
  nombre,
  viaje,
  fechas,
  url,
}: {
  nombre: string;
  viaje: string;
  fechas: string;
  url: string;
}) {
  return (
    <BaseLayout preview="Te faltan unos pasos para completar tu inscripción">
      <Title>Te faltan unos pasos</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph>
        Tu cupo en <strong>{viaje}</strong>
        {fechas ? ` (${fechas})` : ""} está reservado, pero aún no recibimos tu
        formulario de salud.
      </Paragraph>

      <Paragraph>
        Para poder confirmar tu participación necesitamos que lo completes. Es
        más largo que el primero y es lo que nos permite preparar la ceremonia y
        cuidar tu proceso, así que tómate el tiempo de responderlo con calma.
      </Paragraph>

      <CtaButton href={url}>Completar mi formulario</CtaButton>

      <Paragraph>
        Si tuviste algún problema para completarlo o quieres conversar algo
        antes, escríbenos.
      </Paragraph>
    </BaseLayout>
  );
}

export default FormulariosPendientes;
