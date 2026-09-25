import Image from "next/image";

/**
 * Pantalla de acceso: foto a pantalla completa de fondo, formulario flotando
 * encima en una tarjeta de vidrio. Pedido de la organizacion (25/09): antes la
 * imagen era un panel a la izquierda (oculto en mobile); ahora cubre las
 * cuatro pantallas de `/cuenta` enteras, en todos los tamaños.
 *
 * El velo azul plano (mismo criterio que `MediaStatement`) es lo que sostiene
 * el contraste del texto blanco contra la foto.
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
  /** Rotulo chico sobre el titulo. Opcional: login y registro van sin el
   * (pedido de Julia del 08/09); recuperar y nueva-clave lo conservan. */
  eyebrow?: string;
  title: string;
  /** Texto bajo el titulo. Sacado de login y registro (pedido de la
   * organizacion, 25/09: duplicaba la accion del boton). Recuperar y
   * nueva-clave lo conservan porque ahi es instruccion real, no una etiqueta. */
  subtitle?: string;
  /** El formulario. */
  children: React.ReactNode;
  /** Link del pie de la tarjeta ("¿No tienes cuenta? Regístrate"). */
  footer?: React.ReactNode;
  /** Aviso de error o de exito, arriba del formulario. */
  notice?: React.ReactNode;
}) {
  return (
    // El alto descuenta el navbar: el `main` ya empuja la pagina hacia abajo con
    // su `pt`, asi que un `100svh` pelado aca desbordaria justo esa altura.
    <section className="relative flex min-h-[calc(100svh-var(--navbar-h))] w-full items-center justify-center overflow-hidden">
      {/* Dos copias de la misma imagen: ver `kb-zoom` en globals.css. La
          segunda es puramente decorativa y no vuelve a describir la foto. */}
      <Image
        src={image}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        priority
        className="animate-kb-zoom object-cover"
      />
      <Image
        src={image}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="animate-kb-zoom object-cover [animation-delay:-1s]"
      />
      <div className="absolute inset-0 bg-[#05125a]" style={{ opacity: 0.55 }} />

      <div className="relative z-[2] flex w-full justify-center px-6 py-16">
        {/* Sin caja: pedido de la organizacion (25/09), que las casillas
            queden flotando directo sobre la foto y no dentro de una tarjeta.
            El contraste lo sostiene el velo de arriba nomas, asi que el
            titulo lleva `text-shadow-glow` de mas (el mismo halo dorado que
            usa `PageHero` sobre foto). */}
        <div className="animate-auth-card w-full max-w-[420px]">
          {eyebrow && (
            <p className="mb-3.5 text-label-sm font-bold uppercase tracking-[0.21em] text-primary-container text-shadow-glow">
              {eyebrow}
            </p>
          )}
          <h1
            className={`font-display text-[clamp(1.875rem,3.4vw,2.375rem)] font-bold text-white text-shadow-glow ${subtitle ? "mb-2.5" : "mb-9"}`}
          >
            {title}
          </h1>
          {subtitle && <p className="mb-9 text-sm text-white/65">{subtitle}</p>}

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
