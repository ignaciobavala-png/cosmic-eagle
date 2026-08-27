/**
 * Franja de fondo crema, a contramano del azul del resto del sitio.
 *
 * Sale del rediseño de Julia para /nosotros (`NOSOTROS.html`, `.nos-enfoque-*`):
 * es la primera vez que el sitio corta el fondo oscuro con una pantalla clara.
 * El color es el `--crema-claro` de su paleta, que ya existe como token
 * `primary` (`#fff6eb`); acá va literal porque es un fondo, no un color de
 * texto.
 *
 * Al invertir el fondo hay que invertir TODO el texto de adentro: el `body`
 * pinta gris claro por defecto y sobre crema no se lee. Por eso la seccion fija
 * el color base en azul oscuro y los hijos heredan.
 *
 * `min-h-screen` con `svh` en mobile: en el mockup cada una de estas pantallas
 * ocupa el alto completo del viewport.
 */
export function CreamSection({
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
      className={`flex w-full items-center justify-center bg-[#fff6eb] px-margin-mobile py-20 text-[#05125a] md:px-margin-desktop md:py-24 min-h-[100svh] ${className}`}
    >
      {children}
    </section>
  );
}
