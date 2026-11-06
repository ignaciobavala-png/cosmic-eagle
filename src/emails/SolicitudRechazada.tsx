import { copyFor, rich, fill, type CopyOverrides } from "@/lib/email/templates";
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
  copy,
}: {
  nombre: string;
  viaje: string;
  url: string;
  copy?: CopyOverrides;
}) {
  const k = copyFor("rechazada", copy);
  const vars = { nombre, viaje };
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

export default SolicitudRechazada;
