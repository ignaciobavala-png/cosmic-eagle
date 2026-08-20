import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { CtaLink } from "./CtaLink";

type Action = { label: string; href: string; variant?: "solid" | "ghost" };

/**
 * P1 — Hero de pagina. Banner full-bleed, titulo serif centrado, subtitulo,
 * hasta dos CTAs y un indicador de scroll con ancla a la primera seccion.
 * Se repite igual en home, nosotros y viajes.
 */
export function PageHero({
  image,
  imageAlt = "",
  title,
  subtitle,
  actions = [],
  scrollHint,
  scrollTo,
  priority = true,
}: {
  image: string;
  imageAlt?: string;
  title: React.ReactNode;
  subtitle?: string;
  actions?: Action[];
  scrollHint?: string;
  scrollTo?: string;
  priority?: boolean;
}) {
  return (
    // `svh` en mobile a proposito: con `vh` la barra del browser queda fuera de
    // la cuenta y el hint de scroll cae debajo del pliegue visible.
    <section className="relative min-h-[30rem] h-[82svh] max-h-[52rem] w-full overflow-hidden md:min-h-[36rem] md:h-[82vh]">
      {/* La foto y sus tintes van juntos dentro de un grupo enmascarado: el borde
          inferior se desvanece a transparente y deja ver el degrade del `body`,
          en vez de cortar contra un negro que no coincide con el azul de la
          pagina. Sin la mascara el limite banner/seccion queda como una linea. */}
      <div
        className="absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_0%,#000_48%,rgba(0,0,0,0.55)_76%,rgba(0,0,0,0.18)_92%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_48%,rgba(0,0,0,0.55)_76%,rgba(0,0,0,0.18)_92%,transparent_100%)]"
      >
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover"
        />
        {/* Tinte azul + oscurecido arriba (para el navbar) */}
        <div className="absolute inset-0 bg-[#05102a]/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060a]/70 via-transparent to-[#05060a]/45" />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-margin-mobile md:px-margin-desktop text-center">
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
                variant={action.variant ?? "solid"}
              >
                {action.label}
              </CtaLink>
            ))}
          </div>
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
