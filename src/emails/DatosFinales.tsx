import { copyFor, rich, fill, type CopyOverrides } from "@/lib/email/templates";
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
  copy,
}: {
  nombre: string;
  viaje: string;
  /** Fecha y hora ya formateadas. */
  cuando: string;
  donde: string | null;
  queLlevar: string | null;
  llegadas: string | null;
  url: string;
  copy?: CopyOverrides;
}) {
  const k = copyFor("datos", copy);
  const vars = { nombre, viaje };
  return (
    <BaseLayout preview={fill(k.preview, vars)}>
      <Title>{fill(k.title, vars)}</Title>

      <Paragraph>Hola {nombre},</Paragraph>

      <Paragraph preLine>{rich(k.intro, vars)}</Paragraph>

      {donde && (
        <Paragraph>
          <strong>Dónde:</strong> {donde}
        </Paragraph>
      )}

      <Paragraph>
        <strong>Cuándo:</strong> {cuando}
      </Paragraph>

      {/* Los dos van con `preLine`: se cargan como lista desde el panel y sin
          eso salen en un renglón corrido. */}
      {llegadas && (
        <Paragraph preLine>
          <strong>Llegadas y salidas:</strong> {llegadas}
        </Paragraph>
      )}

      {queLlevar && (
        <Paragraph preLine>
          <strong>Qué llevar:</strong>
          {"\n"}
          {queLlevar}
        </Paragraph>
      )}

      <CtaButton href={url}>{fill(k.button, vars)}</CtaButton>

      <Paragraph preLine>{rich(k.closing, vars)}</Paragraph>
    </BaseLayout>
  );
}

export default DatosFinales;
