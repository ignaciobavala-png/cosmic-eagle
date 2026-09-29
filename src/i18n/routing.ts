import { defineRouting } from "next-intl/routing";

/**
 * El castellano va sin prefijo (`/viajes`) y el inglés con (`/en/viajes`): los
 * links que ya circulan siguen andando. Sin deteccion por `Accept-Language` ni
 * cookie: el idioma lo decide la URL y nada mas (ver docs/I18N.md §2).
 */
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
});
