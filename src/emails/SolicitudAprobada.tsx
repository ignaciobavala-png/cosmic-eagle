import { BaseLayout, CtaButton, Paragraph, Title } from "./BaseLayout";

/**
 * Aviso de que una solicitud fue aprobada.
 *
 * **Todavia no esta cableado a ningun flujo**: `reviewApplication` aprueba sin
 * mandar nada. Se conecta cuando este verificado el dominio en Resend — hasta
 * entonces el sandbox solo entrega a la casilla dueña de la cuenta.
 *
 * No dice nada del codigo de acceso a proposito: ese mecanismo esta en revision
 * (ver `docs/consulta-sofia-acceso.txt`).
 */
export function SolicitudAprobada({
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
    <BaseLayout preview={`Tu lugar en ${viaje} está confirmado`}>
      <Title>Tu solicitud fue aprobada</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph>
        Revisamos tu solicitud para <strong>{viaje}</strong> ({fechas}) y tenés tu
        lugar confirmado. Nos alegra mucho que nos acompañes.
      </Paragraph>

      <Paragraph>
        En tu cuenta vas a encontrar los detalles de la experiencia y la
        información de preparación. Te vamos a ir escribiendo a medida que se
        acerque la fecha.
      </Paragraph>

      <CtaButton href={url}>Ver la experiencia</CtaButton>
    </BaseLayout>
  );
}

export default SolicitudAprobada;
