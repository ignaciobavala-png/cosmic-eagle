import Image from "next/image";
import { ChevronDown } from "lucide-react";

/**
 * Hero de imagen pura, con zoom lento de entrada.
 *
 * Es la variante que pide el rediseno de la home (ver docs/HOME_REDISENO.md
 * §5.1): a diferencia de `PageHero` (P1) no lleva titulo ni CTAs — solo la
 * imagen y el cue de scroll. El copy vive en la seccion siguiente.
 *
 * El zoom es `animate-hero-zoom`, definido en globals.css: `scale(1)` a
 * `scale(1.1)` en 8s con 200ms de retraso. Se anima `transform` y no el tamano
 * de la caja porque `transform` lo resuelve el compositor; animar `width` o
 * `background-size` repinta en cada frame, justo sobre la imagen del LCP.
 * `prefers-reduced-motion` lo apaga desde el CSS.
 */
export function ImmersiveHero({
  image,
  imageAlt = "",
  scrollHint,
  scrollTo,
  priority = true,
}: {
  image: string;
  imageAlt?: string;
  scrollHint?: string;
  scrollTo?: string;
  priority?: boolean;
}) {
  return (
    // `svh` en mobile a proposito: con `vh` la barra del browser queda fuera de
    // la cuenta y el cue de scroll cae debajo del pliegue visible.
    <section className="relative min-h-[30rem] h-[88svh] max-h-[56rem] w-full overflow-hidden md:min-h-[36rem] md:h-[88vh]">
      {/* El grupo enmascarado desvanece el borde inferior a transparente y deja
          ver el degrade del `body`, en vez de cortar contra un color que no
          coincide con el azul de la pagina. Mismo criterio que `PageHero`. */}
      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_0%,#000_58%,rgba(0,0,0,0.55)_80%,rgba(0,0,0,0.18)_93%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_58%,rgba(0,0,0,0.55)_80%,rgba(0,0,0,0.18)_93%,transparent_100%)]">
        {/* El zoom va en un envoltorio y no en el <Image>: next/image posiciona
            con `position:absolute` sus propios estilos inline, y una animacion
            de transform sobre el mismo nodo pelea con eso. */}
        <div className="absolute inset-0 animate-hero-zoom">
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority={priority}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </div>

      {scrollHint && scrollTo && (
        <a
          href={`#${scrollTo}`}
          className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-1 text-primary-fixed-dim/80 transition-colors hover:text-primary-fixed-dim"
        >
          <span className="text-label-sm uppercase">{scrollHint}</span>
          <ChevronDown size={18} className="animate-float" />
        </a>
      )}
    </section>
  );
}
