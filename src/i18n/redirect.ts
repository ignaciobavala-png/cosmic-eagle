import { getLocale } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { redirect as i18nRedirect } from "./navigation";

/**
 * `redirect` que conserva el idioma: reemplazo del de `next/navigation` en las
 * rutas publicas. Recibe la ruta **sin** prefijo (`/cuenta`) igual que antes;
 * el locale lo resuelve `getLocale()` (el header que deja el proxy de
 * next-intl).
 *
 * Es `async` a proposito: el `redirect` de next-intl necesita el locale en el
 * argumento y `getLocale()` solo existe en version asincronica. Por eso **hay
 * que esperarlo** (`await redirect(...)`): si se lo llama sin `await`, el throw
 * con el que Next corta la navegacion queda adentro de una promesa rechazada
 * que nadie mira y el action sigue de largo — el redirect no pasa y encima
 * TypeScript pierde el `never`, asi que los handlers empiezan a pedir un
 * `return` que antes no hacian falta.
 *
 * Las rutas que NO viven bajo `[locale]` —el panel y `auth/`— no llevan idioma:
 * prefijarlas daria `/en/admin`, que no existe. Por eso van derecho al
 * `redirect` de Next.
 */
export async function redirect(href: string): Promise<never> {
  if (href.startsWith("/admin") || href.startsWith("/auth")) {
    nextRedirect(href);
  }
  return i18nRedirect({ href, locale: await getLocale() });
}
