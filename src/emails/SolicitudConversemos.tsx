import { copyFor, rich, fill, type CopyOverrides } from "@/lib/email/templates";
import { BaseLayout, Paragraph, Title } from "./BaseLayout";

/**
 * Correo [2A] del documento de comunicaciones de Sofia (ver
 * docs/COMUNICACIONES.md). Lo dispara `reviewApplication` en la transicion a
 * `needs_conversation`.
 *
 * **El copy es de la clienta, literal.** Esta en tuteo, como el encuadre del
 * filtro corto y a diferencia del voseo del resto del sitio. No se reescribe
 * sin consultar.
 *
 * Dos cosas que no hay que "completar":
 *
 * 1. **No dice QUE aspecto hay que mirar.** Lo que dispara este estado suele
 *    ser una bandera de salud del filtro, y detallarla en un mail es mandar
 *    informacion medica por un canal que despues no controlamos. Mismo criterio
 *    que `SolicitudRechazada`.
 * 2. **No lleva boton.** Es el unico correo del flujo cuyo paso siguiente es
 *    humano: contesta Estela por privado. Un CTA a la pantalla de estado seria
 *    mandar a la persona a leer lo mismo que ya esta leyendo.
 */
export function SolicitudConversemos({
  nombre,
  viaje,
  copy,
}: {
  nombre: string;
  viaje: string;
  copy?: CopyOverrides;
}) {
  const k = copyFor("conversemos", copy);
  const vars = { nombre, viaje };
  return (
    <BaseLayout preview={fill(k.preview, vars)}>
      <Title>{fill(k.title, vars)}</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph preLine>{rich(k.p1, vars)}</Paragraph>
      <Paragraph preLine>{rich(k.p2, vars)}</Paragraph>
      <Paragraph preLine>{rich(k.p3, vars)}</Paragraph>
      <Paragraph preLine>{rich(k.p4, vars)}</Paragraph>
    </BaseLayout>
  );
}

export default SolicitudConversemos;
