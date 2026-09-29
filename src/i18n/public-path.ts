/**
 * Las rutas publicas ahora viven bajo `/[locale]` (`src/app/[locale]/...`), asi
 * que un `revalidatePath("/viajes")` no invalida nada: la cache esta taggeada
 * por el route file real, no por la URL que ve el visitante. El rewrite de
 * next-intl mantiene `/viajes` en la barra, pero por adentro la pagina que
 * renderiza es `/[locale]/viajes`.
 *
 * Este helper traduce la ruta publica a ese patron. Importante: si el path
 * tiene un segmento dinamico (`[locale]`), `revalidatePath` exige el segundo
 * argumento `"page"` o `"layout"` — por eso ningun llamado puede omitirlo.
 */
export function publicPath(path: string): string {
  // La home es el unico caso donde path es `/` y no hay nada que pegarle.
  return path === "/" ? "/[locale]" : `/[locale]${path}`;
}
