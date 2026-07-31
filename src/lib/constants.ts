export const IMAGES = {
  // Logo oficial de la disenadora (PNG con alpha, 1207x433), servido desde /public
  logo: "/logo.png",
  // Assets de Julia, convertidos a WebP y servidos desde /public/img
  // (fuente original en ~/Descargas/frontend_eagle, ver docs/DESIGN_ASSETS.md)
  heroNosotros: "/img/hero-nosotros.webp",
  nosotrosProposito: "/img/nosotros-proposito.webp",
  nosotrosMetodologia: "/img/nosotros-metodologia.webp",
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

// "Inicio" no va en el nav: al home se llega tocando el logo (desktop y drawer)
export const NAV_LINKS = [
  { label: "Nosotros", href: "/nosotros", icon: "Info" as const },
  { label: "Viajes", href: "/viajes", icon: "Sparkles" as const },
  { label: "Contenidos", href: "/contenidos", icon: "BookOpen" as const },
  { label: "Mi Cuenta", href: "/cuenta", icon: "User" as const },
];

// Columnas del footer segun el mockup de Julia. `href: null` = la ruta todavia
// no existe (Blog y Soporte estan diferidos a segunda etapa, ver docs/RECORRIDO.md);
// el Footer las pinta apagadas en vez de generar links muertos.
export const FOOTER_COLUMNS = [
  {
    title: "Explorar",
    links: [
      { label: "Retiros", href: "/viajes" },
      { label: "E-book", href: null },
      { label: "Blog", href: null },
      { label: "Nosotros", href: "/nosotros" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidad", href: null },
      { label: "Términos de Servicio", href: null },
      { label: "Contacto", href: "mailto:contacto@cosmiceaglejourney.com" },
      { label: "Soporte", href: null },
    ],
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Recuperé la conexión con mi esencia y mi ser superior. El viaje marcó un punto de inflexión en mi vida.",
    name: "Valentina",
    location: "Chile",
    initial: "V",
  },
  {
    quote:
      "Fue un viaje muy profundo, luminoso y brillante. Me sentí bienvenido por una comunidad cósmica.",
    name: "Pablo",
    location: "Francia",
    initial: "P",
  },
  {
    quote:
      "Me he sentido más ligera, libre y muy empoderada. Fue una experiencia realmente hermosa.",
    name: "Sandra",
    location: "USA",
    initial: "S",
  },
];

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

export const CONTENT_CARDS = [
  {
    title: "Procesos de Integración",
    description:
      "Introducción a estados ampliados de conciencia y viajes cósmicos. Herramientas para aterrizar la experiencia.",
    image: "integration" as keyof typeof IMAGES,
    accent: "primary" as const,
    offset: false,
  },
  {
    title: "Investigación",
    description:
      "Herramientas y profundización en la tecnología de la conciencia humana. Avances científicos y espirituales.",
    image: "research" as keyof typeof IMAGES,
    accent: "secondary" as const,
    offset: true,
  },
  {
    title: "Evolución del Conocimiento",
    description:
      "Un paso más allá de lo básico, la arquitectura energética del ser humano y su proceso evolutivo.",
    image: "evolution" as keyof typeof IMAGES,
    accent: "primary" as const,
    offset: false,
  },
];
