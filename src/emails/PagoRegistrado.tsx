import { BaseLayout, CtaButton, Paragraph, Title } from "./BaseLayout";

/**
 * Aviso de que el cupo quedo reservado. Lo dispara `markPayment` cuando Estela
 * registra el pago (o marca la solicitud como sin cargo).
 *
 * **Es el mail que destraba la etapa 2.** El formulario de salud extenso recien
 * se habilita con la solicitud aprobada Y el pago registrado: sin este aviso la
 * persona paga por fuera de la web y no tiene forma de enterarse de que ya
 * puede seguir, salvo volver a entrar por su cuenta a adivinar.
 *
 * Mientras no haya pasarela, el pago lo marca Estela a mano desde el panel
 * (ver docs/FLUJO_INSCRIPCION.md), asi que este mail es literalmente el unico
 * acuse de ese pago que recibe la persona.
 */
export function PagoRegistrado({
  nombre,
  viaje,
  fechas,
  sinCargo,
  necesitaSalud,
  url,
}: {
  nombre: string;
  viaje: string;
  fechas: string;
  /** `waived`: invitacion o cupon. No hubo transferencia que acusar. */
  sinCargo: boolean;
  /** Si todavia falta el formulario de salud, el CTA lleva ahi. */
  necesitaSalud: boolean;
  url: string;
}) {
  return (
    <BaseLayout preview={`Tu cupo en ${viaje} está reservado`}>
      <Title>Tu cupo está reservado</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph>
        {sinCargo ? (
          <>
            Tu lugar en <strong>{viaje}</strong>
            {fechas ? ` (${fechas})` : ""} quedó confirmado sin cargo.
          </>
        ) : (
          <>
            Registramos tu pago para <strong>{viaje}</strong>
            {fechas ? ` (${fechas})` : ""}. Tu lugar en el círculo está
            guardado.
          </>
        )}
      </Paragraph>

      {necesitaSalud ? (
        <>
          <Paragraph>
            Queda un paso importante: el formulario de salud completo. Es más
            largo que el primero y es lo que nos permite preparar la ceremonia
            y cuidar tu proceso, así que tómate el tiempo de responderlo con
            calma.
          </Paragraph>

          <CtaButton href={url}>Completar el formulario de salud</CtaButton>
        </>
      ) : (
        <>
          <Paragraph>
            Vamos a escribirte con la preparación previa y los datos de
            logística a medida que se acerque la fecha.
          </Paragraph>

          <CtaButton href={url}>Ver los detalles de la experiencia</CtaButton>
        </>
      )}
    </BaseLayout>
  );
}

export default PagoRegistrado;
