import { BaseLayout, CtaButton, Paragraph, Title } from "./BaseLayout";
import { formatAmount } from "@/lib/format";

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
 *
 * Cubre los correos [3] y [3A] del documento de Sofia (docs/COMUNICACIONES.md)
 * en una sola pieza, porque el 80% del texto es el mismo y lo unico que cambia
 * es el encabezado y si queda saldo. Separarlos en dos archivos obligaria a
 * mantener dos veces el tramo del formulario de salud.
 */
export function PagoRegistrado({
  nombre,
  viaje,
  fechas,
  sinCargo,
  esSena,
  saldoCompletado,
  montoPagado,
  saldo,
  necesitaSalud,
  url,
}: {
  nombre: string;
  viaje: string;
  fechas: string;
  /** `waived`: invitacion o cupon. No hubo transferencia que acusar. */
  sinCargo: boolean;
  /** Pago la sena y queda saldo: correo [3A] en vez de [3]. */
  esSena: boolean;
  /** Venia de la sena y completo el saldo: correo [3C]. */
  saldoCompletado: boolean;
  montoPagado: number;
  saldo: number;
  /** Si todavia falta el formulario de salud, el CTA lleva ahi. */
  necesitaSalud: boolean;
  url: string;
}) {
  return (
    <BaseLayout
      preview={
        esSena
          ? `Tu cupo en ${viaje} está reservado`
          : saldoCompletado
            ? `Tu pago para ${viaje} está completo`
            : `Tu pago para ${viaje} fue confirmado`
      }
    >
      <Title>
        {esSena
          ? "Tu cupo está reservado"
          : saldoCompletado
            ? "Tu pago está completo"
            : "Tu pago fue confirmado"}
      </Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph>
        {sinCargo ? (
          <>
            Tu lugar en <strong>{viaje}</strong>
            {fechas ? ` (${fechas})` : ""} quedó confirmado sin cargo.
          </>
        ) : (
          <>
            {saldoCompletado ? (
              <>
                Recibimos el saldo. Tu inscripción en <strong>{viaje}</strong>
                {fechas ? ` (${fechas})` : ""} está completamente pagada, con un
                total de <strong>{formatAmount(montoPagado)}</strong>. Gracias
                por la confianza.
              </>
            ) : (
              <>
                Recibimos tu pago de{" "}
                <strong>{formatAmount(montoPagado)}</strong> para{" "}
                <strong>{viaje}</strong>
                {fechas ? ` (${fechas})` : ""}. Tu lugar en el círculo está
                {esSena ? " reservado" : " confirmado"}.
              </>
            )}
          </>
        )}
      </Paragraph>

      {/* El saldo se dice una sola vez y sin fecha límite: el plazo de los 15
          días del documento de Sofía todavía no está confirmado (pregunta 4 de
          docs/consulta-sofia-pagos.txt), y prometer una fecha que después
          cambia es peor que no darla. */}
      {esSena && saldo > 0 && (
        <Paragraph>
          Queda un saldo pendiente de <strong>{formatAmount(saldo)}</strong>.
          Puedes completarlo cuando quieras desde tu cuenta, con los mismos
          medios de pago. Si necesitas conversar sobre los plazos, escríbenos
          con confianza.
        </Paragraph>
      )}

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
