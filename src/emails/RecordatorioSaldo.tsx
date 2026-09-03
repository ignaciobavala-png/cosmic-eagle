import { BaseLayout, CtaButton, Paragraph, Title } from "./BaseLayout";
import { formatAmount } from "@/lib/format";

/**
 * Correo [3B] de docs/COMUNICACIONES.md: recordatorio del saldo pendiente.
 *
 * **Es el primer mail de la app que no lo dispara nadie apretando un boton.** Lo
 * manda el cron diario (`/api/cron/emails`) cuando se acerca la fecha del viaje
 * y la persona pago la sena pero no el total. La regla exacta —a cuantos dias, y
 * con que guardas— vive en `src/lib/email/scheduled-rules.ts`.
 *
 * **La fecha limite es opcional**, y no por prolijidad: la pregunta 4 de
 * docs/consulta-sofia-pagos.txt ("los 15 dias, valen para todo o solo para los
 * Viajes?") sigue abierta, y el caso que la motiva es real — alguien que reserva
 * una Sesion a 10 dias de la fecha tiene el corte en el pasado. Cuando eso pasa
 * el mail sale igual, hablando de "antes de la experiencia" y sin nombrar
 * ninguna fecha: prometer una fecha vencida es peor que no dar ninguna.
 */
export function RecordatorioSaldo({
  nombre,
  viaje,
  fechas,
  saldo,
  fechaLimite,
  url,
}: {
  nombre: string;
  viaje: string;
  fechas: string;
  saldo: number;
  /** Ya formateada ("12 de octubre"). `null` si el corte ya paso. */
  fechaLimite: string | null;
  url: string;
}) {
  return (
    <BaseLayout preview={`Queda un saldo pendiente para ${viaje}`}>
      <Title>Recordatorio de tu saldo pendiente</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph>
        Te escribimos para recordarte que queda un saldo pendiente de{" "}
        <strong>{formatAmount(saldo)}</strong> para <strong>{viaje}</strong>
        {fechas ? ` (${fechas})` : ""}.
      </Paragraph>

      <Paragraph>
        {fechaLimite ? (
          <>
            La fecha límite para completarlo es el <strong>{fechaLimite}</strong>.
            Puedes pagarlo desde tu espacio personal, de una vez o en cuotas.
          </>
        ) : (
          <>
            Puedes completarlo desde tu espacio personal antes de la experiencia,
            de una vez o en cuotas.
          </>
        )}
      </Paragraph>

      <CtaButton href={url}>Ver mi saldo</CtaButton>

      <Paragraph>
        Si necesitas conversar sobre los plazos, escríbenos con confianza.
        Siempre hay manera de acomodarlo.
      </Paragraph>
    </BaseLayout>
  );
}

export default RecordatorioSaldo;
