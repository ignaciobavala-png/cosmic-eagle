import { BaseLayout, CtaButton, Paragraph, Title } from "./BaseLayout";

/**
 * Correo [7] de docs/COMUNICACIONES.md: los datos para la llegada.
 *
 * Lo manda el cron unos dias antes del viaje. **Estuvo bloqueado desde el 15/08
 * y no por falta de template**: tres de sus cuatro variables ({direccion},
 * {fecha y hora}, {lista}) no existian como campo de `trips` hasta la migracion
 * `20260903060000_trip_logistics_fields.sql`.
 *
 * La regla de envio no lo manda si el viaje no tiene cargada ni la direccion ni
 * la lista: un correo que dice "aca van los datos" y despues no trae ninguno es
 * peor que no escribir.
 */
export function DatosFinales({
  nombre,
  viaje,
  cuando,
  donde,
  queLlevar,
  llegadas,
  url,
}: {
  nombre: string;
  viaje: string;
  /** Fecha y hora ya formateadas. */
  cuando: string;
  donde: string | null;
  queLlevar: string | null;
  llegadas: string | null;
  url: string;
}) {
  return (
    <BaseLayout preview={`Todo lo que necesitas saber para llegar a ${viaje}`}>
      <Title>Todo lo que necesitas saber para tu llegada</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph>
        Ya estamos cerca. Acá van los datos para tu llegada a{" "}
        <strong>{viaje}</strong>.
      </Paragraph>

      {donde && (
        <Paragraph>
          <strong>Dónde:</strong> {donde}
        </Paragraph>
      )}

      <Paragraph>
        <strong>Cuándo:</strong> {cuando}
      </Paragraph>

      {llegadas && (
        <Paragraph>
          <strong>Llegadas y salidas:</strong> {llegadas}
        </Paragraph>
      )}

      {queLlevar && (
        <Paragraph>
          <strong>Qué llevar:</strong> {queLlevar}
        </Paragraph>
      )}

      <CtaButton href={url}>Ver todos los detalles</CtaButton>

      <Paragraph>
        Si tienes cualquier duda antes de llegar, escríbenos. Te esperamos.
      </Paragraph>
    </BaseLayout>
  );
}

export default DatosFinales;
