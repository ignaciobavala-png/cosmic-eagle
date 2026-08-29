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
}: {
  nombre: string;
  viaje: string;
  fechas: string;
  url: string;
}) {
  return (
    <BaseLayout preview={`Recibimos tu solicitud para ${viaje}`}>
      <Title>Recibimos tu solicitud</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph>
        Tu solicitud para <strong>{viaje}</strong>
        {fechas ? ` (${fechas})` : ""} ya está con nosotros. Estela la va a leer
        personalmente, una por una, y te vamos a escribir con la respuesta.
      </Paragraph>

      <Paragraph>
        Si contaste algo sobre tu salud o algún tratamiento, nada de eso cierra
        la puerta: lo preguntamos para poder acompañarte mejor, no para
        descartar a nadie.
      </Paragraph>

      <Paragraph>
        En tu cuenta puedes seguir en qué paso está tu solicitud en cualquier
        momento.
      </Paragraph>

      <CtaButton href={url}>Ver el estado de mi solicitud</CtaButton>
    </BaseLayout>
  );
}

export default SolicitudRecibida;
