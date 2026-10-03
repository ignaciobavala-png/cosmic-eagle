import { getTranslations } from "next-intl/server";
import { ARTICLE_CATEGORY_LIST } from "@/lib/article";
import { CategoryMenu } from "./CategoryMenu";

/**
 * Menú de los cinco temas de la biblioteca, como links.
 *
 * Es la versión de la ficha de un contenido: la persona llegó de un link
 * directo (la tarjeta, el buscador, el panel) y este menú le deja volver al
 * listado del tema o saltar a otro sin pasar por el inicio. La biblioteca de
 * `/contenidos` no usa este componente: ahí el menú es de estado (no navega) y
 * vive dentro de `ContentLibrary`.
 *
 * Va como barra de crema flotante (`sticky`) debajo del navbar, igual que el
 * menú de `/contenidos`, para que las dos pantallas se lean como la misma
 * biblioteca. El ancestro no puede tener `overflow-hidden`. En mobile es un
 * desplegable (ver `CategoryMenu`).
 */
export async function LibraryNav({ active }: { active: string }) {
  const t = await getTranslations("Contenidos");
  const tCat = await getTranslations("ArticleCategories");

  return (
    <nav
      aria-label={t("library.ariaNav")}
      className="sticky top-[var(--navbar-h)] z-30 mx-auto w-full max-w-3xl rounded-2xl border border-[#b3964b]/40 bg-[#fff6eb]/95 px-3 py-3 shadow-[0_10px_30px_-16px_rgba(5,18,90,0.55)] backdrop-blur-sm sm:px-4"
    >
      <CategoryMenu
        active={active}
        items={ARTICLE_CATEGORY_LIST.map((category) => ({
          value: category.value,
          label: tCat(category.value),
          href: `/contenidos?categoria=${category.value}`,
        }))}
      />
    </nav>
  );
}
