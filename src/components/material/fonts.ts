import { Quattrocento_Sans } from "next/font/google";

/**
 * El cuerpo del cuaderno de Egipto va en Quattrocento Sans (la del PDF de
 * referencia, 28/10). Es de Google Fonts y libre, a diferencia de las del
 * manual de marca. Los titulos van en Georgia, que es del sistema: no se
 * sirve, se nombra con su cascada (`.material-serif` en MaterialDocument).
 */
export const materialBody = Quattrocento_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-material",
});
