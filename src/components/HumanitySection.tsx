import { CtaLink } from "./ui/CtaLink";
import { LightSection } from "./ui/LightSection";
import { Reveal } from "./ui/Reveal";
import { HOME_COPY } from "@/lib/constants";

/**
 * Geometria sagrada del mockup: un racimo de circulos con un eje vertical, que
 * acompana al bloque por la derecha.
 *
 * Va en SVG y no como imagen porque es geometria pura: pesa unos cientos de
 * bytes, se dibuja nitida en cualquier pantalla y toma el color del bloque en vez
 * de traerlo quemado. Es decorativa, asi que no se anuncia.
 */
function SacredGeometry({ className = "" }: { className?: string }) {
  // Cuatro circulos en diagonal, cada uno con su eje, como en el slide.
  const circles = [
    { cx: 108, cy: 40 },
    { cx: 74, cy: 78 },
    { cx: 108, cy: 116 },
    { cx: 40, cy: 116 },
    { cx: 74, cy: 154 },
    { cx: 40, cy: 192 },
  ];

  return (
    <svg
      viewBox="0 0 160 240"
      aria-hidden="true"
      fill="none"
      className={className}
    >
      {circles.map(({ cx, cy }) => (
        <g key={`${cx}-${cy}`} stroke="#fdf3dd" strokeOpacity="0.9">
          <circle cx={cx} cy={cy} r="26" strokeWidth="1.1" />
          <line
            x1={cx}
            y1={cy - 34}
            x2={cx}
            y2={cy + 34}
            strokeWidth="1.1"
            strokeOpacity="0.5"
          />
        </g>
      ))}
    </svg>
  );
}

/**
 * "La humanidad está recordando su verdadera naturaleza".
 *
 * Es el unico bloque claro de la home (ver `LightSection`). Los colores se
 * invierten: sobre el dorado el texto va en el azul base `#05125a`, y el CTA pasa
 * a ser un solido azul en vez del oro habitual — por eso no usa las variantes de
 * `CtaLink` sino un `className` propio.
 */
export function HumanitySection({ id }: { id?: string }) {
  const { titleStrong, titleRest, paragraphs, highlight, action } =
    HOME_COPY.humanidad;

  return (
    <LightSection id={id}>
      <Reveal>
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-3xl text-[#05125a]">
            {/* Dos tamanos, como en el mockup: el nombre grande y en negrita, y
                la continuacion mas chica en regular. Con los dos en
                `display-lg` la segunda linea no entraba y caia en tres. */}
            <h2 className="font-display leading-tight">
              <strong className="block text-display-mobile font-bold md:text-display-lg">
                {titleStrong}
              </strong>
              <span className="mt-1 block text-headline-md font-normal md:text-headline-lg">
                {titleRest}
              </span>
            </h2>

            <div className="mt-8 max-w-xl space-y-5 text-body-md">
              {paragraphs.map((text) => (
                <p key={text} className="text-[#05125a]/85">
                  {text}
                </p>
              ))}
              <p className="font-semibold">{highlight}</p>
            </div>

            <CtaLink
              href={action.href}
              className="mt-10 !bg-[#0b1c6b] !text-primary hover:!bg-[#12297f] !shadow-[0_8px_24px_rgba(5,18,90,0.28)]"
            >
              {action.label}
            </CtaLink>
          </div>

          <SacredGeometry className="hidden h-80 w-56 justify-self-end md:block" />
        </div>
      </Reveal>
    </LightSection>
  );
}
