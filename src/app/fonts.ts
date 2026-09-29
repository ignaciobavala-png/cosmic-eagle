import { Sorts_Mill_Goudy, Montserrat } from "next/font/google";

/**
 * Display: **Sorts Mill Goudy**, la digitalizacion libre de la Goudy Old Style
 * que pide el manual de marca (`entregas-sofia/2026-09-09-manual-de-marca`).
 *
 * El manual declara **LTC Goudy Old Style**, que es de pago (P22/Lanston) y
 * cuya licencia de escritorio no cubre webfont; los archivos que llegaron son
 * ademas de un sitio pirata. Sorts Mill Goudy sale del mismo original y en el
 * cotejo lado a lado es practicamente indistinguible.
 *
 * **Solo existe en peso 400** (normal e italica): el bold de Goudy Old Style
 * era una fuente aparte y no se digitalizo. Los `font-bold` que quedan sobre
 * `font-display` se resuelven con `font-synthesis-weight: none` en globals.css
 * — ver el comentario de ahi.
 */
export const displayFont = Sorts_Mill_Goudy({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
});

/** Las dos root layouts (`[locale]` y `(sistema)`) arman el `<html>` igual. */
export const fontClassName = `${displayFont.variable} ${montserrat.variable} h-full antialiased`;
