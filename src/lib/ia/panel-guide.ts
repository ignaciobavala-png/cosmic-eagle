import "server-only";

/**
 * Guia del panel para el asistente: que hace cada seccion y como se usa. Es lo
 * que le permite contestar "¿como hago X?" en vez de inventar.
 *
 * Reglas de este archivo:
 * - Solo lo que el panel hace DE VERDAD, con los nombres de botones y secciones
 *   tal como se ven. Si una pantalla cambia, se cambia aca.
 * - Va en el prompt: la lista corta siempre, el detalle solo de la pantalla en
 *   la que esta la persona (para no pagar tokens de lo que no se usa).
 */
type Seccion = {
  ruta: string;
  nombre: string;
  /** Una linea: para que sirve. */
  resumen: string;
  /** Como se usa, en pasos cortos. */
  como: string[];
};

const SECCIONES: Seccion[] = [
  {
    ruta: "/admin/solicitudes",
    nombre: "Solicitudes",
    resumen: "las personas que quieren ir a un viaje o sesión: revisión de Estela y confirmación del pago",
    como: [
      "Los filtros de arriba separan por estado (esperando revisión, aprobadas, etc.).",
      "Al abrir una solicitud se ve el filtro corto, y más adelante el formulario de salud y el consentimiento.",
      "Estela la aprueba, la rechaza o pide conversar antes. Quien revisa no puede ser la misma persona que se anotó.",
      "Al aprobar, la persona recibe el correo de aprobación y queda habilitada en la biblioteca.",
      "El pago lo confirma Estela a mano mirando el comprobante que sube la persona; el estado pasa de pendiente a seña pagada y a pagado.",
    ],
  },
  {
    ruta: "/admin/pagos",
    nombre: "Pagos",
    resumen: "los datos de cobro (cuentas, medios) que ve una persona cuando la aprueban",
    como: [
      "Cada medio de cobro tiene sus datos y se puede marcar como visible u oculto.",
      "Se muestran todos los visibles y la persona elige el que le sirva: conviene que cada uno diga a quién le corresponde y en qué moneda.",
    ],
  },
  {
    ruta: "/admin/crm",
    nombre: "CRM",
    resumen: "todas las personas registradas, con su nivel de experiencia y su estado",
    como: [
      "El estado sale del historial: viajero (reserva aprobada), solicitante (en revisión) o potencial (se registró pero no viajó).",
      "Se filtra por estado, nivel, país, género o evento.",
      "Desde acá se le manda un correo a todo un grupo filtrado, con el redactor de correo.",
      "También se pueden copiar los mails del grupo.",
    ],
  },
  {
    ruta: "/admin/sesiones",
    nombre: "Sesiones",
    resumen: "las Sesiones Cósmicas (ceremonias de un día)",
    como: [
      "Cada una se crea y se edita con el formulario de Experiencias: nombre, fechas, cupo, precio en USD y portada.",
      "La fecha se escribe en el nombre porque la tarjeta del sitio no la muestra; las fechas reales igual se cargan.",
      "Estado: borrador (no se ve en el sitio), abierta (se pueden anotar), cerrada o realizada.",
    ],
  },
  {
    ruta: "/admin/viajes",
    nombre: "Retiros",
    resumen: "los Viajes Cósmicos (retiros de varios días)",
    como: [
      "Mismo formulario que las sesiones: nombre, fechas, cupo, precio en USD, portada y detalle.",
      "Un borrador no se muestra en el sitio hasta pasarlo a abierto.",
      "Un evento que ya pasó se pasa solo a realizado.",
    ],
  },
  {
    ruta: "/admin/multimedia",
    nombre: "Multimedia",
    resumen: "las imágenes, los videos y los textos de las páginas públicas",
    como: [
      "Cada elemento editable tiene su lugar; lo que se cambia se ve enseguida en el sitio.",
      "Las imágenes se recortan y comprimen en el navegador al subirlas: lo que se ve en la vista previa es lo que se guarda.",
      "Los videos pesados (más de unos 4 MB) todavía fallan al subir: conviene comprimirlos antes.",
    ],
  },
  {
    ruta: "/admin/contenidos",
    nombre: "Contenidos",
    resumen: "los artículos de la biblioteca",
    como: [
      "Botón Nuevo contenido. Cada uno tiene categoría, nivel de acceso (público, miembros o programa), imagen y audio opcional.",
      "El cuerpo es texto plano con reglas simples (títulos, listas, citas); no se pega HTML en el cuerpo.",
      "Cada contenido se puede compartir con un link.",
    ],
  },
  {
    ruta: "/admin/testimonios",
    nombre: "Testimonios",
    resumen: "los testimonios que se muestran en el sitio",
    como: ["Botón Nuevo testimonio. Se pueden editar o borrar."],
  },
  {
    ruta: "/admin/faqs",
    nombre: "Preguntas frecuentes",
    resumen: "las preguntas y respuestas del sitio",
    como: ["Botón Nueva pregunta. Un borrador no se muestra en el sitio."],
  },
  {
    ruta: "/admin/legales",
    nombre: "Legales",
    resumen: "los documentos de Privacidad y Términos",
    como: [
      "Salen con un texto preliminar: hay que revisarlo y completar los datos marcados entre corchetes.",
      "Falta definir el país, porque de eso depende qué ley de datos aplica.",
    ],
  },
  {
    ruta: "/admin/material",
    nombre: "Envío material",
    resumen: "documentos en HTML que arma la organización y se comparten por link",
    como: [
      "Botón Subir documento: se sube un HTML ya armado en la computadora.",
      "Cada documento tiene su link para compartir.",
      "El mismo HTML también se puede cargar como contenido de la biblioteca.",
    ],
  },
  {
    ruta: "/admin/acceso",
    nombre: "Niveles de acceso",
    resumen: "quién puede leer los contenidos del programa",
    como: [
      "No hay que habilitar a nadie a mano: al aprobar una solicitud la persona queda habilitada sola.",
      "Los códigos son para quien no pasó por la plataforma (por ejemplo, quienes ya ceremoniaron antes de la web).",
      "Qué nivel pide cada texto se elige en Contenidos.",
    ],
  },
  {
    ruta: "/admin/suscriptores",
    nombre: "Suscriptores",
    resumen: "los correos que se anotaron en el formulario del pie de la página",
    como: ["Es una lista para consultar y copiar."],
  },
  {
    ruta: "/admin/notificaciones",
    nombre: "Notificaciones",
    resumen: "la campanita: solicitudes nuevas, comprobantes cargados, correos que fallaron",
    como: ["Se filtran por leídas o no leídas y se pueden marcar todas como leídas."],
  },
  {
    ruta: "/admin",
    nombre: "Dashboard",
    resumen: "la portada del panel: cifras, y el botón de Salida oficial",
    como: [
      "Muestra los números principales del sitio.",
      "La tarjeta de Salida oficial: mientras el dominio muestra la pantalla de “en construcción”, al apretarla el sitio se muestra al público. Puede tardar unos segundos en verse.",
    ],
  },
];

/** Normaliza lo que manda el cliente: solo rutas del panel, sin query ni ids. */
export function cleanPagina(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.split(/[?#]/)[0].slice(0, 120);
  return path === "/admin" || path.startsWith("/admin/") ? path : null;
}

function seccionDe(pagina: string | null) {
  if (!pagina) return null;
  // La mas especifica primero: "/admin" es prefijo de todas y va ultima.
  return (
    [...SECCIONES]
      .sort((a, b) => b.ruta.length - a.ruta.length)
      .find((s) => (s.ruta === "/admin" ? pagina === "/admin" : pagina.startsWith(s.ruta))) ?? null
  );
}

/** Bloque de prompt: el mapa corto del panel + el detalle de donde esta la persona. */
export function guiaParaPrompt(pagina: string | null): string {
  const mapa = SECCIONES.map((s) => `- ${s.nombre} (${s.ruta}): ${s.resumen}.`).join("\n");
  const aqui = seccionDe(pagina);
  const detalle = aqui
    ? `\n\nLa persona está AHORA en "${aqui.nombre}" (${pagina}). Lo que sabés de esta pantalla:\n${aqui.como.map((c) => `- ${c}`).join("\n")}`
    : pagina
      ? `\n\nLa persona está en ${pagina} (una pantalla de detalle o edición del panel).`
      : "";

  return `Guía del panel (para explicar cómo se hace algo). Secciones:\n${mapa}${detalle}

Cómo usar la guía: respondé "cómo hago X" con pasos cortos y los nombres exactos de las secciones y botones de arriba. Si algo no está en la guía, decí que no estás seguro en vez de inventar un botón o un paso, y sugerí preguntarle a Ignacio.`;
}
