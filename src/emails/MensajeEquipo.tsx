import { BaseLayout, Paragraph, Title } from "./BaseLayout";

/**
 * Mensaje libre del equipo a un grupo de personas del CRM (14/10). El texto lo
 * escribe Estela o Sofía en `/admin/crm`; la plantilla solo pone el marco de la
 * marca, el saludo por nombre y la nota de por qué les llega.
 *
 * `preLine` en el cuerpo: respeta los saltos de línea y los párrafos que tipeó
 * quien escribe.
 */
export function MensajeEquipo({
  nombre,
  asunto,
  mensaje,
}: {
  nombre: string;
  asunto: string;
  mensaje: string;
}) {
  return (
    <BaseLayout preview={asunto}>
      <Title>{asunto}</Title>
      <Paragraph>Hola {nombre},</Paragraph>
      <Paragraph preLine>{mensaje}</Paragraph>
      <Paragraph>
        <span style={{ fontSize: "12px", color: "#8a8478" }}>
          Recibes este correo porque tienes una cuenta en Cosmic Eagle Journey.
          Si prefieres no recibir más mensajes, respóndenos a este correo.
        </span>
      </Paragraph>
    </BaseLayout>
  );
}

export default MensajeEquipo;
