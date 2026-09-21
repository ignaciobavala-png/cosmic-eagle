import Image from "next/image";
import { CtaLink } from "./CtaLink";
import { Reveal } from "./Reveal";

/**
 * Cierre a pantalla completa: imagen atenuada sobre azul, titulo en mayusculas
 * y hasta dos botones.
 *
 * Es el `.nos-cierre` del rediseño, y reemplaza al remate centrado con estrella
 * (`ClosingSection`, P5) en las paginas que Julia rehizo. La imagen va al 40%
 * sobre el azul solido — no es una foto de portada sino una textura de fondo,
 * asi que el titulo se lee sin velo extra.
 */
export function ClosingHero({
  image,
  imageAlt = "",
  title,
  actions = [],
  id,
  overlay = true,
}: {
  image: string;
  imageAlt?: string;
  title: React.ReactNode;
  actions?: { label: string; href: string }[];
  id?: string;
  /** false deja la pantalla solo con la imagen de fondo: sin titulo ni botones. */
  overlay?: boolean;
}) {
  return (
    <section
      id={id}
      className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#05125a] text-center"
    >
      <Image
        src={image}
        alt={imageAlt}
        fill
        sizes="100vw"
        className="object-cover opacity-40"
      />

      {/* Bloque entero, sin cascada interna: titulo y botones entran juntos
          (umbral 0.3, 20px, 1.2s). Reversible, como todo /nosotros. El titulo es
          campo CMS y puede quedar vacio: entonces solo se muestran los botones. */}
      {overlay && (
        <Reveal
          amount={0.3}
          once={false}
          y={20}
          duration={1.2}
          /* 28px de margen lateral en mobile y no los 20 del sitio: con el
             titulo a pantalla completa el texto quedaba pegado a los bordes
             (correccion del 02/09 de Julia). */
          className="relative z-10 px-7 md:px-margin-desktop"
        >
          {title && (
            /* `clamp(1.5rem,5vw,3rem)`, el del mockup: en mobile el titulo
               tiene que entrar en DOS lineas y con la escala anterior se pasaba.
               `text-balance` reparte el corte entre las dos. */
            <h2 className="font-display text-[clamp(1.5rem,5vw,3rem)] font-bold uppercase leading-[1.3] text-primary-container text-balance">
              {title}
            </h2>
          )}

          {actions.length > 0 && (
            /* `mx-auto`: sin el, la columna de botones de mobile se apoyaba a
               la izquierda del bloque en vez de quedar centrada bajo el titulo.
               Es el otro reclamo del 02/09. */
            <div className="mx-auto mt-10 flex w-full max-w-[20rem] flex-col items-stretch gap-4 sm:max-w-none sm:flex-row sm:justify-center sm:gap-8">
              {actions.map((action) => (
                <CtaLink
                  key={action.href + action.label}
                  href={action.href}
                  /* Los dos botones son EL MISMO boton, sin jerarquia
                     visual (estandarizacion del 15/09). Antes el principal era
                     la pildora dorada con glow y el segundo la de vidrio; la
                     organizacion pidio sacar los rellenos, y con un solo boton
                     de contorno la unica diferencia posible seria el orden. */
                  className="px-9 py-4"
                >
                  {action.label}
                </CtaLink>
              ))}
            </div>
          )}
        </Reveal>
      )}
    </section>
  );
}
