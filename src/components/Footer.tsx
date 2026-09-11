import Image from "next/image";
import Link from "next/link";
import { FOOTER_COLUMNS, IMAGES } from "@/lib/constants";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer // El degrade va en CSS: el PNG que entrego la disenadora era un
    // degrade plano de 1,7 KB. Los extremos salen del mockup aprobado
    // (`.footer` de homepage_correccion.html): #05125a -> #0079b3, recto.
    className="bg-[linear-gradient(to_right,#05125a_0%,#0079b3_100%)] pt-16 pb-8 px-margin-mobile md:px-margin-desktop">
      <div className="mx-auto grid max-w-narrative grid-cols-1 gap-12 md:grid-cols-4">
        <Link href="/" className="md:self-start">
          <Image
            src={IMAGES.logo}
            alt="Cosmic Eagle"
            width={914}
            height={267}
            sizes="280px"
            className="h-12 w-auto object-contain md:h-[60px]"
          />
        </Link>

        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} className="space-y-4">
            {/* 18px y no `text-label-sm`: el titulo de columna media 12px y
                sus propios links 16px, o sea que el encabezado era MAS CHICO
                que lo que encabeza (reporte de Sofia, 11/09). Los tres valores
                van explicitos y no por token porque `text-label-sm` ya emite
                font-size: dos utilidades de la misma propiedad las resuelve el
                orden de la hoja generada, no el orden en que se escriben. Se
                conservan la mayuscula, el tracking y el peso de la etiqueta:
                lo unico que cambia es el cuerpo. */}
            <h2 className="text-[18px] font-semibold uppercase leading-6 tracking-[0.1em] text-primary-fixed-dim">
              {column.title}
            </h2>
            <ul className="space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <Link
                      href={link.href}
                      className="text-body-md text-on-surface-variant transition-colors hover:text-primary-fixed-dim"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    // Sin ruta todavia: se muestra apagado en vez de linkear a "#"
                    <span
                      className="text-body-md text-on-surface-variant/40"
                      title="Próximamente"
                    >
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="space-y-4">
          {/* Mismo cuerpo que los otros tres titulos de columna, ver arriba. */}
          <h2 className="text-[18px] font-semibold uppercase leading-6 tracking-[0.1em] text-primary-fixed-dim">
            Sintoniza
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Enterate de las novedades antes que nadie.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-narrative flex-col items-center justify-between gap-4 border-t border-primary-fixed-dim/8 pt-6 text-center md:flex-row md:text-left">
        <p className="text-label-sm uppercase text-on-surface-variant/70">
          &copy; 2026 Cosmic Eagle Journey
        </p>
        <p className="text-label-sm uppercase text-on-surface-variant/70">
          i.vavala
        </p>
      </div>
    </footer>
  );
}
