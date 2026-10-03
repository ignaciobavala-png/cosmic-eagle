/**
 * Mayúscula inicial en cada palabra de un nombre, sin tocar el resto de las
 * letras: "elisa ibañez" → "Elisa Ibañez", y "McKenzie" queda como está.
 *
 * Pedido de la organización (03/10, §5.2): en /cuenta salía "Elisa ibañez"
 * tal como se tipeó al registrarse. Las partículas de apellido van en
 * minúscula salvo que abran el nombre ("María de la Fuente"), y las palabras
 * con guion o apóstrofo se capitalizan por partes ("Pérez-Soto", "D'Angelo").
 */
const PARTICLES = new Set(["de", "del", "la", "las", "los", "y", "da", "das", "do", "dos", "van", "von", "der"]);

export function capitalizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word, i) => {
      if (i > 0 && PARTICLES.has(word.toLowerCase())) return word.toLowerCase();
      return word.replace(/(^|[-'’])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase("es"));
    })
    .join(" ");
}
