import "server-only";

/**
 * Los plazos de los correos programados, todos en un archivo.
 *
 * **Casi todos son PROVISORIOS.** Salen de las sugerencias que Sofia dejo al pie
 * de su documento (docs/COMUNICACIONES.md §5) y de la unica cifra que escribio
 * en firme (los 15 dias del correo [3A]). Estan aca sueltos, y no repartidos por
 * el codigo, para que confirmarlos sea cambiar un numero — mismo criterio que
 * los umbrales inventados del CRM en `src/lib/crm.ts`.
 *
 * Cuando responda, esto es lo que se toca:
 *
 * | Constante | De donde sale | Estado |
 * |---|---|---|
 * | `BALANCE_DUE_DAYS` | correo [3A], escrito por ella | firme para Viajes, en duda para Sesiones (pregunta 4 de docs/consulta-sofia-pagos.txt) |
 * | `BALANCE_REMINDER_LEAD_DAYS` | "unos dias antes del corte" | inventado |
 * | `MIN_DAYS_AFTER_PAYMENT` | ninguna | inventado, ver abajo |
 * | `FORMS_GRACE_DAYS` | ninguna | inventado |
 * | `PREPARATION_DAYS` | su sugerencia: 10 Sesiones / 14 Viajes | sugerido |
 * | `FINAL_DETAILS_DAYS` | su sugerencia: 3 a 5 | sugerido |
 * | `INTEGRATION_DAYS` | su sugerencia: 1 a 2 | sugerido |
 * | `FEEDBACK_DAYS` | su sugerencia: 7 a 10 | sugerido |
 */
export const SCHEDULE = {
  /** [3B] Dias antes del viaje en que vence el saldo. */
  BALANCE_DUE_DAYS: 15,

  /** [3B] Cuanto antes del vencimiento sale el recordatorio. */
  BALANCE_REMINDER_LEAD_DAYS: 3,

  /**
   * [3B] Dias minimos entre el pago de la sena y el recordatorio.
   *
   * No es un capricho: sin esta guarda, alguien que reserva una Sesion a diez
   * dias de la fecha recibe "tu cupo esta reservado" y, al dia siguiente, un
   * recordatorio de saldo. Dos correos contradictorios en 24 horas.
   */
  MIN_DAYS_AFTER_PAYMENT: 2,

  /** [4A] Dias desde el pago sin que aparezca el formulario de salud. */
  FORMS_GRACE_DAYS: 3,

  /** [6] Dias antes del viaje, por tipo. Una Sesion prepara menos que un Viaje. */
  PREPARATION_DAYS: { ceremonia: 10, retiro: 14 },

  /** [7] Dias antes del viaje para los datos de llegada. */
  FINAL_DETAILS_DAYS: 4,

  /** [8] Dias despues del cierre para el material de integracion. */
  INTEGRATION_DAYS: 2,

  /** [9] Dias despues del cierre para pedir el feedback. */
  FEEDBACK_DAYS: 8,
} as const;

/**
 * Cuantos correos manda como maximo una corrida.
 *
 * El plan free de Resend son ~100 mails/dia, y los correos de la app (aprobar,
 * rechazar, registrar un pago) comparten esa cuota. Un tope bajo evita que un
 * error de fechas en un viaje con mucha gente se coma el dia entero de envios;
 * lo que sobra sale en la corrida siguiente, porque el barrido es idempotente.
 */
export const MAX_SENDS_PER_RUN = 40;

/**
 * Pausa entre envios, en ms. Resend limita a ~2 pedidos por segundo y responde
 * 429 si se lo pasa; con el tope de arriba, la corrida entera son ~24 segundos.
 */
export const SEND_INTERVAL_MS = 600;
