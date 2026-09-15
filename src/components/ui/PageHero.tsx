import { ChevronDown } from "lucide-react";
import { BackgroundMedia } from "./BackgroundMedia";
import { CtaLink } from "./CtaLink";

type Action = { label: string; href: string };

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
  scrollHint,
  scrollTo,
  priority = true,
  height = "banner",
  overlay = true,
  fadeTo,
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
   * el fondo de la pagina). `full` es el del rediseño de Julia: ocupa la
   * pantalla VISIBLE (una pantalla menos el navbar) y corta seco, porque debajo
   * arranca una seccion opaca con su propio fondo y no hay degrade del `body`
   * que dejar ver. Sin `min-h`: un piso en `rem` volveria a empujar el
   * indicador debajo del pliegue en una pantalla baja.
   */
  height?: "banner" | "full";
  /**
   * Color al que se funde el PIE del banner, cuando lo que sigue es una seccion
   * opaca con fondo propio (en la practica, siempre una `CreamSection`: se pasa
   * `CREAM_HEX`).
   *
   * Existe porque el corte hero -> crema era un borde recto de 15,11:1 medido
   * (el maximo posible es 21:1, negro sobre blanco), y a la clienta no le
   * gustan los contrastes marcados. Con esto la foto entra al crema en vez de
   * chocar contra el.
   *
   * **Apaga la mascara del `banner`**, que desvanece el pie a transparente para
   * dejar ver el degrade del `body`: ese fundido es al azul del chrome, y
   * cuando abajo hay una franja opaca ese azul no se ve nunca. Los dos juntos
   * darian dos pasajes encima.
   *
   * Va por `style` y no por clase: Tailwind escanea literales en el codigo
   * fuente, asi que un color interpolado no genera regla.
   */
  fadeTo?: string;
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
          : "relative min-h-[30rem] h-[82svh] max-h-[min(52rem,calc(100svh-var(--navbar-h)))] w-full overflow-hidden md:min-h-[36rem] md:h-[82vh]"
      }
    >
      {/* La foto y sus tintes van juntos dentro de un grupo enmascarado: el borde
          inferior se desvanece a transparente y deja ver el degrade del `body`,
          en vez de cortar contra un negro que no coincide con el azul de la
          pagina. Sin la mascara el limite banner/seccion queda como una linea. */}
      <div
        className={
          full || fadeTo
            ? "absolute inset-0"
            : "absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_0%,#000_48%,rgba(0,0,0,0.55)_76%,rgba(0,0,0,0.18)_92%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_48%,rgba(0,0,0,0.55)_76%,rgba(0,0,0,0.18)_92%,transparent_100%)]"
        }
      >
        <BackgroundMedia src={image} alt={imageAlt} priority={priority} />
        {/* Tinte azul + oscurecido al pie, para asentar el titulo.
            El oscurecido de arriba se saco cuando el navbar paso a ser una
            banda opaca (asset del 20/08): ya no se apoya sobre la imagen, asi
            que esa franja no daba legibilidad a nada y dejaba un corte oscuro
            justo abajo del azul del navbar. */}
        <div className="absolute inset-0 bg-[#05102a]/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#05060a]/45" />
      </div>

      {/* Pasaje al fondo de la seccion siguiente. Las paradas intermedias no
          son decorativas: un degrade lineal de dos paradas sobre una foto
          oscura deja una banda gris a mitad de camino, porque el 50% de opacidad
          cae justo donde mas se nota. Con el arranque suave el crema entra
          recien en el ultimo cuarto.

          **La altura es corta a proposito** (56/80px): el indicador de scroll
          vive a 32px del pie, o sea adentro de esta banda, y con un pasaje mas
          alto quedaria apoyado sobre crema pleno, donde el oro de acento da
          1,7:1. Medido con esta altura sobre /contenidos: el indicador va de
          5,63:1 a 11,30:1 contra el fondo que le toca en cada punto. Si algun
          dia se agranda, hay que volver a mirar ese contraste. */}
      {fadeTo && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-14 md:h-20"
          style={{
            backgroundImage: `linear-gradient(to bottom, transparent 0%, color-mix(in srgb, ${fadeTo} 12%, transparent) 45%, color-mix(in srgb, ${fadeTo} 55%, transparent) 78%, ${fadeTo} 100%)`,
          }}
        />
      )}

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-margin-mobile md:px-margin-desktop text-center">
        {overlay && (
          <>
            {eyebrow && <div className="mb-5">{eyebrow}</div>}
            <h1 className="font-display text-display-mobile md:text-display-lg text-primary text-shadow-glow max-w-3xl text-balance">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-5 max-w-xl text-body-md md:text-body-lg text-primary-fixed-dim">
                {subtitle}
              </p>
            )}
            {actions.length > 0 && (
              <div className="mt-8 flex w-full max-w-sm flex-col items-stretch gap-3 sm:mt-9 sm:w-auto sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
                {actions.map((action) => (
                  <CtaLink
                    key={action.href + action.label}
                    href={action.href}
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
