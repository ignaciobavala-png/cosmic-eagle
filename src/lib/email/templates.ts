import { Fragment, createElement, type ReactNode } from "react";

/**
 * Registro de los textos editables de los correos (editor de /admin/correos).
 *
 * **Qué se edita y qué no.** Se editan los *textos*: asunto, título, párrafos y
 * etiquetas de botón. El marco (paleta, tipografías, tablas con `bgcolor`), el
 * saludo, la lógica de qué párrafo aparece en cada caso y los datos de pago
 * siguen en el código: un correo no se puede "romper" desde el panel.
 *
 * **El texto de acá es el valor por defecto.** Si una persona edita un campo,
 * se guarda en `email_templates` y pisa al original; si lo restaura, se borra la
 * fila y vuelve el de acá. Sin filas, los correos salen exactamente como antes.
 *
 * Marcado de un campo: `{variable}` se reemplaza por el dato real y `**texto**`
 * va en negrita. Una variable vacía se lleva con ella los paréntesis que la
 * rodean (`({fechas})` desaparece si el viaje no tiene fechas).
 *
 * Este archivo es puro (sin `server-only`): lo leen las plantillas, el cron y el
 * editor del panel, que es un componente de cliente.
 */

export type CopyField = {
  key: string;
  label: string;
  /** Cuándo se usa este texto, si el correo tiene variantes. */
  hint?: string;
  /** Un párrafo largo (textarea) en vez de una línea. */
  multiline?: boolean;
  default: string;
};

export type TemplateVar = { name: string; label: string; sample: string };

export type TemplateDef = {
  key: string;
  /** Código del documento de Sofía (docs/COMUNICACIONES.md). */
  code: string;
  label: string;
  /** Qué lo dispara. */
  when: string;
  vars: TemplateVar[];
  fields: CopyField[];
};

const V = {
  nombre: { name: "nombre", label: "Primer nombre de la persona", sample: "Camila" },
  viaje: { name: "viaje", label: "Nombre del viaje o sesión", sample: "Sesión en Santiago" },
  fechas: { name: "fechas", label: "Fechas (vacía si no hay)", sample: "5 de septiembre de 2026" },
} satisfies Record<string, TemplateVar>;

export const EMAIL_TEMPLATES: TemplateDef[] = [
  {
    key: "recibida",
    code: "[1]",
    label: "Solicitud recibida",
    when: "Apenas la persona envía el filtro corto.",
    vars: [V.nombre, V.viaje, V.fechas],
    fields: [
      { key: "subject", label: "Asunto", default: "Recibimos tu solicitud para {viaje}" },
      {
        key: "preview",
        label: "Vista previa en la bandeja",
        hint: "Lo que se lee junto al asunto antes de abrir el correo.",
        default: "Recibimos tu solicitud para {viaje}",
      },
      { key: "title", label: "Título", default: "Recibimos tu solicitud" },
      {
        key: "p1",
        label: "Párrafo 1",
        multiline: true,
        default:
          "Tu solicitud para **{viaje}** ({fechas}) ya está con nosotros. Estela la va a leer personalmente, una por una, y te vamos a escribir con la respuesta.",
      },
      {
        key: "p2",
        label: "Párrafo 2",
        multiline: true,
        default:
          "Si contaste algo sobre tu salud o algún tratamiento, nada de eso cierra la puerta: lo preguntamos para poder acompañarte mejor, no para descartar a nadie.",
      },
      {
        key: "p3",
        label: "Párrafo 3",
        multiline: true,
        default:
          "En tu cuenta puedes seguir en qué paso está tu solicitud en cualquier momento.",
      },
      { key: "button", label: "Botón", default: "Ver el estado de mi solicitud" },
    ],
  },
  {
    key: "aprobada",
    code: "[2]",
    label: "Solicitud aprobada",
    when: "Cuando Estela aprueba la solicitud.",
    vars: [
      V.nombre,
      V.viaje,
      V.fechas,
      { name: "total", label: "Precio total", sample: "USD 350" },
      { name: "sena", label: "Seña (sólo si el viaje la admite)", sample: "USD 175" },
    ],
    fields: [
      { key: "subject", label: "Asunto", default: "Tu solicitud para {viaje} fue aprobada" },
      {
        key: "preview",
        label: "Vista previa en la bandeja",
        default: "Tu lugar en {viaje} está confirmado",
      },
      { key: "title", label: "Título", default: "Tu solicitud fue aprobada" },
      {
        key: "intro",
        label: "Apertura",
        multiline: true,
        default:
          "Revisamos tu solicitud para **{viaje}** ({fechas}) y tienes tu lugar confirmado. Nos alegra mucho que nos acompañes.",
      },
      {
        key: "price_deposit",
        label: "Precio, con seña",
        hint: "Cuando el viaje se puede reservar con seña.",
        multiline: true,
        default:
          "Ya puedes reservar formalmente tu lugar. Puedes hacerlo con una seña de **{sena}**, o pagar el total de **{total}**.",
      },
      {
        key: "price_full",
        label: "Precio, pago completo",
        hint: "Cuando el viaje se paga completo.",
        multiline: true,
        default:
          "Ya puedes reservar formalmente tu lugar. El aporte de la experiencia es de **{total}**.",
      },
      {
        key: "no_methods",
        label: "Sin medios de pago cargados",
        hint: "Sólo sale si todavía no hay ningún medio activo en /admin/pagos.",
        multiline: true,
        default:
          "Para reservar tu cupo falta el pago. Te vamos a escribir con los datos en las próximas horas.",
      },
      {
        key: "with_methods",
        label: "Antes de los medios de pago",
        hint: "Los medios de pago se cargan en /admin/pagos y salen debajo de este texto.",
        multiline: true,
        default:
          "Para reservar tu cupo falta el pago. Estos son los medios disponibles; elige el que te sirva y envíanos el comprobante desde tu cuenta.",
      },
      { key: "pay_link", label: "Link de pago (etiqueta)", default: "Ir a pagar" },
      {
        key: "account",
        label: "Cierre",
        multiline: true,
        default:
          "En tu cuenta vas a encontrar los detalles de la experiencia, y ahí mismo puedes subirnos el comprobante del pago.",
      },
      { key: "button", label: "Botón", default: "Ver la experiencia y pagar" },
    ],
  },
  {
    key: "conversemos",
    code: "[2A]",
    label: "Nos gustaría conversar",
    when: "Cuando Estela marca la solicitud como «conversemos».",
    vars: [V.nombre, V.viaje],
    fields: [
      {
        key: "subject",
        label: "Asunto",
        default: "Sobre tu postulación — nos gustaría conversar",
      },
      {
        key: "preview",
        label: "Vista previa en la bandeja",
        default: "Sobre tu postulación para {viaje} — nos gustaría conversar",
      },
      { key: "title", label: "Título", default: "Nos gustaría conversar" },
      {
        key: "p1",
        label: "Párrafo 1",
        multiline: true,
        default: "Gracias por tu postulación para **{viaje}**.",
      },
      {
        key: "p2",
        label: "Párrafo 2",
        multiline: true,
        default:
          "Antes de continuar con el proceso, nos gustaría conversar contigo para conocer un poco mejor algunos aspectos de la información que compartiste.",
      },
      {
        key: "p3",
        label: "Párrafo 3",
        multiline: true,
        default:
          "Esto no significa que tu postulación haya sido rechazada, sino que queremos asegurarnos de que la experiencia sea adecuada y segura para ti.",
      },
      {
        key: "p4",
        label: "Párrafo 4",
        multiline: true,
        default:
          "Nuestro equipo se pondrá en contacto contigo para coordinar una conversación.",
      },
    ],
  },
  {
    key: "rechazada",
    code: "[2B]",
    label: "Solicitud no aprobada",
    when: "Cuando Estela rechaza la solicitud.",
    vars: [V.nombre, V.viaje],
    fields: [
      { key: "subject", label: "Asunto", default: "Sobre tu solicitud para {viaje}" },
      {
        key: "preview",
        label: "Vista previa en la bandeja",
        default: "Sobre tu solicitud para {viaje}",
      },
      { key: "title", label: "Título", default: "Sobre tu solicitud" },
      {
        key: "p1",
        label: "Párrafo 1",
        multiline: true,
        default:
          "Leímos con atención lo que nos compartiste sobre **{viaje}** y esta vez no vamos a poder acompañarte en esta experiencia.",
      },
      {
        key: "p2",
        label: "Párrafo 2",
        multiline: true,
        default:
          "No es un juicio sobre ti ni sobre tu proceso: cada círculo tiene un momento y una configuración, y parte de nuestro cuidado es reconocer cuándo no es el encuentro indicado. Si quieres conversarlo, puedes responder este mensaje y te escribimos.",
      },
      {
        key: "p3",
        label: "Párrafo 3",
        multiline: true,
        default:
          "Las puertas siguen abiertas para más adelante. Puedes ver las próximas experiencias del calendario y postularte cuando lo sientas.",
      },
      { key: "button", label: "Botón", default: "Ver las próximas experiencias" },
    ],
  },
  {
    key: "pago",
    code: "[3] [3A] [3C]",
    label: "Pago registrado",
    when: "Cuando Estela registra un pago (o marca la solicitud sin cargo). Tiene tres variantes.",
    vars: [
      V.nombre,
      V.viaje,
      V.fechas,
      { name: "monto", label: "Monto recibido", sample: "USD 175" },
      { name: "saldo", label: "Saldo pendiente", sample: "USD 175" },
    ],
    fields: [
      {
        key: "subject_sena",
        label: "Asunto · con seña",
        hint: "Variante [3A]: pagó la seña y queda saldo.",
        default: "Tu cupo en {viaje} está reservado",
      },
      {
        key: "preview_sena",
        label: "Vista previa · con seña",
        default: "Tu cupo en {viaje} está reservado",
      },
      { key: "title_sena", label: "Título · con seña", default: "Tu cupo está reservado" },
      {
        key: "subject_completo",
        label: "Asunto · saldo completado",
        hint: "Variante [3C]: venía de la seña y completó el saldo.",
        default: "Tu pago para {viaje} está completo",
      },
      {
        key: "preview_completo",
        label: "Vista previa · saldo completado",
        default: "Tu pago para {viaje} está completo",
      },
      {
        key: "title_completo",
        label: "Título · saldo completado",
        default: "Tu pago está completo",
      },
      {
        key: "subject_pagado",
        label: "Asunto · pago confirmado",
        hint: "Variante [3]: pagó el total de una vez (o sin cargo).",
        default: "Tu pago para {viaje} fue confirmado",
      },
      {
        key: "preview_pagado",
        label: "Vista previa · pago confirmado",
        default: "Tu pago para {viaje} fue confirmado",
      },
      { key: "title_pagado", label: "Título · pago confirmado", default: "Tu pago fue confirmado" },
      {
        key: "sena_alegria",
        label: "Apertura · con seña",
        multiline: true,
        default: "Qué alegría saber que nos acompañarás en **{viaje}** ({fechas}).",
      },
      {
        key: "body_sin_cargo",
        label: "Cuerpo · sin cargo",
        hint: "Invitación o cupón: no hubo transferencia.",
        multiline: true,
        default: "Tu lugar en **{viaje}** ({fechas}) quedó confirmado sin cargo.",
      },
      {
        key: "body_completo",
        label: "Cuerpo · saldo completado",
        multiline: true,
        default:
          "Recibimos el saldo. Tu inscripción en **{viaje}** ({fechas}) está completamente pagada, con un total de **{monto}**. Gracias por la confianza.",
      },
      {
        key: "body_sena",
        label: "Cuerpo · con seña",
        multiline: true,
        default: "Recibimos tu pago de **{monto}** y tu cupo ya está reservado.",
      },
      {
        key: "body_pagado",
        label: "Cuerpo · pago confirmado",
        multiline: true,
        default:
          "Recibimos tu pago de **{monto}** para **{viaje}** ({fechas}). Tu lugar en el círculo está confirmado.",
      },
      {
        key: "saldo_pendiente",
        label: "Aviso del saldo",
        hint: "Sólo en la variante con seña, si queda saldo.",
        multiline: true,
        default:
          "El saldo pendiente (**{saldo}**) puedes completarlo desde tu cuenta hasta 10 días antes del viaje. Si necesitas conversar sobre los plazos, escríbenos.",
      },
      {
        key: "salud_sena",
        label: "Formulario de salud · con seña",
        hint: "Cuando falta el formulario de salud y pagó con seña.",
        multiline: true,
        default:
          "Incluimos un formulario de experiencia e intenciones que te pedimos completar para conocerte mejor y preparar tu experiencia con el cuidado que merece.",
      },
      {
        key: "salud_normal",
        label: "Formulario de salud · pago normal",
        hint: "Cuando falta el formulario de salud y no es seña.",
        multiline: true,
        default:
          "Queda un paso importante: el formulario de salud completo. Es más largo que el primero y es lo que nos permite preparar la ceremonia y cuidar tu proceso, así que tómate el tiempo de responderlo con calma.",
      },
      {
        key: "button_salud",
        label: "Botón · formulario de salud",
        default: "Completar el formulario de salud",
      },
      {
        key: "gracias_sena",
        label: "Gracias · con seña",
        multiline: true,
        default: "¡Gracias por tu confianza! Nos alegra mucho compartir este viaje contigo.",
      },
      {
        key: "logistica",
        label: "Cuando no falta nada",
        hint: "Cuando el formulario de salud ya está cargado o no corresponde.",
        multiline: true,
        default:
          "Vamos a escribirte con la preparación previa y los datos de logística a medida que se acerque la fecha.",
      },
      {
        key: "button_detalles",
        label: "Botón · detalles",
        default: "Ver los detalles de la experiencia",
      },
    ],
  },
  {
    key: "saldo",
    code: "[3B]",
    label: "Recordatorio de saldo",
    when: "Automático (cron diario): se acerca la fecha y quedó un saldo pendiente.",
    vars: [
      V.nombre,
      V.viaje,
      V.fechas,
      { name: "saldo", label: "Saldo pendiente", sample: "USD 175" },
      { name: "fechaLimite", label: "Fecha límite", sample: "22 de agosto" },
    ],
    fields: [
      { key: "subject", label: "Asunto", default: "Recordatorio de tu saldo pendiente" },
      {
        key: "preview",
        label: "Vista previa en la bandeja",
        default: "Queda un saldo pendiente para {viaje}",
      },
      { key: "title", label: "Título", default: "Recordatorio de tu saldo pendiente" },
      {
        key: "p1",
        label: "Párrafo 1",
        multiline: true,
        default: "Esperamos que estés muy bien.",
      },
      {
        key: "p2",
        label: "Párrafo 2",
        multiline: true,
        default:
          "Te recordamos que tienes un saldo pendiente de **{saldo}** para **{viaje}** ({fechas}).",
      },
      {
        key: "deadline",
        label: "Plazo · con fecha límite",
        multiline: true,
        default:
          "Puedes completar tu pago hasta el **{fechaLimite}**, directamente desde tu cuenta.",
      },
      {
        key: "no_deadline",
        label: "Plazo · sin fecha límite",
        hint: "Cuando el corte ya pasó (se reservó tarde): no se nombra ninguna fecha.",
        multiline: true,
        default:
          "Puedes completar tu pago antes de la experiencia, directamente desde tu cuenta.",
      },
      {
        key: "p3",
        label: "Párrafo 3",
        multiline: true,
        default:
          "Si necesitas coordinar otros plazos, escríbenos con confianza y buscamos juntos una solución.",
      },
      {
        key: "p4",
        label: "Párrafo 4",
        multiline: true,
        default: "Nos alegra mucho que pronto podamos compartir esta experiencia.",
      },
      { key: "button", label: "Botón", default: "Ver saldo" },
    ],
  },
  {
    key: "formularios",
    code: "[4A]",
    label: "Formularios pendientes",
    when: "Automático (cron diario): pagó pero no completó el formulario de salud o el consentimiento.",
    vars: [V.nombre, V.viaje, V.fechas],
    fields: [
      {
        key: "subject",
        label: "Asunto",
        default: "Ya falta poco para completar tu inscripción",
      },
      {
        key: "preview",
        label: "Vista previa en la bandeja",
        default: "Ya falta poco para completar tu inscripción",
      },
      {
        key: "title_both",
        label: "Título · faltan los dos",
        hint: "Falta el formulario de salud y el consentimiento.",
        default: "Ya falta poco para completar tu inscripción",
      },
      {
        key: "both_1",
        label: "Faltan los dos · párrafo 1",
        multiline: true,
        default: "Qué alegría que pronto nos acompañarás en **{viaje}** ({fechas}).",
      },
      {
        key: "both_2",
        label: "Faltan los dos · párrafo 2",
        multiline: true,
        default:
          "Tu cupo ya está reservado. Solo quedan dos pasos para completar tu inscripción: el formulario de salud y el consentimiento informado.",
      },
      {
        key: "both_3",
        label: "Faltan los dos · párrafo 3",
        multiline: true,
        default:
          "El formulario nos ayudará a conocerte mejor y preparar tu experiencia con el cuidado que merece.",
      },
      {
        key: "both_4",
        label: "Faltan los dos · párrafo 4",
        multiline: true,
        default: "Luego podrás revisar y firmar el consentimiento informado.",
      },
      {
        key: "button_both",
        label: "Botón · faltan los dos",
        default: "Completar formulario de salud y consentimiento informado",
      },
      {
        key: "title_consent",
        label: "Título · falta sólo el consentimiento",
        default: "Te falta un paso",
      },
      {
        key: "consent_1",
        label: "Falta el consentimiento · párrafo 1",
        multiline: true,
        default:
          "Tu cupo en **{viaje}** ({fechas}) está reservado, pero todavía nos falta tu consentimiento informado firmado.",
      },
      {
        key: "consent_2",
        label: "Falta el consentimiento · párrafo 2",
        multiline: true,
        default:
          "Es el documento que explica en qué consiste la experiencia, cuál es el rol del facilitador y cómo cuidamos tu información. Se lee con calma y se firma escribiendo tu nombre completo.",
      },
      { key: "button_consent", label: "Botón · falta el consentimiento", default: "Leer y firmar" },
      {
        key: "closing",
        label: "Cierre",
        multiline: true,
        default: "Si tienes alguna duda o necesitas ayuda, escríbenos con confianza.",
      },
    ],
  },
  {
    key: "datos",
    code: "[7]",
    label: "Datos finales de llegada",
    when: "Automático (cron diario): unos días antes del viaje, si tiene dirección o lista cargada.",
    vars: [V.nombre, V.viaje],
    fields: [
      {
        key: "subject",
        label: "Asunto",
        default: "Todo lo que necesitas saber para llegar a {viaje}",
      },
      {
        key: "preview",
        label: "Vista previa en la bandeja",
        default: "Todo lo que necesitas saber para llegar a {viaje}",
      },
      {
        key: "title",
        label: "Título",
        default: "Todo lo que necesitas saber para tu llegada",
      },
      {
        key: "intro",
        label: "Apertura",
        multiline: true,
        default: "Ya estamos cerca. Aquí van los datos para tu llegada a **{viaje}**.",
      },
      { key: "button", label: "Botón", default: "Ver todos los detalles" },
      {
        key: "closing",
        label: "Cierre",
        multiline: true,
        default: "Si tienes cualquier duda antes de llegar, escríbenos. Te esperamos.",
      },
    ],
  },
];

export function getTemplateDef(key: string): TemplateDef | undefined {
  return EMAIL_TEMPLATES.find((t) => t.key === key);
}

/** Textos de un correo: lo guardado pisa al original, campo por campo. */
export type EmailCopy = Record<string, string>;

/** Lo que hay en la tabla para un correo: `campo → texto`. */
export type CopyOverrides = Record<string, string> | null | undefined;

export function copyFor(templateKey: string, overrides?: CopyOverrides): EmailCopy {
  const def = getTemplateDef(templateKey);
  const out: EmailCopy = {};
  for (const field of def?.fields ?? []) {
    const saved = overrides?.[field.key];
    out[field.key] = saved && saved.trim() ? saved : field.default;
  }
  return out;
}

export type CopyVars = Record<string, string | number | null | undefined>;

/**
 * Reemplaza `{variable}`. Si la variable viene vacía se lleva consigo los
 * paréntesis que la rodean y el espacio previo: «Sesión ({fechas}) y…» sin
 * fechas queda «Sesión y…». Una variable que no existe se deja tal cual, para
 * que el error de tipeo se vea en la vista previa.
 */
export function fill(text: string, vars: CopyVars): string {
  let out = text;
  for (const [name, value] of Object.entries(vars)) {
    if (value === null || value === undefined || value === "") {
      out = out.replace(new RegExp(`\\s?\\(\\s*\\{${name}\\}\\s*\\)`, "g"), "");
    }
  }
  return out.replace(/\{([a-zA-Z]+)\}/g, (whole, name: string) => {
    if (!(name in vars)) return whole;
    const value = vars[name];
    return value === null || value === undefined ? "" : String(value);
  });
}

/** `fill` + `**negrita**`, listo para meter dentro de un `<Paragraph>`. */
export function rich(text: string, vars: CopyVars): ReactNode {
  const parts = fill(text, vars).split(/\*\*([\s\S]+?)\*\*/g);
  return createElement(
    Fragment,
    null,
    ...parts.map((part, i) =>
      i % 2 === 1 ? createElement("strong", { key: i }, part) : part
    )
  );
}

/** Variables que usa un texto y que su correo no define (para validar al guardar). */
export function unknownVars(def: TemplateDef, text: string): string[] {
  const known = new Set(def.vars.map((v) => v.name));
  const found = new Set<string>();
  for (const m of text.matchAll(/\{([a-zA-Z]+)\}/g)) {
    if (!known.has(m[1])) found.add(m[1]);
  }
  return [...found];
}
