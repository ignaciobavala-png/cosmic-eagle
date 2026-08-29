import { BaseLayout, CtaButton, Paragraph, Title } from "./BaseLayout";

/**
 * Aviso de que una solicitud no fue aprobada. Lo dispara `reviewApplication`
 * solo en la transicion a `rejected`.
 *
 * **No dice por que.** El motivo puede ser un dato de salud del filtro, y
 * escribirlo en un mail es mandar informacion medica por un canal que despues
 * no controlamos. Si hace falta explicarlo, lo hace Estela por privado.
 *
 * Tampoco cierra la relacion: en el encuadre de Sofia un "no" es para *este*
 * viaje, no para la persona. De ahi que el CTA lleve al calendario y no a un
 * callejon.
 */
export function SolicitudRechazada({
  nombre,
  viaje,
  url,
}: {
  nombre: string;
  viaje: string;
  url: string;
}) {
  return (
    <BaseLayout preview={`Sobre tu solicitud para ${viaje}`}>
      <Title>Sobre tu solicitud</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph>
        Leímos con atención lo que nos compartiste sobre <strong>{viaje}</strong>{" "}
        y esta vez no vamos a poder acompañarte en esta experiencia.
      </Paragraph>

      <Paragraph>
        No es un juicio sobre ti ni sobre tu proceso: cada círculo tiene un
        momento y una configuración, y parte de nuestro cuidado es reconocer
        cuándo no es el encuentro indicado. Si quieres conversarlo, puedes
        responder este mensaje y te escribimos.
      </Paragraph>

      <Paragraph>
        Las puertas siguen abiertas para más adelante. Puedes ver las próximas
        experiencias del calendario y postularte cuando lo sientas.
      </Paragraph>

      <CtaButton href={url}>Ver las próximas experiencias</CtaButton>
    </BaseLayout>
  );
}

export default SolicitudRechazada;
