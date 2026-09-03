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
  actions?: { label: string; href: string; variant?: "solid" | "ghost" }[];
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
            <h2 className="font-display text-[clamp(1.5rem,5vw,3rem)] font-bold uppercase leading-[1.3] text-primary text-balance">
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
                  /* Los dos botones son la misma PÍLDORA del sistema y sólo
                     cambia el relleno (corrección del 03/09): el principal es
                     la dorada con glow (`pill`) y el segundo la de vidrio con
                     degradé azul al 50% (`glass`). Antes el segundo era el
                     dorado translúcido y los dos se leían casi igual. */
                  variant={action.variant === "ghost" ? "glass" : "pill"}
                  className={`px-9 py-4 hover:-translate-y-0.5 ${
                    action.variant === "ghost"
                      ? ""
                      : "shadow-[0_0_22px_rgba(249,215,143,0.6),0_0_43px_rgba(249,215,143,0.32)] hover:shadow-[0_0_29px_rgba(249,215,143,0.77),0_0_58px_rgba(249,215,143,0.45)]"
                  }`}
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
