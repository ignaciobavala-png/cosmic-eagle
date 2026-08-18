# Portadas de viaje: una sola imagen, dos recortes

Fecha: 2026-08-18. Responde a un problema concreto: la misma portada se veía
distinta en la tarjeta del listado (vertical-ish, 4:3) que en el banner del
detalle (franja horizontal), y no había ninguna regla sobre qué subir.

## El estándar

**Se sube una sola imagen y se guarda en 16:9.** El recorte a 16:9 lo hace el
browser al elegir el archivo en el admin, así que no depende de que la clienta
prepare la imagen: sube lo que tenga y sale igual.

Desde esa base, cada lugar recorta **desde el centro** con `object-cover`:

| Uso | Proporción | Qué recorta |
|---|---|---|
| Tarjeta (home y `/viajes`) | 4:3 | los lados |
| Banner del detalle, mobile | 4:3 | los lados |
| Banner del detalle, `sm` | 16:9 | nada, es la proporción original |
| Banner del detalle, `md+` | 21:9 | arriba y abajo |

`object-cover` **nunca deforma**: solo descarta borde. Lo que se pierde es
recorte, no proporción.

## La zona segura: el 75% central

De cruzar los dos recortes extremos sale una regla única y fácil de explicar:

- El 4:3 sobre un 16:9 conserva el **75% central del ancho**.
- El 21:9 sobre un 16:9 conserva el **76% central del alto**.

Entonces: **lo que importa de la foto tiene que entrar en el 75% central de los
dos ejes.** Eso es lo que sobrevive en todos los tamaños. El form del admin dibuja
ese recuadro punteado sobre la preview, así que la regla se ve en vez de tener que
recordarse.

## Dónde vive esto en el código

| Archivo | Rol |
|---|---|
| `src/components/ui/TripCover.tsx` | **La única pieza que decide el recorte** al mostrar. Dos variantes: `card` y `banner` |
| `src/lib/trip-cover.ts` | **La única que sube.** Proporción, tope de tamaño y subida al bucket, compartidas por las dos pantallas |
| `src/app/admin/viajes/TripForm.tsx` | Portada como campo del form del viaje |
| `src/app/admin/multimedia/CoverEditor.tsx` | Portada desde Multimedia, sin entrar a editar el viaje |
| `src/lib/compress-image.ts` | `compressImage(file, maxPx, aspect)` — el tercer parámetro recorta centrado |

Se sube desde **dos lugares** y por eso la lógica está extraída: dos
implementaciones se separan en cuanto alguien toca una — que es exactamente lo que
había pasado con el recorte al mostrar.

Antes de esto, la tarjeta y el banner tenían cada uno su markup, su `sizes` y su
alto. Cualquier cambio de recorte había que hacerlo dos veces y era fácil que
quedaran distintos — que es exactamente lo que había pasado.

## Decisiones

- **Los altos van por `aspect-ratio`, no en píxeles.** El banner tenía
  `h-[240px] sm:h-[280px] md:h-[400px]`: con alto fijo, el recorte cambia con el
  ancho del viewport y deja de ser predecible. Con `aspect-ratio` el recorte es el
  mismo siempre.
- **El banner en mobile es 4:3, no 21:9.** El título va superpuesto sobre la
  imagen; con 21:9 en pantalla angosta la franja queda más baja que el propio
  título.
- **El recorte se hace al subir y no al mostrar.** Guardar el original y recortar
  con parámetros de `next/image` sería más flexible, pero deja el archivo pesado en
  el bucket y no le muestra a la clienta lo que va a pasar con su foto. Recortar al
  subir hace que lo que ve en la preview sea literalmente lo que se guarda.
- **El banner pasó de `<img>` a `next/image` con `priority`.** Era la imagen más
  grande de la página y la única sin optimizar: se servía el archivo completo. Es
  el LCP del detalle.
- **1600px de ancho máximo y WebP**, igual que multimedia. Un 16:9 a 1600 son
  1600×900, de sobra para el banner a 1024px de ancho en pantallas 2x.

## Pendiente

- **Punto focal.** Hoy el recorte es siempre centrado. Si aparece una foto cuyo
  motivo está arriba o a un costado, no hay forma de decírselo al sistema: hay que
  recortarla a mano antes de subirla. La solución real es guardar un
  `focal_point` por viaje y traducirlo a `object-position`; no se hizo porque
  todavía no hay ninguna portada cargada que lo necesite.
- **Ninguno de los 8 viajes tiene portada.** Las páginas usan el placeholder por
  hash del id.
