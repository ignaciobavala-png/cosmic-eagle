export const IMAGES = {
  // Logo oficial de la disenadora (PNG con alpha, 1207x433), servido desde /public
  logo: "/logo.png",
  // Assets de Julia, convertidos a WebP y servidos desde /public/img
  // (fuente original en ~/Descargas/frontend_eagle, ver docs/DESIGN_ASSETS.md)
  heroHome: "/img/hero-home.webp",
  heroViajes: "/img/hero-viajes.webp",
  // Las siluetas de particulas se repiten a proposito en el mockup: son el hero
  // de /nosotros y el fondo de la banda de llamado de /viajes. Julia exporto el
  // mismo archivo en las dos carpetas (BANNER_HERO_NOSOTROS = IMAGE_VIAJES_PT2),
  // asi que aca tambien es uno solo.
  almas: "/img/almas-particulas.webp",
  nosotrosProposito: "/img/nosotros-proposito.webp",
  nosotrosMetodologia: "/img/nosotros-metodologia.webp",
  // Rediseno de la home (docs/HOME_REDISENO.md). Los degrades de "La humanidad",
  // la banda dorada y el fondo del footer NO estan aca: se hacen en CSS.
  homeHero: "/img/home/hero.webp",
  homeFraseMask: "/img/home/frase-manifiesto.webp",
  homePromesas: "/img/home/cuatro-promesas.webp",
  homeVoces: "/img/home/voces-de-luz.webp",
  homeCierre: "/img/home/cierre.webp",
  portal1: "/img/portal-1.webp",
  portal2: "/img/portal-2.webp",
  portal3: "/img/portal-3.webp",
  about:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCBsQzvne_vdYJfpqGaSuVgIT87dSP0JNQ9ngN3TJAoGD1YsMnHyb7TkONENuBJV3mNcMqWXrIU_QQskTUtFRihvcTLdY3ixjZ24ynYHpvOb3-RfgFUUkSMrBX_zpZUZsVjTcHatxQEEbylnIxpcA3k61c2woLlXP6FWs366mecKHiYU9W_2ltPH_H9DK8ilRyOK2fBUhxjIt8H3-KQAp5vaGHVqcptiqOh5P4EvfOUyUWJd-e1CHmyOb6q-ui7YX5IHe6XCJYZ1DM",
  retreats:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDW62-2hDLCUBdLcig4b6K1ypFW-H5AHbPfjaetfRL5-Pt58ip1_6CY0MYSOfaoYOS695kjNuPWQTJIxSp_Nj3B0T1VplEMeh3HGmcf3_bbX7mI8gPWCLnbvvGIcnf8MNNJWiNfo70kg_bGccYZbu2eQ51YyabLypdCXizVsoEoFgeMfgZ3oI7f7j9LkorHC0xEJFTdl6pVeyTasW75wPRqbOpdjCmp04nMrsT7hozGH7e9npwRLDM956-FC_dDG7bQlhYan4ahWII",
  ceremony:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBMNg2g8foylyracJbch9BUwdLEnDHizrNH5XPVWWqno6PahnFrZfVM0IialxhrHPj_TG5_CY1wOs3VfARr25eEL8bFSTQKEIDYP5PVU_aFf0UczwWchY8_rW4dTGKc8rcv3tWlBr0GO0IwhlYjfvNWPz0Xx03erUvkTLVaPCF98JXNcY3krE_j_UYuzA9Rfstto4nZc3BcqwEUJy9nCw8iGrdTVsIswysCjVgDbPNQOE4ggckC-quBRx4OdPs-dCIHyrygLuys1P8",
  integration:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDc98FhQYeQtedcfgx7BCE56O_Mid14Md1rjfsDYc3d7UBnfpZF32nR6v2cZxOd6fBkIcVbYgD3fTcaDCx-iPsC_JWFSvNz49LUcto6aBcK7Z7xs8I4tSEhtORGFDLB5b9dHONjG9s_pQS7ON4P40iU7ZkRuxJUp6qK9ggTGmmjj8yLJKDJZHZSCFSQK3dnljNTFu9gLnU9x8VKmpQvpIsEL_axtV4CyJgakJpY0Pf5NBBbqSua2V9r3HFIMmm39jldNLSgVU3rSzg",
  research:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCaz4MUG5RskIQRJwut8GQn5W-gkVKBZCIK9fm09Yd8HbhbcPgLcradbquAR9CYWGmbam5N8AatXrfn9dlNJFI5bm6TeWtYWU6WiIf3_L5hzhAH11G2Xt0bn1FyPlb0_JeTe0w38B7gfGBXzVBaWrXe2N9AzSEHap7xOwdKvaVN9IbI41oG2W9vBArGcXnxqiA5_NNVvq6Bk0b_TGh5VRzr2CxQ2rTQBsic7D01wEmWt9oa07jK3-BT0qtrR1jW_JoBjVSsubMnJhE",
  evolution:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuADcsbJJFqVYXAobUkQqMxMyKZh_w54tCiwr06evOpYslL5iJsrurlbuHI4ktwPEpqYbrzzktLb2ZE0czasX_C-iZz5gFWd5EKw82kRGnMHQrFVjSjlsCX6k2dEY8oxgccbDqWXyg9oO1NuIi4nk_Tcjs6rvqaQ9199TLdeN0AExmUblPNJcvMK4OK8nhV_m4YmRiDrkvDMQbHYmrXln7UgP5wbPr6wVAw0Hs4nURKv8NM-QmWPLlzpPr5ZoHoPIbteEiGlmYs3mig",
};

// Todavia no hay imagen por viaje en la tabla `trips`: elegimos un placeholder
// estable a partir del id para que la portada sea la misma en el listado y en
// el detalle del viaje.
const TRIP_PLACEHOLDERS = [IMAGES.retreats, IMAGES.ceremony] as const;

export function tripPlaceholderImage(id: string) {
  const sum = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TRIP_PLACEHOLDERS[sum % TRIP_PLACEHOLDERS.length];
}

// Retiros y ceremonias son ambos `trips`, separados por `trips.type`
// (decision de docs/CONTENT_MAP.md). No son dos rutas: son un filtro de /viajes,
// y el `slug` es el valor que viaja en ?tipo= — en castellano y en plural, que
// es como se ve en el navbar.
export const TRIP_TYPES = [
  {
    value: "retiro",
    slug: "retiros",
    label: "Retiros",
    singular: "Retiro",
    // El titulo va armado y no concatenado con "Proximos": "Proximos Retiros"
    // pero "Proximas Ceremonias", el genero cambia.
    upcoming: "Próximos Retiros",
    description: "Viajes de varios dias en grupo",
  },
  {
    value: "ceremonia",
    slug: "ceremonias",
    label: "Ceremonias",
    singular: "Ceremonia",
    upcoming: "Próximas Ceremonias",
    description: "Encuentros ceremoniales puntuales",
  },
] as const;

export type TripTypeSlug = (typeof TRIP_TYPES)[number]["slug"];

/** Traduce el ?tipo= de la URL al valor del enum. Devuelve null si no matchea. */
export function tripTypeFromSlug(slug: string | undefined) {
  return TRIP_TYPES.find((t) => t.slug === slug) ?? null;
}

export type NavLink = {
  label: string;
  href: string;
  icon: "Info" | "Sparkles" | "BookOpen" | "User";
  children?: { label: string; href: string; description: string }[];
};

// "Inicio" no va en el nav: al home se llega tocando el logo (desktop y drawer)
export const NAV_LINKS: NavLink[] = [
  { label: "Nosotros", href: "/nosotros", icon: "Info" },
  {
    // El mockup del rediseno lo llama "Experiencias", que ademas resuelve el
    // problema de nomenclatura de docs/HOME_REDISENO.md §3.1: para Sofia "Viaje
    // Cosmico" es solo el retiro, y el paraguas se habia quedado sin nombre.
    // Cambia la etiqueta, NO la ruta: /viajes sigue igual y no hace falta
    // redirect ni tocar los links existentes.
    label: "Experiencias",
    href: "/viajes",
    icon: "Sparkles",
    // El desplegable no reemplaza al link: "Viajes" sigue yendo al listado
    // completo, los hijos son atajos al mismo listado ya filtrado.
    // Desde el rediseno de Julia (27/08) /viajes son dos bloques con ancla
    // propia y ya no una grilla filtrada por `?tipo=`, asi que los hijos del
    // desplegable apuntan al ancla de su bloque. Los rotulos siguen siendo
    // Retiros/Ceremonias hasta que se confirme el cambio de nomenclatura.
    children: TRIP_TYPES.map((t) => ({
      label: t.label,
      href: `/viajes#${t.value === "ceremonia" ? "sesiones" : "viajes"}`,
      description: t.description,
    })),
  },
  { label: "Contenidos", href: "/contenidos", icon: "BookOpen" },
  { label: "Mi Cuenta", href: "/cuenta", icon: "User" },
];

// Columnas del footer segun el mockup de Julia. `href: null` = la ruta todavia
// no existe (Blog y Soporte estan diferidos a segunda etapa, ver docs/RECORRIDO.md);
// el Footer las pinta apagadas en vez de generar links muertos.
export const FOOTER_COLUMNS = [
  {
    title: "Explorar",
    links: [
      { label: "Nosotros", href: "/nosotros" },
      { label: "Experiencias", href: "/viajes" },
      { label: "Contenidos", href: "/contenidos" },
    ],
  },
  {
    title: "Legal",
    links: [
      // Privacidad no tiene ruta todavia, pero el texto SI existe: viene en el
      // anexo del boceto de Sofia. Es composicion pura, ver docs/HOME_REDISENO.md §7.
      { label: "Privacidad", href: null },
      { label: "Términos de Servicio", href: null },
      { label: "Contacto", href: "mailto:contacto@cosmiceaglejourney.com" },
      { label: "Soporte", href: null },
    ],
  },
] as const;

// Carrusel "Portales de transformación" de la home. Las imagenes salen de
// site-content (son editables desde /admin/multimedia), aca queda solo el texto
// alternativo de cada una, que describe la composicion y no la foto puntual.
export const PORTAL_ALTS = [
  "Figura humana ascendiendo por un haz de luz cósmica",
  "Silueta envuelta en una nebulosa de partículas doradas",
  "Portal de energía abriéndose sobre un cielo estrellado",
];

/**
 * "Voces de Luz" — los tres testimonios del mockup del rediseno.
 *
 * Reemplazan a los tres anteriores (Valentina/Pablo/Sandra). Pendiente de
 * confirmar que sean publicables con nombre y pais: es la pregunta 5 de
 * docs/HOME_REDISENO.md §9.
 *
 * El texto es literal del mockup, con una sola correccion: decia "evolcando",
 * que no es una palabra. Queda como "evocando".
 */
export const TESTIMONIALS = [
  {
    quote:
      "Todavía me sorprende la experiencia. Fue el viaje más increíble de mi vida. Sigo descubriendo nuevas comprensiones y habilidades que se activaron ese día, además de recibir información valiosa a través de mis sueños y prácticas. Me siento inmensamente agradecida.",
    name: "Valeria",
    location: "Uruguay",
    initial: "V",
  },
  {
    quote:
      "Fue un regalo que cambió mi vida para siempre, evocando una sensación de amor que me acompaña en cada desafío diario. Accedí a un mundo que intuía, abriéndome a una maravillosa realidad oculta.",
    name: "Claudia",
    location: "Chile",
    initial: "C",
  },
  {
    quote:
      "Un viaje interior memorable, donde experimenté directamente un amor profundo e incondicional. Me abrió las puertas a una nueva perspectiva del mundo, a comprender quién soy realmente y el rumbo que quiero darle a mi vida.",
    name: "Andrew",
    location: "Inglaterra",
    initial: "A",
  },
];

/**
 * Copy de la home rediseñada. Es texto de la clienta, transcrito literal del
 * mockup de Julia — no se reescribe sin consultar (esta en tuteo, a diferencia
 * del voseo del resto del sitio, igual que el filtro corto de Sofia).
 *
 * Vive junto en un solo objeto porque es lo que va a entrar como bloque al
 * `es.json` cuando se haga i18n.
 */
export const HOME_COPY = {
  // El corte de la frase manifiesto es una decision de diseno: la primera mitad
  // sube desde abajo y la segunda baja desde arriba (docs/HOME_REDISENO.md §5.2).
  frase: {
    left: "Cuando el alma está lista,",
    right: "el camino aparece.",
  },
  humanidad: {
    titleStrong: "La humanidad",
    titleRest: "está recordando su verdadera naturaleza",
    paragraphs: [
      "Dentro de cada uno de nosotros habita una esencia vasta y divina: una conciencia superior que guía, ilumina y custodia la memoria de quienes realmente somos.",
      "Conectarse con esta inteligencia es recordar nuestro origen: el de seres multidimensionales que han transitado a través de vidas y civilizaciones, llevando consigo sabiduría, conocimiento y un potencial inexplorado.",
    ],
    highlight:
      "Únete a nosotros en un viaje para despertar y encarnar tu máximo potencial. Un espacio de conexión directa con la fuente, con el poder de la luz y con la sabiduría original.",
    action: { label: "Acceso comunidad", href: "/cuenta" },
  },
  promesas: [
    "Despierta nuevas capacidades internas",
    "Expande tu camino personal",
    "Desbloquea tu conexión con lo divino",
    "Contribuye a la evolución colectiva",
  ] as const,
  voces: {
    title: "Voces de Luz",
    label: "Lo que dicen nuestros viajeros",
  },
} as const;

export const EBOOK_FEATURES = [
  {
    title: "Alquimia Emocional",
    description: "Descubre formas de transformar patrones emocionales limitantes.",
    icon: "Zap" as const,
  },
  {
    title: "Conciencia Expandida",
    description: "Comprende estados ampliados de percepción y neuroplasticidad.",
    icon: "Brain" as const,
  },
  {
    title: "Un Mapa de Transformación",
    description: "Un marco suave para navegar el cambio interior profundo.",
    icon: "Map" as const,
  },
];

