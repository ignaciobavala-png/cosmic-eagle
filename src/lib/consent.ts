/**
 * El consentimiento informado, transcripto LITERAL del formulario de Google que
 * la clienta usa hoy ("Consentimiento Informado – Cosmic Eagle", el link está
 * en `docs/FORMULARIOS.md`). Extraído del HTML del formulario el 05/09/2026.
 *
 * **Es texto legal de la clienta: no se reescribe, no se resume y no se le
 * corrigen las comas** (regla "No hacer" de CLAUDE.md). Si ella cambia el
 * texto, se cambia acá Y se sube `CONSENT_VERSION`: las firmas viejas guardan
 * la versión que aceptaron, y sin eso el registro no dice qué se firmó.
 *
 * La versión en inglés está transcripta en `docs/CONSENTIMIENTO.md`. No se
 * implementa todavía porque el sitio es monolingüe (el i18n sigue pendiente),
 * pero ya no hay que volver a extraerla.
 */

/** Se sube cuando cambia cualquier texto de este archivo. */
export const CONSENT_VERSION = "2026-09-05";

export const CONSENT_INTRO =
  "Por favor lee atentamente cada sección antes de completar el formulario.";

/** Los cinco bloques del formulario, en su orden. */
export const CONSENT_SECTIONS = [
  {
    title: "Viaje",
    body: "El viaje tiene como objetivo acompañar al participante en una experiencia de expansión de conciencia a través de una sesión de hongos psilocybe con acompañamiento de los facilitadores. Esta sesión está orientada a la introspección y crecimiento personal, se realiza en un ambiente seguro y con intenciones claras para el bienestar del participante.",
  },
  {
    title: "Facilitador",
    body: "El facilitador brindará un entorno seguro, apoyo emocional y acompañamiento durante el proceso. Este acompañamiento incluirá la observación de la seguridad física del participante, apoyo para la integración de la experiencia y contención en todo momento. Sin embargo, el facilitador no será responsable de los efectos específicos de la experiencia que el participante pueda experimentar.",
  },
  {
    title: "Experiencia",
    body: "El participante reconoce que la experiencia puede involucrar cambios en la percepción, emociones, pensamientos y en la sensación de identidad. Esta experiencia puede ser intensa y provocar estados de conciencia ampliados. El participante comprende que el proceso puede activar recuerdos, emociones o pensamientos profundos que pueden ser difíciles de procesar en el momento.",
  },
  {
    // En el original son dos viñetas. Se guardan como items y no como un solo
    // párrafo con guiones, que es como los escribió el formulario de Google.
    title: "Consideraciones",
    items: [
      "La experiencia puede facilitar el autoconocimiento, la sanación emocional, el desarrollo personal y la expansión de conciencia. No se garantiza un resultado específico.",
      "La experiencia puede incluir ansiedad, desorientación, miedo, y en ocasiones pueden traer a la conciencia experiencias pasadas dolorosas o reprimidas. Estos estados pueden generar incomodidad emocional.",
    ],
  },
  {
    title: "Confidencialidad",
    body: "Toda la información compartida durante las sesiones es estrictamente confidencial y será manejada conforme a las leyes vigentes de protección de datos personales. El facilitador se compromete a no compartir ninguna información sin el consentimiento expreso del participante.",
  },
] as const;

/** El bloque "Consentimiento": la declaración que se firma. */
export const CONSENT_DECLARATION = {
  title: "Consentimiento",
  body: "Declaro que he leído y comprendido los términos y condiciones expuestos en este consentimiento informado. Confirmo que participo en esta experiencia de manera voluntaria y que tengo la capacidad legal para dar mi consentimiento. He tenido la oportunidad de hacer preguntas y aclarar dudas, y me siento informado sobre el proceso y los riesgos involucrados.",
} as const;

/**
 * Las cuatro confirmaciones.
 *
 * **Van las cuatro obligatorias.** En Google son un grupo de casillas marcado
 * como "requerido", que ahí significa "al menos una" — pero el bloque se llama
 * "Confirmaciones requeridas" y cada una afirma algo distinto e imprescindible
 * (que leyó, que es voluntario, que pudo preguntar, que llenó el formulario de
 * salud). Tres de cuatro no es un consentimiento informado.
 *
 * El `id` es lo que ata la respuesta a su texto: se guardan los dos, porque el
 * texto puede cambiar y el registro tiene que decir qué se aceptó.
 */
export const CONSENT_CONFIRMATIONS = [
  {
    id: "leido",
    label: "He leído y comprendido todos los términos de este consentimiento",
  },
  {
    id: "voluntario",
    label: "Participo de manera voluntaria y tengo capacidad legal para consentir",
  },
  {
    id: "informado",
    label:
      "He podido hacer preguntas y me siento informado/a sobre el proceso y los riesgos",
  },
  {
    id: "salud",
    label: "He rellenado el formulario de salud obligatorio",
  },
] as const;

export const CONSENT_SIGNATURE_LABEL =
  "Escribe tu nombre completo como firma digital";
export const CONSENT_SIGNATURE_HINT =
  "Al escribir tu nombre confirmas tu consentimiento.";

/** Lo que se guarda en `consents.confirmations`. */
export type ConsentConfirmationRecord = {
  id: string;
  label: string;
  accepted: true;
};
