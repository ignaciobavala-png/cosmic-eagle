# Las experiencias 2026: qué dicen los flyers y qué hay cargado

Fuente: `INFO_EXPERIENCIAS_COSMICEAGLE.txt` (2026-08-18, en `~/Descargas`, **fuera
del repo**). Es la transcripción de los flyers que hoy reparten por WhatsApp.
Cruzado contra la tabla `trips` en producción.

## 1. Ojo con el archivo: transcribe lo mismo dos veces

El .txt tiene **dos transcripciones superpuestas**. La primera ("DOCUMENTO 1-4")
cubre Buenos Aires, Uruguay, Los Vilos y Tulum. La segunda ("TODOS LOS RETIROS
2026") repite Buenos Aires y Uruguay y agrega Santiago 3 y 4 de octubre.

**No dicen lo mismo**: en la primera, Buenos Aires y Uruguay salen **US$250**; en la
segunda, **US$350**. Es el mismo evento con dos precios. Sin resolver.

## 2. Las 6 experiencias del documento

| # | Experiencia | Fechas | Lugar | Precio | Tipo |
|---|---|---|---|---|---|
| 1 | Buenos Aires | 5–6 sep 2026 | Buenos Aires, AR | US$250 **o** US$350 | ceremonia |
| 2 | Punta del Este | 12–13 sep 2026 | Punta del Este, UY | US$250 **o** US$350 | ceremonia |
| 3 | Santiago | **sábado 3** oct 2026 | El Arrayán, Santiago, CL | $250.000 **CLP** | ceremonia |
| 4 | Santiago | **domingo 4** oct 2026 | El Arrayán, Santiago, CL | $250.000 **CLP** | ceremonia |
| 5 | Retiro Los Vilos | 9–13 oct 2026 | Guangualí, Los Vilos, CL | US$1.500 (hab. compartida) | retiro |
| 6 | Tulum Cosmic Retreat | 13–**20** nov 2026 | Dos Ojos National Park, MX | US$2.700 | retiro |

Los 3 y 4 de octubre son **dos flyers separados, uno por día**, con el mismo
contenido. No es un evento de dos días.

## 3. Lo cargado hoy en `trips` vs. el documento

Los 7 viajes están cargados como esqueletos: **sin precio, sin descripción, sin
programa, sin condiciones y sin portada**. El cruce:

| En la base | Documento | Estado |
|---|---|---|
| Ceremonia en Buenos Aires · 05–06 sep | BA 5-6 sep | ✅ coincide |
| Ceremonia en Punta del Este · 12–13 sep | Uruguay 12-13 sep | ✅ coincide |
| Ceremonia en Santiago · 03–04 oct | Santiago 3 oct **y** Santiago 4 oct | ⚠️ **son dos eventos, está cargado uno** |
| Retiro en Los Vilos · 09–13 oct | Los Vilos 9-13 oct | ✅ coincide |
| Ceremonia en Tulum · 07 nov | — | ❌ **no está en el documento** |
| Retiro en Tulum · 13–**18** nov | Tulum 13–**20** nov | ⚠️ **fecha de salida distinta** |
| Ceremonia en Santiago · 05–06 dic | — | ❌ **no está en el documento** |

Los dos que no están en el documento pueden ser reales (info que llegó por otro
lado) o tanteos. Hay que confirmarlos antes de publicarlos: hoy están en `open`, o
sea visibles en el sitio, con fecha y lugar pero sin nada más.

`capacity` está en 20 y 12: son valores por defecto, el documento sólo dice "los
cupos son limitados".

## 4. Qué texto se repite y dónde tiene que vivir

Los flyers comparten casi todo el copy. Cargarlo en la `description` de cada viaje
lo duplicaría 6 veces y obligaría a corregir 6 lugares cada vez que cambie una
palabra. **Hay tres variantes de copy, no una**:

| Variante | Quién la usa | Rasgos |
|---|---|---|
| **A** | Buenos Aires, Punta del Este | "tecnología cósmica", 7 logros, "reactivar la memoria original" |
| **B** | Santiago (3 y 4 oct) | "medicina de los niños de luz", 6 logros distintos, "activar la conexión con la luz sagrada" |
| **C** | Los Vilos y Tulum (los dos retiros) | 4 logros + 4 extra "para avanzados / ya en el camino al 5D" |

La C es la misma en los dos retiros: Tulum es su traducción al inglés, palabra por
palabra. La A y la B son las dos ceremonias, y la B es **posterior** en el
calendario — puede ser copy nuevo que reemplaza al viejo, o el texto propio de un
formato distinto. **Hay que preguntarlo**: si es lo primero, la A se descarta.

También se repiten y **no son del viaje sino del sitio**: el mail
`booking@cosmiceaglejourney.com`, el WhatsApp +56 9 2646 6800, "Cuando el alma está
lista, el camino aparece" y la bajada de Estela de Luz.

### Propuesta

Dos niveles, para no escribir nada dos veces:

1. **Texto compartido → `site_content`**, editable desde `/admin/multimedia` sin
   tocar código, y renderizado en `/viajes/[id]` según el `type`. Slots nuevos:
   intro y lista de logros para ceremonia, ídem para retiro, más la bajada de
   Estela. Cambia una palabra, cambia en las seis páginas.
2. **`description` de cada viaje → sólo lo propio**: qué distingue a ese lugar y esa
   fecha. Es lo único que hoy difiere de verdad entre los flyers: la sede
   (Guangualí, Dos Ojos), los datos prácticos de llegada, el testimonio.

## 5. Lo que el documento pide y el modelo no tiene

| Falta | Dónde aparece | Impacto |
|---|---|---|
| **Moneda** | Santiago está en **CLP**, el resto en USD | `price` es un número pelado y la UI escribe "USD" fijo en tres lugares (`TripsList`, detalle ×2). Santiago se publicaría como "USD 250000" |
| **Qué incluye** | Los Vilos: "todo incluido excepto traslados"; Tulum: alojamiento, comidas, actividades | No existe. Iría en `description` como parche |
| **Tipo de establecimiento** | "habitación compartida" | Ya estaba en la lista de pendientes del boceto de Sofía |
| **Actividades sin horario** | Retiros: YOGA, BREATHWORK, TEMAZCAL, CENOTES, COMIDA SANA | `schedule` pide día + hora + actividad. Los retiros **no traen programa por hora**, traen una lista suelta |
| **Llegadas y salidas** | Los Vilos: llega viernes por la tarde, sale martes después del almuerzo | No existe |
| **Cantidad de ceremonias** | Los Vilos: 2. Tulum: 3 | No existe. Es dato de venta y además el que define el nivel |
| **Idioma** | Tulum está entero en inglés | i18n sigue pendiente |

**Lo que sí encaja bien**: el programa por hora de las ceremonias (11:00 llegada →
21:00 fin) entra tal cual en `schedule`, que para ceremonias es una lista plana de
horarios. Y las condiciones de pago van en `terms`.

## 6. Las condiciones NO son iguales para todos

Quedaba abierto desde el 2026-08-06 si convenía sacar `terms` de `trips` y dejarlo
fijo en la página. **La respuesta es que no**, y el documento lo prueba:

| Experiencia | Condiciones |
|---|---|
| Buenos Aires, Punta del Este | 50% para reservar, **reembolsable hasta 7 días antes** |
| Santiago (3 y 4 oct) | 50% al reservar + 50% hasta 15 días antes. **La reserva no es reembolsable.** Sin devoluciones dentro de los 10 días previos |
| Los Vilos, Tulum | El flyer no dice nada |

Se queda por viaje, como está.

## 7. Preguntas antes de cargar

1. **Buenos Aires y Punta del Este: ¿US$250 o US$350?** El archivo dice las dos cosas.
2. **Santiago 3 y 4 de octubre: ¿son dos ceremonias?** Hoy está cargado como un solo
   evento del 3 al 4. Si son dos, hay que partirlo.
3. **Buenos Aires y Punta del Este también figuran con dos fechas** (5-6, 12-13) pero
   con un programa de un solo día, 11:00 a 21:00. ¿Es la misma ceremonia repetida
   los dos días, como Santiago?
4. **¿El retiro de Tulum termina el 18 o el 20 de noviembre?** La base dice 18, el
   flyer 13-20.
5. **La ceremonia de Tulum del 7 de noviembre y la de Santiago del 5-6 de diciembre
   no están en el documento.** ¿Existen? ¿De dónde salen los datos?
6. **El copy de las ceremonias: ¿manda la variante A o la B?** (ver §4)
7. **Precio en pesos chilenos**: ¿se muestra en CLP o se convierte a USD? De la
   respuesta depende si hay que agregar una columna `currency`.
8. **Cupos**: el flyer nunca dice el número. ¿Cuántas personas por ceremonia y por
   retiro?

---

## 8. Lo que se cargó (2026-08-18)

Decisiones tomadas por Ignacio antes de cargar: **US$350** para Buenos Aires y Punta
del Este, Santiago **partido en dos ceremonias**, precios **convertidos a USD** (sin
columna `currency`), y **cada ceremonia con su propio copy** (A en Buenos Aires y
Punta del Este, B en Santiago) en vez de un texto compartido por tipo.

| Viaje | Fechas | Precio | Descripción | Programa | Condiciones |
|---|---|---|---|---|---|
| Ceremonia en Buenos Aires | 5–6 sep | US$350 | Variante A | 6 horarios | 50%, reembolsable hasta 7 días antes |
| Ceremonia en Punta del Este | 12–13 sep | US$350 | Variante A | 6 horarios | ídem |
| Ceremonia en Santiago | **3 oct** | US$260 | Variante B | 6 horarios | 50% + 50%, reserva no reembolsable |
| Ceremonia en Santiago | **4 oct** (nueva) | US$260 | Variante B | 6 horarios | ídem |
| Retiro en Los Vilos | 9–13 oct | US$1.500 | Variante C + datos prácticos + testimonio | — | el flyer no dice |
| Retiro en Tulum | 13–18 nov | US$2.700 | Variante C traducida + testimonio | — | el flyer no dice |

Notas de la carga:

- **El precio de Santiago es una conversión aproximada.** El flyer dice $250.000 CLP;
  se cargó **US$260**. Hay que confirmarlo con Estela: si el tipo de cambio se mueve,
  el precio publicado deja de coincidir con el flyer. Es el costo de no tener
  `currency`.
- **El programa de los retiros no se cargó.** Los flyers no dan horarios: dan una
  lista de actividades (yoga, breathwork, temazcal, cenotes…) que quedó dentro de la
  descripción. `schedule` espera día + actividad, así que se llena cuando Estela
  mande el desglose por jornada.
- **Tulum se cargó en español**, traducido del flyer original en inglés. Los bloques
  que comparte con Los Vilos usan el texto español que ya existía en ese flyer, no
  una retraducción.
- **La descripción se renderiza como párrafos planos**: `/viajes/[id]` parte el texto
  por saltos de línea. No hay negritas ni listas — los títulos internos ("¿Qué se
  puede lograr?") y los números salen como párrafos sueltos. Se ve bien, pero si se
  quiere jerarquía visual hay que darle formato al campo.
- **Buenos Aires y Punta del Este siguen con dos fechas** (5-6 y 12-13) y un programa
  de un solo día. A diferencia de Santiago, ahí el flyer es **uno solo** con el rango
  de dos días, así que no se partieron. Pendiente de confirmar (pregunta 3 de §7).

### Quedaron sin tocar, porque no están en el documento

| Viaje | Estado |
|---|---|
| Ceremonia en Tulum · 7 nov | `open` y **sin ningún dato**: sin precio, descripción, programa ni condiciones |
| Ceremonia en Santiago · 5–6 dic | ídem |

Están **visibles en el sitio público** con la página casi vacía. Conviene pasarlos a
`draft` hasta tener la info, o confirmar de dónde salieron.

### Y sigue pendiente

- **El retiro de Tulum termina el 18 en la base y el 20 en el flyer.** No se tocó la
  fecha cargada.
- Ningún viaje tiene **portada**. Las seis páginas usan el placeholder por id.
- Los **cupos** son los valores por defecto (20 ceremonias / 12 retiros): el flyer
  sólo dice "cupos limitados".
