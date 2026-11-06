import { copyFor, rich, fill, type CopyOverrides } from "@/lib/email/templates";
import { BaseLayout, CtaButton, Paragraph, Title } from "./BaseLayout";

/**
 * Acuse de recibo del filtro corto (etapa 1). Lo dispara `submitApplication`
 * apenas entra la solicitud.
 *
 * **No promete nada sobre el resultado**: la respuesta la da Estela a mano y
 * puede tardar. Lo unico que hace este mail es cerrar el silencio — sin el, la
 * persona manda el formulario y no vuelve a saber de nosotros hasta la
 * aprobacion, que puede ser una semana despues.
 *
 * Repite el encuadre informativo de Sofia (*"nada de lo que nos cuentes cierra
 * la puerta"*, ver docs/FLUJO_INSCRIPCION.md) porque el filtro pregunta por
 * salud y medicacion, y quien marca una casilla se queda esperando un rechazo.
 */
export function SolicitudRecibida({
  nombre,
  viaje,
  fechas,
  url,
  copy,
}: {
  nombre: string;
  viaje: string;
  fechas: string;
  url: string;
  copy?: CopyOverrides;
}) {
  const k = copyFor("recibida", copy);
  const vars = { nombre, viaje, fechas };
  return (
    <BaseLayout preview={fill(k.preview, vars)}>
      <Title>{fill(k.title, vars)}</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph preLine>{rich(k.p1, vars)}</Paragraph>
      <Paragraph preLine>{rich(k.p2, vars)}</Paragraph>
      <Paragraph preLine>{rich(k.p3, vars)}</Paragraph>

      <CtaButton href={url}>{fill(k.button, vars)}</CtaButton>
    </BaseLayout>
  );
}

export default SolicitudRecibida;
