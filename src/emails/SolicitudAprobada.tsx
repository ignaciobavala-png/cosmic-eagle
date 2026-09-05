import { Text } from "react-email";
import { BaseLayout, CtaButton, Paragraph, Title, c, font } from "./BaseLayout";
import { formatAmount } from "@/lib/format";

export type MedioDePago = {
  id: string;
  label: string;
  audience: string | null;
  instructions: string;
  currency: string | null;
  link_url: string | null;
};

/**
 * Aviso de que una solicitud fue aprobada.
 *
 * Lo dispara `reviewApplication` cuando el admin aprieta "Aprobar", solo en la
 * transicion a `approved`. **Igual no sale nada hasta verificar el dominio en
 * Resend**: hasta entonces el sandbox solo entrega a la casilla dueña de la
 * cuenta, y el fallo queda anotado en /admin/notificaciones.
 *
 * No dice nada del codigo de acceso a proposito: ese mecanismo esta en revision
 * (ver `docs/consulta-sofia-acceso.txt`).
 *
 * Desde el 01/09 lleva los datos de pago (`medios`, cargados en /admin/pagos):
 * el paso siguiente a la aprobacion es pagar, y hasta ahora este mail no decia
 * como. Si no hay ningun medio activo cae en el texto viejo — "te escribimos
 * con los datos" — que es lo que pasaba antes.
 */
export function SolicitudAprobada({
  nombre,
  viaje,
  fechas,
  url,
  medios = [],
  total = 0,
  sena = null,
}: {
  nombre: string;
  viaje: string;
  fechas: string;
  url: string;
  medios?: MedioDePago[];
  total?: number;
  /** `null` cuando el viaje se paga completo: no hay dos opciones que ofrecer. */
  sena?: number | null;
}) {
  return (
    <BaseLayout preview={`Tu lugar en ${viaje} está confirmado`}>
      <Title>Tu solicitud fue aprobada</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph>
        Revisamos tu solicitud para <strong>{viaje}</strong> ({fechas}) y tienes tu
        lugar confirmado. Nos alegra mucho que nos acompañes.
      </Paragraph>

      {/* Las dos opciones, tal como las pide el correo [2] de Sofía
          (docs/COMUNICACIONES.md). Se dicen antes de los medios de pago: son
          la decisión, y los medios son el cómo. */}
      {total > 0 && (
        <Paragraph>
          {sena ? (
            <>
              Ya puedes reservar formalmente tu lugar. Puedes hacerlo con una
              seña de <strong>{formatAmount(sena)}</strong>, o pagar el total de{" "}
              <strong>{formatAmount(total)}</strong>.
            </>
          ) : (
            <>
              Ya puedes reservar formalmente tu lugar. El aporte de la
              experiencia es de <strong>{formatAmount(total)}</strong>.
            </>
          )}
        </Paragraph>
      )}

      {medios.length === 0 ? (
        <Paragraph>
          Para reservar tu cupo falta el pago. Te vamos a escribir con los datos
          en las próximas horas.
        </Paragraph>
      ) : (
        <>
          <Paragraph>
            Para reservar tu cupo falta el pago. Estos son los medios
            disponibles; elige el que te sirva y envíanos el comprobante desde
            tu cuenta.
          </Paragraph>

          {medios.map((medio) => (
            <table
              key={medio.id}
              width="100%"
              cellPadding={0}
              cellSpacing={0}
              role="presentation"
              style={{ margin: "0 0 16px", border: `1px solid ${c.border}`, borderRadius: "8px" }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: "16px 20px" }}>
                    <Text
                      style={{
                        margin: "0 0 4px",
                        color: c.gold,
                        fontSize: "16px",
                        lineHeight: "22px",
                        fontWeight: 700,
                        fontFamily: font.display,
                      }}
                    >
                      {medio.label}
                      {medio.currency ? ` · ${medio.currency}` : ""}
                    </Text>
                    {medio.audience && (
                      <Text
                        style={{
                          margin: "0 0 10px",
                          color: c.muted,
                          fontSize: "14px",
                          lineHeight: "20px",
                          fontFamily: font.body,
                        }}
                      >
                        {medio.audience}
                      </Text>
                    )}
                    {/* `whiteSpace: pre-line` conserva los saltos con los que se
                        cargaron los datos (titular, IBAN, BIC, uno por línea).
                        Gmail y Outlook lo respetan; el peor caso es un párrafo
                        corrido, no un dato perdido. */}
                    <Text
                      style={{
                        margin: 0,
                        color: c.text,
                        fontSize: "14px",
                        lineHeight: "22px",
                        whiteSpace: "pre-line",
                        fontFamily: font.body,
                      }}
                    >
                      {medio.instructions}
                    </Text>
                    {medio.link_url && (
                      <Text
                        style={{
                          margin: "10px 0 0",
                          fontSize: "14px",
                          lineHeight: "22px",
                          fontFamily: font.body,
                        }}
                      >
                        <a href={medio.link_url} style={{ color: c.gold }}>
                          Ir a pagar
                        </a>
                      </Text>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          ))}
        </>
      )}

      <Paragraph>
        En tu cuenta vas a encontrar los detalles de la experiencia, y ahí mismo
        puedes subirnos el comprobante del pago.
      </Paragraph>

      <CtaButton href={url}>Ver la experiencia y pagar</CtaButton>
    </BaseLayout>
  );
}

export default SolicitudAprobada;
