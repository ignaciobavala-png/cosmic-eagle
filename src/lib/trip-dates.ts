/**
 * El "hoy" con el que se decide si una experiencia ya pasó.
 *
 * Existe porque ninguna consulta de `trips` filtraba por fecha y las
 * experiencias terminadas seguían en cartelera —y en el "Próximo viaje" del
 * panel, que ordenaba ascendente sin filtro y mostraba el más viejo de la base.
 *
 * `start_date` y `end_date` son columnas `date`: sin hora y sin zona, y llegan
 * como "YYYY-MM-DD". Para compararlas hay que mandarle a Postgres un string del
 * mismo tipo, y armarlo **en UTC**: con los getters locales, alguien en -03 que
 * entra a las 22:00 ya está en el día siguiente en UTC, así que la cartelera se
 * correría un día entero según dónde corra el código (Vercel está en UTC, el
 * `next dev` de acá no). `toISOString()` es UTC por definición y por eso es lo
 * único que se usa.
 *
 * El criterio es que **pasada es la que terminó**: el filtro va siempre
 * `.gte("end_date", todayUTC())` y nunca sobre `start_date`, para que un Viaje
 * de una semana que arrancó anteayer siga mostrándose mientras está en curso.
 * Y va en la consulta, no en JS: las carteleras traen `limit` (la home, el
 * panel) y descartar después del límite deja menos tarjetas de las publicadas.
 */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}
