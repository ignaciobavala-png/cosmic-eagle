import { copyFor, rich, fill, type CopyOverrides } from "@/lib/email/templates";
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
  moneda = "USD",
  copy,
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
  /** Moneda de la experiencia: CLP, USD o EUR. */
  moneda?: string;
  copy?: CopyOverrides;
}) {
  const k = copyFor("pago", copy);
  const vars = {
    nombre,
    viaje,
    fechas,
    monto: formatAmount(montoPagado, "es", moneda),
    saldo: formatAmount(saldo, "es", moneda),
  };
  const variante = esSena ? "sena" : saldoCompletado ? "completo" : "pagado";
  return (
    <BaseLayout preview={fill(k[`preview_${variante}`], vars)}>
      <Title>{fill(k[`title_${variante}`], vars)}</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      {/* Reserva con seña: texto de Sofía del 27/10, literal. */}
      {esSena && !sinCargo && (
        <Paragraph preLine>{rich(k.sena_alegria, vars)}</Paragraph>
      )}

      <Paragraph preLine>
        {rich(
          sinCargo
            ? k.body_sin_cargo
            : saldoCompletado
              ? k.body_completo
              : esSena
                ? k.body_sena
                : k.body_pagado,
          vars
        )}
      </Paragraph>

      {/* El saldo se dice una sola vez y sin fecha límite: el plazo de los 15
          días del documento de Sofía todavía no está confirmado (pregunta 4 de
          docs/consulta-sofia-pagos.txt), y prometer una fecha que después
          cambia es peor que no darla. */}
      {esSena && saldo > 0 && (
        <Paragraph preLine>{rich(k.saldo_pendiente, vars)}</Paragraph>
      )}

      {necesitaSalud ? (
        <>
          <Paragraph preLine>
            {rich(esSena && !sinCargo ? k.salud_sena : k.salud_normal, vars)}
          </Paragraph>

          <CtaButton href={url}>{fill(k.button_salud, vars)}</CtaButton>

          {esSena && !sinCargo && (
            <Paragraph preLine>{rich(k.gracias_sena, vars)}</Paragraph>
          )}
        </>
      ) : (
        <>
          <Paragraph preLine>{rich(k.logistica, vars)}</Paragraph>

          <CtaButton href={url}>{fill(k.button_detalles, vars)}</CtaButton>
        </>
      )}
    </BaseLayout>
  );
}

export default PagoRegistrado;
