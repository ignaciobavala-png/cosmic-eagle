"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { ArticleBody } from "./ArticleBody";
import { CtaLink } from "./CtaLink";
import { CategoryMenu } from "./CategoryMenu";
import { formatArticleDate, type ArticleBlock } from "@/lib/article";
import type { FormatLocale } from "@/lib/format";

/**
 * La biblioteca de /contenidos como experiencia de un solo espacio.
 *
 * Pedido de la organización (23/09,
 * `docs/entregas/2026-09-23-feedback-org/CEJ_Correcciones_Contenidos.docx`):
 * los cinco temas funcionan como menú principal **fijo/sticky**; al elegir un
 * tema se muestran directamente sus textos; al abrir uno, su título y el inicio
 * del contenido van dentro de **un recuadro de lectura acotado con scroll
 * propio** (nunca el artículo entero como página gigante), y debajo aparecen
 * "otros contenidos disponibles". La navegación de los temas queda a la vista
 * todo el tiempo para no sentir que se salió de la biblioteca.
 *
 * **Es un client component y el estado (tema + texto abierto) vive acá**: no hay
 * navegación entre rutas al cambiar de tema o al abrir un texto, que es lo que
 * rompería la sensación de biblioteca. La lista no se vuelve a pedir: filtra en
 * memoria sobre los artículos que ya trajo el Server Component.
 *
 * **El cuerpo de un texto cerrado nunca llega hasta acá.** El servidor solo
 * manda `blocks` de lo que la RLS dejó leer; lo cerrado viaja con `blocks: null`
 * y su tarjeta es un link a `/contenidos/<slug>`, que es donde vive el muro y el
 * canje del código. Así el gate de niveles no se debilita por mostrar el listado
 * completo en una sola página.
 */

export type LibraryArticle = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  category: string;
  published_at: string | null;
  /** El nivel del texto supera al de quien mira: se muestra con candado. */
  locked: boolean;
  /** `null` cuando está cerrado o no se pudo leer el cuerpo. */
  blocks: ArticleBlock[] | null;
};

export type LibraryCategory = { value: string; label: string };

export function ContentLibrary({
  categories,
  articles,
  initialCategory,
}: {
  categories: LibraryCategory[];
  articles: LibraryArticle[];
  /** Viene de `?categoria=` para que los links del navbar caigan en el tema. */
  initialCategory: string | null;
}) {
  const t = useTranslations("Contenidos");
  const tCat = useTranslations("ArticleCategories");
  const locale = (useLocale() === "en" ? "en" : "es") as FormatLocale;
  const firstCategory = categories[0]?.value ?? "";
  const [active, setActive] = useState(
    initialCategory && categories.some((c) => c.value === initialCategory)
      ? initialCategory
      : firstCategory
  );
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const inCategory = useMemo(
    () => articles.filter((article) => article.category === active),
    [articles, active]
  );

  const openArticle = openSlug
    ? articles.find((article) => article.slug === openSlug) ?? null
    : null;

  const activeLabel =
    categories.find((c) => c.value === active)?.label ?? t("library.fallback");

  /**
   * "Otros contenidos": primero los del mismo tema, y si no alcanzan se
   * completan con recomendados de otros temas. El documento §6 admite las dos
   * cosas ("relacionados con el mismo tema" u "otros recomendados").
   */
  const others = useMemo(() => {
    if (!openArticle) return [];
    const same = articles.filter(
      (a) => a.category === openArticle.category && a.slug !== openArticle.slug
    );
    if (same.length >= 3) return same.slice(0, 6);
    const rest = articles.filter(
      (a) => a.category !== openArticle.category && a.slug !== openArticle.slug
    );
    return [...same, ...rest].slice(0, 6);
  }, [articles, openArticle]);

  function chooseCategory(value: string) {
    setActive(value);
    setOpenSlug(null);
    // El tema queda en la URL sin navegar: refrescar o compartir el link cae en
    // el mismo tema, y el `?categoria=` del navbar sigue funcionando.
    const url = new URL(window.location.href);
    url.searchParams.set("categoria", value);
    window.history.replaceState(null, "", url.toString());
  }

  function openText(slug: string) {
    setOpenSlug(slug);
    // El recuadro aparece debajo de la grilla; sin esto la persona que toca una
    // tarjeta del final no lo vería.
    requestAnimationFrame(() => {
      document
        .getElementById("lector")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div>
      {/* Menú fijo de los cinco temas. Es una barra de crema flotante
          (`sticky`) debajo del navbar, no una franja a sangre: dentro de la
          columna `max-w-narrative` un fondo de ancho completo no cubriría el
          ancho real de la sección y dejaría costura contra el degradé dorado.
          El envoltorio de la sección NO puede tener `overflow-hidden` o el
          sticky no se pega. */}
      <nav
        aria-label={t("library.ariaNav")}
        className="sticky top-[var(--navbar-h)] z-30 mx-auto w-full max-w-3xl py-3 md:rounded-2xl md:border md:border-[#b3964b]/40 md:bg-[#fff6eb]/95 md:px-4 md:shadow-[0_10px_30px_-16px_rgba(5,18,90,0.55)] md:backdrop-blur-sm"
      >
        <CategoryMenu
          items={categories}
          active={active}
          onChoose={chooseCategory}
        />
      </nav>

      <div className="mt-10">
        {/* El tema activo ya no se repite como título visible ni como
            etiqueta en cada tarjeta (correcciones del 03/10, §4.1: la misma
            palabra salía tres veces en una pantalla). El menú ya lo dice; el
            encabezado queda para los lectores de pantalla. */}
        <h2 className="sr-only">{activeLabel}</h2>

        {inCategory.length === 0 ? (
          <p className="mx-auto max-w-md text-center text-body-md text-[#05125a]">
            {t("library.empty")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {inCategory.map((article) => (
              <LibraryCard
                key={article.slug}
                article={article}
                onOpen={openText}
              />
            ))}
          </div>
        )}
      </div>

      {openArticle && (
        <section
          id="lector"
          aria-label={t("library.readerAria")}
          className="mt-16 scroll-mt-[calc(var(--navbar-h)+5rem)]"
        >
          <div className="mx-auto max-w-3xl rounded-2xl border border-[#b3964b]/50 bg-[#fff6eb] p-5 shadow-[0_18px_50px_-24px_rgba(5,18,90,0.45)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="rounded-full border border-on-primary-container/40 px-3 py-1 text-label-sm uppercase text-on-primary-container">
                  {tCat(openArticle.category)}
                </span>
                <h3 className="mt-4 font-display text-headline-md font-bold text-[#05125a] text-balance">
                  {openArticle.title}
                </h3>
                {formatArticleDate(openArticle.published_at) && (
                  <p className="mt-2 text-label-sm uppercase text-on-primary-container">
                    {formatArticleDate(openArticle.published_at, locale)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpenSlug(null)}
                className="inline-flex shrink-0 items-center gap-2 text-label-sm uppercase text-on-primary-container transition-colors hover:text-[#05125a]"
              >
                <ArrowLeft size={15} aria-hidden="true" />
                {t("library.back")}
              </button>
            </div>

            {/* El recuadro de lectura: alto acotado y scroll PROPIO, que es lo
                que evita la "página gigante". El resto de la biblioteca no se
                mueve mientras se lee. */}
            <div className="mt-6 max-h-[65vh] overflow-y-auto overscroll-contain rounded-xl border border-[#f9d78f] bg-white/70 p-5 sm:p-7">
              {openArticle.blocks ? (
                <ArticleBody blocks={openArticle.blocks} tone="light" />
              ) : (
                <div className="py-6 text-center">
                  <Lock
                    size={22}
                    aria-hidden="true"
                    className="mx-auto text-on-primary-container"
                  />
                  <p className="mx-auto mt-4 max-w-md text-body-md text-[#05125a]">
                    {t("library.locked")}
                  </p>
                  <div className="mt-6 flex justify-center">
                    <CtaLink
                      href={`/contenidos/${openArticle.slug}`}
                      tone="dark"
                    >
                      {t("library.viewAccess")}
                    </CtaLink>
                  </div>
                </div>
              )}
            </div>
          </div>

          {others.length > 0 && (
            <div className="mx-auto mt-12 max-w-3xl">
              <h4 className="text-label-sm uppercase text-[#05125a]/70">
                {t("library.others")}
              </h4>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {others.map((other) => (
                  <li key={other.slug}>
                    <RelatedCard article={other} onOpen={openText} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/**
 * Tarjeta de la grilla. Es un `<a>` de verdad —se indexa y abre en pestaña
 * nueva— y sólo se intercepta el click cuando el texto es legible, para
 * abrirlo dentro de la biblioteca. Un texto cerrado navega a su ficha, donde
 * vive el muro y el canje del código.
 */
function LibraryCard({
  article,
  onOpen,
}: {
  article: LibraryArticle;
  onOpen: (slug: string) => void;
}) {
  const t = useTranslations("Contenidos");
  const locale = (useLocale() === "en" ? "en" : "es") as FormatLocale;
  return (
    <Link
      href={`/contenidos/${article.slug}`}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        // Ctrl/cmd/shift/click medio abren en pestaña nueva: eso es del
        // browser y no se intercepta (mismo criterio que `ExperienceGate`).
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        if (article.locked || !article.blocks) return;
        event.preventDefault();
        onOpen(article.slug);
      }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#f9d78f] bg-[#fff6eb] transition-colors duration-300 hover:border-on-primary-container/50"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#05125a]">
        {article.cover_url ? (
          <Image
            src={article.cover_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a2a52] to-[#05060a]" />
        )}
        <div className="absolute inset-0 bg-[#05102a]/20" />
        {article.locked && (
          <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-[#05125a]/85 px-3 py-1 text-label-sm uppercase text-[#f9d78f]">
            <Lock size={12} aria-hidden="true" />
            {t("library.program")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-headline-md font-bold text-[#05125a]">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="mt-3 line-clamp-4 text-body-md text-[#05125a]">
            {article.excerpt}
          </p>
        )}
        <div className="mt-auto border-t border-[#f9d78f]/70 pt-4">
          <span className="block text-label-sm uppercase text-on-primary-container">
            {article.locked ? t("library.statusLocked") : t("library.statusPublished")}
          </span>
          <span className="mt-1 block text-body-md text-[#05125a]">
            {article.locked
              ? t("library.requiresAccess")
              : (formatArticleDate(article.published_at, locale) ?? "—")}
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Tarjeta simple de "otros contenidos": sólo título y categoría (§6). */
function RelatedCard({
  article,
  onOpen,
}: {
  article: LibraryArticle;
  onOpen: (slug: string) => void;
}) {
  const tCat = useTranslations("ArticleCategories");
  const className =
    "flex h-full items-center justify-between gap-4 rounded-xl border border-[#f9d78f] bg-[#fff6eb] px-4 py-3 text-left transition-colors hover:border-on-primary-container/50";

  const content = (
    <>
      <span className="min-w-0">
        <span className="block text-[11px] uppercase tracking-[0.12em] text-on-primary-container">
          {tCat(article.category)}
        </span>
        <span className="mt-0.5 block truncate font-display text-body-lg text-[#05125a]">
          {article.title}
        </span>
      </span>
      {article.locked && (
        <Lock
          size={14}
          aria-hidden="true"
          className="shrink-0 text-on-primary-container"
        />
      )}
    </>
  );

  if (article.locked || !article.blocks) {
    return (
      <Link href={`/contenidos/${article.slug}`} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(article.slug)}
      className={className}
    >
      {content}
    </button>
  );
}
