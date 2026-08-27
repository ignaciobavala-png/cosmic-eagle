import Image from "next/image";

/**
 * Pantalla de acceso: imagen a la izquierda, formulario a la derecha.
 *
 * Sale de `login.html` / `register.html`, la entrega de Julia del 27/08. Los dos
 * archivos son la MISMA pagina con el prefijo de las clases renombrado
 * (`login-` / `reg-`), asi que aca son un solo componente y lo unico que cambia
 * son el copy y el formulario que se le pasa como hijo.
 *
 * La imagen es una tarjeta flotante, no un fondo: tiene margen, esquinas
 * redondeadas y sombra, y se mete por DEBAJO del panel del formulario con un
 * margen derecho negativo, que es lo que le da la sensacion de profundidad
 * contra el degrade de la seccion.
 *
 * **En mobile la imagen no se muestra** (`hidden md:flex`, el breakpoint unico
 * de 768px que usa todo su diseno): queda solo el formulario sobre el degrade.
 *
 * Todo lo que anima va en CSS (`animate-kb-zoom`, `animate-auth-card`), asi la
 * pantalla sigue siendo Server Component y el `"use client"` queda acotado al
 * formulario, que ya lo necesitaba por `useActionState`.
 */
export function AuthScreen({
  image,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  notice,
}: {
  image: string;
  /** Volanta en mayusculas y dorado, arriba del titulo. */
  eyebrow: string;
  title: string;
  subtitle: string;
  /** El formulario. */
  children: React.ReactNode;
  /** Link del pie de la tarjeta ("¿No tenes cuenta? Registrate"). */
  footer?: React.ReactNode;
  /** Aviso de error o de exito, arriba del formulario. */
  notice?: React.ReactNode;
}) {
  return (
    // El alto descuenta el navbar: el `main` ya empuja la pagina hacia abajo con
    // su `pt`, asi que un `100svh` pelado aca desbordaria justo esa altura.
    <section className="flex min-h-[calc(100svh-4rem)] w-full overflow-hidden bg-[linear-gradient(135deg,#05125a_0%,#0a1f6e_55%,#0079b3_100%)] lg:min-h-[calc(100svh-5.25rem)]">
      <div className="relative z-[2] -mr-7 mb-10 ml-10 mt-9 hidden flex-1 basis-1/2 overflow-hidden rounded-[20px] bg-[linear-gradient(160deg,#0079b3,#05125a_75%)] shadow-[0_30px_70px_rgba(0,0,0,0.5),0_10px_24px_rgba(0,0,0,0.35)] md:block">
        {/* Dos copias de la misma imagen: ver `kb-zoom` en globals.css. La
            segunda es puramente decorativa y no vuelve a describir la foto. */}
        <Image
          src={image}
          alt=""
          aria-hidden="true"
          fill
          sizes="(min-width: 768px) 50vw, 0px"
          priority
          className="animate-kb-zoom object-cover"
        />
        <Image
          src={image}
          alt=""
          aria-hidden="true"
          fill
          sizes="(min-width: 768px) 50vw, 0px"
          className="animate-kb-zoom object-cover [animation-delay:-1s]"
        />
      </div>

      <div className="relative z-[1] flex flex-1 basis-1/2 items-center justify-center px-6 pb-15 pt-11 md:px-12 md:pt-9">
        <div className="animate-auth-card w-full max-w-[420px]">
          <p className="mb-3.5 text-label-sm font-bold uppercase tracking-[0.21em] text-primary-container">
            {eyebrow}
          </p>
          <h1 className="mb-2.5 font-display text-[clamp(1.875rem,3.4vw,2.375rem)] font-bold text-white">
            {title}
          </h1>
          <p className="mb-9 text-sm text-white/65">{subtitle}</p>

          {notice && <div className="mb-6">{notice}</div>}

          {children}

          {footer && (
            <p className="mt-7 text-center text-[13.5px] text-white/60">
              {footer}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
