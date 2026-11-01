import { BaseLayout, Paragraph, Title } from "./BaseLayout";

/**
 * Correo INTERNO: lo manda el asistente de IA del panel a una o varias personas
 * del equipo, a pedido de otra persona del equipo. Nunca llega a un viajero (el
 * destinatario sale de los admins, no de lo que escriba el modelo).
 */
export function AvisoInterno({
  nombre,
  asunto,
  mensaje,
  pedidoPor,
}: {
  nombre: string;
  asunto: string;
  mensaje: string;
  pedidoPor: string;
}) {
  return (
    <BaseLayout preview={asunto}>
      <Title>{asunto}</Title>
      <Paragraph>Hola {nombre},</Paragraph>
      <Paragraph preLine>{mensaje}</Paragraph>
      <Paragraph>
        <span style={{ fontSize: "12px", color: "#8a8478" }}>
          Mensaje interno enviado desde el asistente del panel, a pedido de {pedidoPor}.
        </span>
      </Paragraph>
    </BaseLayout>
  );
}

export default AvisoInterno;
