"use client";

import { useMemo, useRef, useState, type MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { ArticleBody } from "./ArticleBody";
import { ArticleAudio } from "./ArticleAudio";
import { CtaLink } from "./CtaLink";
import { TitleRule } from "./TitleRule";
import { formatArticleDate, type ArticleBlock } from "@/lib/article";
import type { FormatLocale } from "@/lib/format";

/**
 * La biblioteca de /contenidos como experiencia de un solo espacio.
 *
 * **Se entra por un índice** (pedido de la organización, 08/10): cinco
 * tarjetas con foto, una por tema, en lugar de la fila de píldoras que había
 * desde el 23/09. Al tocar una se entra al tema —su título, sus textos y
 * "← Todos los temas"—; al abrir un texto, su título y el inicio del contenido
 * van dentro de **un recuadro de lectura acotado con scroll propio** (nunca el
 * artículo entero como página gigante), y debajo aparecen "otros contenidos
 * disponibles" (`docs/entregas/2026-09-23-feedback-org/CEJ_Correcciones_Contenidos.docx`).
 *
 * **El tema vive en la URL (`?categoria=`), no en un estado**: elegir uno hace
 * `pushState` y `useSearchParams` lo devuelve (Next integra la History API
 * nativa con su router). Así el "atrás" del celular vuelve al índice en vez de
 * sacar de la página, refrescar o compartir el link cae en el mismo tema, y
 * los links del navbar a cada tema siguen funcionando. Nada de eso pide al
 * servidor: la lista filtra en memoria sobre los artículos que ya trajo el
 * Server Component.
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
  /** El audio, si tiene. Sólo llega cuando el cuerpo se pudo leer. */
  audio_url: string | null;
};

export type LibraryCategory = {
  value: string;
  label: string;
  /** La foto de su tarjeta en el índice (slot `contenidos.tema.<value>.image`). */
  image: string;
};

/** Click simple, sin modificadores: lo único que se intercepta. Ctrl/cmd/shift/click medio abren en pestaña nueva y eso es del browser (mismo criterio que `ExperienceGate`). */
function isPlainClick(event: MouseEvent<HTMLAnchorElement>) {
  return !(
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export function ContentLibrary({
  categories,
  articles,
}: {
  categories: LibraryCategory[];
  articles: LibraryArticle[];
}) {
  const t = useTranslations("Contenidos");
  const tCat = useTranslations("ArticleCategories");
  const locale = (useLocale() === "en" ? "en" : "es") as FormatLocale;
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement>(null);

  // Un `?categoria=` desconocido cae en el índice, no en un tema vacío.
  const requested = searchParams.get("categoria");
  const activeCategory =
    categories.find((c) => c.value === requested) ?? null;
  const active = activeCategory?.value ?? null;

  // El texto abierto recuerda en qué tema se abrió: al cambiar de tema (o
  // volver al índice, también con el "atrás" del browser) el lector se
  // cierra solo, sin un efecto que lo resetee.
  const [opened, setOpened] = useState<{ slug: string; topic: string } | null>(
    null
  );
  const openSlug = opened && opened.topic === active ? opened.slug : null;

  const withContent = useMemo(
    () => new Set(articles.map((article) => article.category)),
    [articles]
  );

  const inCategory = useMemo(
    () => articles.filter((article) => article.category === active),
    [articles, active]
  );

  const openArticle = openSlug
    ? articles.find((article) => article.slug === openSlug) ?? null
    : null;

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

  /** Va al tema (o al índice con `null`) dejando una entrada en el historial. */
  function goTo(value: string | null) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("categoria", value);
    else url.searchParams.delete("categoria");
    window.history.pushState(null, "", url.toString());
    // La vista nueva arranca donde arrancaba la anterior: sin esto, quien
    // toca una tarjeta de abajo cae en la mitad de la lista del tema.
    requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function openText(slug: string) {
    if (!active) return;
    setOpened({ slug, topic: active });
    // El recuadro aparece debajo de la grilla; sin esto la persona que toca una
    // tarjeta del final no lo vería.
    requestAnimationFrame(() => {
      document
        .getElementById("lector")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div
      ref={rootRef}
      className="scroll-mt-[calc(var(--navbar-h)+2rem)]"
    >
      {!activeCategory ? (
        <nav aria-label={t("library.ariaNav")}>
          {/* El índice. En mobile dos columnas con la quinta centrada; en
              escritorio, los cinco en una fila. La tarjeta tiene la misma
              proporción en todas las pantallas: la foto la elige la clienta y
              un recorte que cambia según el ancho deja al sujeto cortado en
              una pantalla sí y en otra no. */}
          <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
            {categories.map((category, index) => (
              <li
                key={category.value}
                className={
                  index === categories.length - 1 && categories.length % 2 === 1
                    ? "col-span-2 mx-auto w-[calc(50%-0.5rem)] sm:w-[calc(50%-0.75rem)] lg:col-span-1 lg:w-full"
                    : undefined
                }
              >
                <TopicCard
                  category={category}
                  empty={!withContent.has(category.value)}
                  onChoose={goTo}
                />
              </li>
            ))}
          </ul>
        </nav>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => goTo(null)}
            className="inline-flex items-center gap-2 text-label-sm uppercase text-[#05125a] transition-colors hover:text-on-primary-container"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            {t("library.allTopics")}
          </button>

          {/* El título del tema, como todos los títulos del sitio: centrado,
              en text-h2 y con el filete del color del texto (regla de Sofía,
              06/10). Sobre el dorado, azul. */}
          <div className="mx-auto mt-6 w-fit max-w-3xl text-center">
            <h2 className="font-display text-h2 text-[#05125a] text-balance">
              {activeCategory.label}
            </h2>
            <TitleRule tone="blue" align="center" className="mt-3" />
          </div>

          <div className="mt-10">
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
        </div>
      )}

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
                onClick={() => setOpened(null)}
                className="inline-flex shrink-0 items-center gap-2 text-label-sm uppercase text-on-primary-container transition-colors hover:text-[#05125a]"
              >
                <ArrowLeft size={15} aria-hidden="true" />
                {t("library.back")}
              </button>
            </div>

            {/* El audio va afuera del recuadro con scroll, para que no se
                vaya de la vista apenas se empieza a leer. */}
            {openArticle.blocks && openArticle.audio_url && (
              <ArticleAudio
                src={openArticle.audio_url}
                label={t("library.listen")}
                className="mt-6"
              />
            )}

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
 * Una tarjeta del índice de temas: la foto a sangre, y abajo el nombre del
 * tema con su filete. Sin la cantidad de contenidos: nadie la pidió (08/10).
 * El velo azul de abajo es
 * para que el texto se lea sobre cualquier foto que suba la clienta; no es un
 * corte entre secciones.
 *
 * Es un `<a>` de verdad a `?categoria=` (se indexa, abre en pestaña nueva) y el
 * click simple se intercepta para entrar sin pedirle nada al servidor. **Un
 * tema sin contenidos dice "Próximamente" y no se puede tocar**: entrar para
 * leer "todavía no hay contenidos" se lee como un error (es lo que le pasó a
 * Sofía el 07/10 con dos temas vacíos).
 */
function TopicCard({
  category,
  empty,
  onChoose,
}: {
  category: LibraryCategory;
  empty: boolean;
  onChoose: (value: string) => void;
}) {
  const t = useTranslations("Contenidos");

  const content = (
    <>
      <Image
        src={category.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 20vw, 50vw"
        className={`object-cover transition-transform duration-1000 ${
          empty ? "opacity-60" : "group-hover:scale-105"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#05125a]/95 via-[#05125a]/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-3 pb-4 text-center sm:px-4 sm:pb-6">
        <div className="w-fit max-w-full">
          <h3 className="font-display text-[19px] leading-[1.2] text-primary-container text-balance sm:text-headline-md">
            {category.label}
          </h3>
          <TitleRule tone="gold" align="center" className="mt-2" />
        </div>
        {empty && (
          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-primary sm:text-label-sm">
            {t("library.soon")}
          </p>
        )}
      </div>
    </>
  );

  const frame =
    "relative block aspect-[4/5] overflow-hidden rounded-2xl border border-[#f9d78f]/70 bg-[#05125a] shadow-[0_18px_50px_-24px_rgba(5,18,90,0.6)]";

  if (empty) {
    return (
      <div aria-disabled="true" className={frame}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/contenidos?categoria=${category.value}`}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (!isPlainClick(event)) return;
        event.preventDefault();
        onChoose(category.value);
      }}
      className={`group ${frame} transition-[border-color,box-shadow] duration-300 hover:border-[#f9d78f] hover:shadow-[0_22px_60px_-22px_rgba(5,18,90,0.75)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#05125a]`}
    >
      {content}
    </Link>
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
        if (!isPlainClick(event)) return;
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
