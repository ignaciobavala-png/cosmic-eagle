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
    <section className="relative min-h-[36rem] h-[82vh] max-h-[52rem] w-full overflow-hidden">
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
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
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
