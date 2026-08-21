/**
 * Seccion de fondo claro, a contramano del resto del sitio.
 *
 * Es la unica franja del rediseno que no va sobre el degrade azul del `body`
 * (docs/HOME_REDISENO.md §3.4). El fondo es el dorado del mockup: un degrade
 * horizontal de `#f9d78f` a `#b3964b`, que son exactamente el token
 * `primary-container` y la base del `glass-card`. Se hace con `linear-gradient`
 * y no con la imagen que entrego la disenadora porque el PNG es un degrade
 * plano: en CSS pesa cero, no suma una request y escala a cualquier ancho sin
 * pixelarse (la imagen convertida pesaba 5,9 KB y quedaba clavada en 1440px).
 *
 * `full` la saca del ancho narrativo y la lleva de borde a borde, que es como
 * aparece en el mockup.
 */
export function LightSection({
  children,
  id,
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`w-full bg-[linear-gradient(to_right,#f9d78f_0%,#e0bd77_45%,#b3964b_100%)] ${className}`}
    >
      <div className="mx-auto w-full max-w-narrative px-margin-mobile py-20 md:px-margin-desktop md:py-section">
        {children}
      </div>
    </section>
  );
}
