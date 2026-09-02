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
}: {
  nombre: string;
  viaje: string;
}) {
  return (
    <BaseLayout preview={`Sobre tu postulación para ${viaje} — nos gustaría conversar`}>
      <Title>Nos gustaría conversar</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph>
        Gracias por tu postulación y por la honestidad con la que compartiste tu
        información.
      </Paragraph>

      <Paragraph>
        Antes de avanzar nos gustaría conversar contigo. Hay algunos aspectos de
        lo que nos contaste que preferimos mirar juntos, con calma, para
        entender qué cuidados necesita tu proceso.
      </Paragraph>

      <Paragraph>
        Esto no significa que no puedas participar. Significa que queremos
        hacerlo bien.
      </Paragraph>

      <Paragraph>
        Nuestro equipo se pondrá en contacto contigo. Si prefieres, puedes
        responder este correo y coordinamos.
      </Paragraph>

      <Paragraph>Un abrazo.</Paragraph>
    </BaseLayout>
  );
}

export default SolicitudConversemos;
