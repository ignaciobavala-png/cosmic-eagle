import { copyFor, rich, fill, type CopyOverrides } from "@/lib/email/templates";
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
  moneda = "USD",
  copy,
}: {
  nombre: string;
  viaje: string;
  fechas: string;
  saldo: number;
  /** Ya formateada ("12 de octubre"). `null` si el corte ya paso. */
  fechaLimite: string | null;
  url: string;
  /** Moneda de la experiencia: CLP, USD o EUR. */
  moneda?: string;
  copy?: CopyOverrides;
}) {
  const k = copyFor("saldo", copy);
  const vars = { nombre, viaje, fechas, saldo: formatAmount(saldo, "es", moneda), fechaLimite };
  return (
    <BaseLayout preview={fill(k.preview, vars)}>
      <Title>{fill(k.title, vars)}</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph preLine>{rich(k.p1, vars)}</Paragraph>
      <Paragraph preLine>{rich(k.p2, vars)}</Paragraph>
      <Paragraph preLine>{rich(fechaLimite ? k.deadline : k.no_deadline, vars)}</Paragraph>
      <Paragraph preLine>{rich(k.p3, vars)}</Paragraph>
      <Paragraph preLine>{rich(k.p4, vars)}</Paragraph>

      <CtaButton href={url}>{fill(k.button, vars)}</CtaButton>
    </BaseLayout>
  );
}

export default RecordatorioSaldo;
