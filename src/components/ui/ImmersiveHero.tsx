import { ChevronDown } from "lucide-react";
import { BackgroundMedia } from "./BackgroundMedia";
import { isVideoUrl } from "@/lib/media";

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
  height = "banner",
}: {
  image: string;
  imageAlt?: string;
  scrollHint?: string;
  scrollTo?: string;
  priority?: boolean;
  /**
   * `full` ocupa la pantalla VISIBLE (una pantalla menos el navbar) y corta
   * seco, que es como pide el hero el rediseño de Julia: debajo arranca una
   * seccion opaca con su propio fondo, y no hay degrade del `body` que dejar
   * ver por el desvanecido del pie. Sin `min-h`: un piso en `rem` volveria a
   * empujar el indicador debajo del pliegue en una pantalla baja, que es
   * exactamente el bug que esta variante tiene que evitar.
   */
  height?: "banner" | "full";
}) {
  const full = height === "full";
  return (
    // `svh` en mobile a proposito: con `vh` la barra del browser queda fuera de
    // la cuenta y el cue de scroll cae debajo del pliegue visible.
    //
    // Y se le RESTA el alto del navbar. La banda es opaca y fija, y todos los
    // `main` la esquivan con `pt-16 lg:pt-21`, asi que una seccion de `100svh`
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
          : "relative min-h-[30rem] h-[88svh] max-h-[min(56rem,calc(100svh-var(--navbar-h)))] w-full overflow-hidden md:min-h-[36rem] md:h-[88vh]"
      }
    >
      {/* El grupo enmascarado desvanece el borde inferior a transparente y deja
          ver el degrade del `body`, en vez de cortar contra un color que no
          coincide con el azul de la pagina. Mismo criterio que `PageHero`. */}
      <div
        className={
          full
            ? "absolute inset-0"
            : "absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_0%,#000_58%,rgba(0,0,0,0.55)_80%,rgba(0,0,0,0.18)_93%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_58%,rgba(0,0,0,0.55)_80%,rgba(0,0,0,0.18)_93%,transparent_100%)]"
        }
      >
        {/* El zoom va en un envoltorio y no en el <Image>: next/image posiciona
            con `position:absolute` sus propios estilos inline, y una animacion
            de transform sobre el mismo nodo pelea con eso.

            Si lo cargado es un VIDEO no se aplica el zoom: el clip ya tiene su
            propio movimiento, y encimarle una escala lenta marea. */}
        <div className={isVideoUrl(image) ? "absolute inset-0" : "absolute inset-0 animate-hero-zoom"}>
          <BackgroundMedia
            src={image}
            alt={imageAlt}
            priority={priority}
            /* `object-top` y no el centro por defecto: la figura tiene la
               cabeza pegada al borde superior de la foto, y en un viewport
               ancho y bajo (1920x870, por ejemplo) la caja del hero queda mas
               apaisada que la imagen — el recorte de `cover` se lleva la misma
               franja de arriba y de abajo, y arriba esta la cabeza. Anclando
               arriba, todo el recorte cae en el pie, que es cielo. */
            className="object-cover object-top"
          />
        </div>
      </div>

      {/* El texto va en Domine con `tracking` de 3px y a 8px de la flecha
          (`.hero-discover` del mockup). Antes heredaba Montserrat del `body` y
          quedaba pegado al chevron: es la correccion del 02/09 de Julia. */}
      {scrollHint && scrollTo && (
        <a
          href={`#${scrollTo}`}
          className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2 text-primary-container/85 transition-colors hover:text-primary-container"
        >
          <span className="font-display text-[13px] uppercase tracking-[0.23em]">
            {scrollHint}
          </span>
          <ChevronDown size={18} className="animate-float" />
        </a>
      )}
    </section>
  );
}
