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

      {/* Texto de Sofía del 27/10, literal (tuteo). */}
      <Paragraph>Esperamos que estés muy bien.</Paragraph>

      <Paragraph>
        Te recordamos que tienes un saldo pendiente de{" "}
        <strong>{formatAmount(saldo)}</strong> para <strong>{viaje}</strong>
        {fechas ? ` (${fechas})` : ""}.
      </Paragraph>

      <Paragraph>
        {fechaLimite ? (
          <>
            Puedes completar tu pago hasta el <strong>{fechaLimite}</strong>,
            directamente desde tu cuenta.
          </>
        ) : (
          <>
            Puedes completar tu pago antes de la experiencia, directamente desde
            tu cuenta.
          </>
        )}
      </Paragraph>

      <Paragraph>
        Si necesitas coordinar otros plazos, escríbenos con confianza y
        buscamos juntos una solución.
      </Paragraph>

      <Paragraph>
        Nos alegra mucho que pronto podamos compartir esta experiencia.
      </Paragraph>

      <CtaButton href={url}>Ver saldo</CtaButton>
    </BaseLayout>
  );
}

export default RecordatorioSaldo;
