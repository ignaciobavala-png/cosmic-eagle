// Postgres `date` llega como "YYYY-MM-DD". Hay que parsearlo como UTC y
// formatearlo en UTC: si no, el timezone local corre la fecha un dia hacia atras.
function parseDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`);
}

/**
 * Rango compacto para las tarjetas de viaje: "15 - 20 oct 2024".
 * Si el rango cruza de mes o de año, repite la parte que cambia.
 */
export function formatDateRangeCompact(startDate: string, endDate: string) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const day = (d: Date) =>
    d.toLocaleDateString("es-CL", { day: "numeric", timeZone: "UTC" });
  const monthYear = (d: Date) =>
    d.toLocaleDateString("es-CL", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });

  if (startDate === endDate) return `${day(start)} ${monthYear(start)}`;

  return monthYear(start) === monthYear(end)
    ? `${day(start)} - ${day(end)} ${monthYear(end)}`
    : `${day(start)} ${monthYear(start)} - ${day(end)} ${monthYear(end)}`;
}

/**
 * Fecha de una jornada del programa: "viernes 11". La jornada 1 es el dia de
 * inicio del viaje, asi que se deriva sumando dias a `start_date` — el programa
 * no guarda fechas propias (ver src/lib/trip-schedule.ts).
 */
export function formatScheduleDay(startDate: string, day: number) {
  const date = parseDate(startDate);
  date.setUTCDate(date.getUTCDate() + day - 1);

  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * El aporte de un viaje: "USD 900".
 *
 * **Los precios de `trips.price` estan fijados en dolares** (definido el
 * 02/09/2026, punto 6 de la consulta de cobros). Los demas rieles cobran el
 * equivalente del dia: el IBAN de Santander en euros, Encuadrado en lo que
 * cobre. Por eso no hay columna `currency` en `trips` — la moneda del viaje es
 * siempre esta, y la del riel la aclara cada medio de cobro.
 *
 * Es la unica funcion que imprime un precio: antes "USD" estaba escrito a mano
 * en tres pantallas y la cuarta lo omitia a proposito.
 */
export function formatAmount(price: number): string {
  return `USD ${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(price)}`;
}
