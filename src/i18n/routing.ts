import { defineRouting } from "next-intl/routing";

/**
 * El castellano va sin prefijo (`/viajes`) y el inglés con (`/en/experiences`):
 * los links que ya circulan siguen andando. Sin deteccion por `Accept-Language`
 * ni cookie: el idioma lo decide la URL y nada mas (ver docs/I18N.md §2).
 *
 * `pathnames`: las claves son las rutas REALES de `src/app/[locale]/` (las que
 * existen en disco y no cambian); el valor dice como se ve cada una en la barra.
 * Un string solo = igual en los dos idiomas. Las URLs en ingles son pedido de
 * la correccion 7.2 (17/11): antes `/en/nosotros`, `/en/viajes`, etc.
 *
 * Al agregar una ruta publica: declararla aca (y su redirect 301 en
 * `next.config.ts` si ya circulaba en `/en`).
 */
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
  pathnames: {
    "/": "/",
    "/nosotros": { es: "/nosotros", en: "/about-us" },
    "/viajes": { es: "/viajes", en: "/experiences" },
    "/viajes/[id]": { es: "/viajes/[id]", en: "/experiences/[id]" },
    "/viajes/[id]/solicitar": {
      es: "/viajes/[id]/solicitar",
      en: "/experiences/[id]/apply",
    },
    "/viajes/[id]/salud": {
      es: "/viajes/[id]/salud",
      en: "/experiences/[id]/health",
    },
    "/viajes/[id]/consentimiento": {
      es: "/viajes/[id]/consentimiento",
      en: "/experiences/[id]/consent",
    },
    "/contenidos": { es: "/contenidos", en: "/content" },
    "/contenidos/[slug]": { es: "/contenidos/[slug]", en: "/content/[slug]" },
    "/faqs": "/faqs",
    "/privacidad": { es: "/privacidad", en: "/privacy" },
    "/terminos": { es: "/terminos", en: "/terms" },
    "/cuenta": { es: "/cuenta", en: "/account" },
    "/cuenta/recuperar": { es: "/cuenta/recuperar", en: "/account/recover" },
    "/cuenta/nueva-clave": {
      es: "/cuenta/nueva-clave",
      en: "/account/new-password",
    },
    "/compartido/[token]": { es: "/compartido/[token]", en: "/shared/[token]" },
    "/material/[token]": "/material/[token]",
  },
});

/** Rutas reales (internas) declaradas arriba. */
export type InternalPathname = keyof typeof routing.pathnames;
