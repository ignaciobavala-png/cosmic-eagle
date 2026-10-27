/**
 * Textos de partida para el redactor de correo del CRM (`SendEmailPanel`). Son
 * copy de Sofía: se cargan en el formulario y se pueden editar antes de enviar.
 * El saludo ("Hola {nombre},"), el cierre y el aviso del pie los pone
 * `MensajeEquipo`, así que no van acá.
 */
export const CRM_TEMPLATE_NUEVAS_FECHAS = {
  label: "Nuevas fechas",
  // El asunto no vino en el texto de Sofía: se mantiene el que ya usaba el
  // ejemplo del CRM.
  subject: "Una invitación para ti",
  message: `Esperamos que estés muy bien!

Queremos contarte que hemos abierto nuevas fechas para nuestras próximas experiencias y nos encantaría volver a compartir este camino contigo.

Cada viaje es una oportunidad para seguir explorando y profundizando en nuestro proceso de evolución personal.

Y si conoces a alguien cercano que pueda resonar con estas experiencias, estaremos felices de que compartas esta invitación.

Lectura recomendada:
Más allá de una experiencia: el camino de la evolución consciente a través de los viajes cósmicos.

Esperamos encontrarnos pronto.`,
} as const;
