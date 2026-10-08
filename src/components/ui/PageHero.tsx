import { ChevronDown } from "lucide-react";
import { BackgroundMedia } from "./BackgroundMedia";
import { CtaLink, type CtaTone } from "./CtaLink";
import { TitleRule } from "./TitleRule";

type Action = { label: string; href: string; tone?: CtaTone };

/**
 * P1 — Hero de pagina. Banner full-bleed, titulo serif centrado, subtitulo,
 * hasta dos CTAs y un indicador de scroll con ancla a la primera seccion.
 * Se repite igual en home, nosotros y viajes.
 */
export function PageHero({
  image,
  imageAlt = "",
  eyebrow,
  title,
  subtitle,
  actions = [],
  subtitleStyle = "body",
  scrollHint,
  scrollTo,
  priority = true,
  height = "banner",
  overlay = true,
  titleClassName = "text-primary",
  titleRule,
  raised = false,
}: {
  image: string;
  imageAlt?: string;
  /**
   * Fila de etiquetas arriba del titulo. La usa el detalle de una experiencia
   * para el tipo y el estado del cupo; el resto de los heros no la pasa.
   */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  /**
   * `display` pone la bajada en la misma letra y el mismo cuerpo que el
   * titulo. La usa el detalle de una experiencia para el lugar (pedido de la
   * organizacion, 08/10: "Tulum, Mexico igual que el titulo, en letra
   * grande"). Por prop y no por `className`, por la trampa de siempre.
   */
  subtitleStyle?: "body" | "display";
  actions?: Action[];
  scrollHint?: string;
  scrollTo?: string;
  priority?: boolean;
  /**
   * false deja el banner solo con la imagen: no se ven ni el titulo ni la
   * bajada. Es el tilde "Mostrar el título sobre la portada" del panel de
   * multimedia (`*.hero.overlay`). El hint de scroll se mantiene: es un
   * indicador de navegacion, no texto sobre la imagen.
   */
  overlay?: boolean;
  /**
   * `banner` es el hero historico (82% del alto, con el pie desvanecido sobre
   * el fondo de la pagina). `compact` es el mismo banner a poco menos de media
   * pantalla: lo usaba /calendario (que se saco el 08/10) y hoy no lo usa
   * nadie. `full` es el del rediseño de Julia: ocupa la
   * pantalla VISIBLE (una pantalla menos el navbar) y corta seco, porque debajo
   * arranca una seccion opaca con su propio fondo y no hay degrade del `body`
   * que dejar ver. Sin `min-h`: un piso en `rem` volveria a empujar el
   * indicador debajo del pliegue en una pantalla baja.
   */
  height?: "banner" | "compact" | "full";
  /**
   * Color del titulo. Por defecto el blanco calido; /contenidos lo pide en oro
   * (`text-primary-fixed-dim`, el oro de acento para headings sobre oscuro).
   * Va por prop y no por `className`: dos utilidades de color compiten y gana
   * el orden de la hoja, no el de las clases.
   */
  titleClassName?: string;
  /**
   * El filete bajo el titulo, como el de los titulos de seccion. Se pasa el
   * tono del color del titulo (regla de Sofia del 06/10). Lo pidio la
   * organizacion para /contenidos el 08/10.
   */
  titleRule?: "gold" | "goldDark" | "goldDeep" | "blue";
  /**
   * Sube el bloque de texto por encima del centro geometrico. Con un parrafo
   * largo, centrado exacto queda bajo a la vista y casi tocando el indicador
   * de scroll del pie (pedido de la organizacion para /contenidos, 08/10).
   */
  raised?: boolean;
}) {
  const full = height === "full";
  return (
    // `svh` en mobile a proposito: con `vh` la barra del browser queda fuera de
    // la cuenta y el hint de scroll cae debajo del pliegue visible.
    //
    // Y se le RESTA el alto del navbar. La banda es opaca y fija, y todos los
    // `main` la esquivan con `pt-[var(--navbar-h)]`, asi que una seccion de `100svh`
    // adentro de ese `main` mide una pantalla ENTERA empezando debajo del
    // navbar: termina 84px mas abajo del pliegue y se lleva puesto el indicador
    // de scroll, que va anclado al pie. Es el primer reclamo de la entrega de
    // Julia del 1/9 ("el banner hero era mas grande que la screen y el
    // indicador con el texto 'descubrir' quedaba no visible").
    //
    // El `banner` no se pasa de alto, pero en una pantalla ancha y baja su tope
    // en `rem` si podia comerse el indicador: por eso el `max-h` tambien se
    // mide contra el pliegue.
    <section
      className={
        full
          ? "relative h-[calc(100svh-var(--navbar-h))] w-full overflow-hidden"
          : height === "compact"
            ? // El piso en `rem` no es simetrico con el de `banner` por la misma
              // razon que alla: el indicador de scroll vive a 32px del pie y el
              // titulo ocupa el centro, asi que por debajo de ~19rem se pisan.
              // El tope se mide contra el pliegue, no en `rem`, o en una
              // pantalla baja el hero "corto" vuelve a tapar el carrusel.
              "relative min-h-[19rem] h-[46svh] max-h-[min(26rem,calc(100svh-var(--navbar-h)))] w-full overflow-hidden md:min-h-[21rem] md:h-[46vh]"
            : "relative min-h-[30rem] h-[82svh] max-h-[min(52rem,calc(100svh-var(--navbar-h)))] w-full overflow-hidden md:min-h-[36rem] md:h-[82vh]"
      }
    >
      {/* **El hero corta RECTO contra la sección de abajo, siempre.** Regla de
          la organización (08/10): entre una sección y otra va una línea
          divisoria, nunca un degradé. Se fueron la máscara que desvanecía el
          pie a transparente y el pasaje a crema (`fadeTo`), y con ellos la
          prop `hardEdge`, que era la excepción y ahora es la regla. */}
      <div className="absolute inset-0">
        <BackgroundMedia src={image} alt={imageAlt} priority={priority} />
        {/* Tinte azul + oscurecido al pie, para asentar el titulo.
            El oscurecido de arriba se saco cuando el navbar paso a ser una
            banda opaca (asset del 20/08): ya no se apoya sobre la imagen, asi
            que esa franja no daba legibilidad a nada y dejaba un corte oscuro
            justo abajo del azul del navbar. */}
        <div className="absolute inset-0 bg-[#05102a]/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#05060a]/45" />
      </div>

      <div className={`relative z-10 flex h-full flex-col items-center justify-center px-margin-mobile md:px-margin-desktop text-center ${raised ? "pb-24 md:pb-28" : ""}`}>
        {overlay && (
          <>
            {eyebrow && <div className="mb-5">{eyebrow}</div>}
            {/* Con filete, el `h1` va envuelto en un `w-fit`: el filete es
                `w-full` y mide lo que mide el titulo. */}
            {titleRule ? (
              <div className="w-fit max-w-3xl">
                <h1 className={`font-display text-display-mobile md:text-display-lg ${titleClassName} text-shadow-glow text-balance`}>
                  {title}
                </h1>
                <TitleRule tone={titleRule} align="center" className="mt-3" />
              </div>
            ) : (
              <h1 className={`font-display text-display-mobile md:text-display-lg ${titleClassName} text-shadow-glow max-w-3xl text-balance`}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                className={
                  subtitleStyle === "display"
                    ? `mt-2 max-w-3xl font-display text-display-mobile md:text-display-lg ${titleClassName} text-shadow-glow text-balance`
                    : "mt-5 max-w-xl text-body-md md:text-body-lg text-primary-fixed-dim"
                }
              >
                {subtitle}
              </p>
            )}
            {actions.length > 0 && (
              // Los botones van a su ancho, también en mobile. Antes se estiraban
              // a una barra de lado a lado, que no es el botón del sistema
              // (pedido de la organización, 08/10).
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-9 sm:gap-4">
                {actions.map((action) => (
                  <CtaLink
                    key={action.href + action.label}
                    href={action.href}
                    tone={action.tone}
                  >
                    {action.label}
                  </CtaLink>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {scrollHint && scrollTo && (
        <a
          href={`#${scrollTo}`}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-1 text-primary-fixed-dim/80 hover:text-primary-fixed-dim transition-colors"
        >
          <span className="text-label-sm uppercase">{scrollHint}</span>
          <ChevronDown size={18} className="animate-float" />
        </a>
      )}
    </section>
  );
}

/**
 * Cada salto de linea del texto cargado es un quiebre de titulo en desktop. En
 * mobile se ignora y deja que el titulo fluya, que es como venia antes de que el
 * copy fuera editable.
 *
 * Vivia en `HeroSection`, que se borro con el rediseno de la home; el helper es
 * de P1, no de aquella seccion.
 */
export function renderTitle(title: string) {
  const lines = title.split("\n");

  return lines.map((line, i) => (
    <span key={i}>
      {i > 0 && <br className="hidden md:block" />}
      {i > 0 ? ` ${line}` : line}
    </span>
  ));
}
