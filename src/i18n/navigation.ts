import { createElement, type ComponentProps } from "react";
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";
import { localizeHref, type HrefInput } from "./localize-href";

const navigation = createNavigation(routing);

export const { usePathname, useRouter } = navigation;

type NavLinkProps = ComponentProps<typeof navigation.Link>;

/**
 * `Link` de next-intl, pero acepta el href como string con la ruta REAL
 * (`/viajes/abc?x=1#y`), como en todo el codigo. Con `pathnames` next-intl
 * exige el objeto `{ pathname, params }` para las rutas dinamicas; este
 * wrapper lo arma (ver `localizeHref`). Sirve en Server y Client Components.
 */
export function Link({
  href,
  ...props
}: Omit<NavLinkProps, "href"> & { href: HrefInput }) {
  return createElement(navigation.Link, {
    ...props,
    href: localizeHref(href),
  } as NavLinkProps);
}

/** `getPathname` que acepta el href como string (ver `Link`). */
export function getPathname(args: { locale: string; href: HrefInput }): string {
  return navigation.getPathname({
    locale: args.locale,
    href: localizeHref(args.href),
  } as Parameters<typeof navigation.getPathname>[0]);
}

/** `redirect` de next-intl con href como string (lo usa `./redirect.ts`). */
export function redirect(args: { href: HrefInput; locale: string }): never {
  return navigation.redirect({
    href: localizeHref(args.href),
    locale: args.locale,
  } as Parameters<typeof navigation.redirect>[0]);
}
