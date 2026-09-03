# Biblioteca de Contenidos

Sofia mando `Biblioteca-Contenidos-Estructura.pdf` el 03/09/2026: la
especificacion de como tiene que funcionar la seccion de contenidos. Es el
documento que **redefine `/contenidos`**, que hoy en produccion es un hub
publico de articulos con filtro por categoria (ver `docs/CONTENIDOS.md`).

Junto con el llegaron los primeros contenidos reales. El PDF y los otros cuatro
archivos viven en `~/Escritorio/things/cosmic-eagle-material/entregas-sofia/2026-09-03-contenidos/`, **fuera
del repo** (41 MB de PDF de Canva). La transcripcion de todo lo que sirve esta
en `docs/contenidos/`.

---

## 1. Lo que pide el documento

### 1.1 Cinco categorias

1. Preparación e Integración
2. Salud y Bienestar
3. Evolución y Conciencia
4. Tecnología Humana
5. Testimonios

Textos tipo ensayo, de media pagina a una pagina, que se van sumando de forma
continua. **El sistema tiene que permitir cargar contenido nuevo con
facilidad.**

Hoy el enum `article_category` tiene tres valores (`biblioteca`, `ciencia`,
`testimonios`) y ninguno coincide del todo con estos cinco.

### 1.2 Navegacion tipo Netflix

Scroll vertical entre las cinco categorias, scroll horizontal dentro de cada
una. La idea es pasear por el banco completo sin entrar y salir de carpetas.

Ella misma abre la puerta: *"Si a nivel tecnico existe una solucion mejor, esta
abierto a propuesta. El requisito es la sensacion de exploracion libre, no el
formato exacto."*

### 1.3 Plantilla unica de lectura

Que un texto abierto **no se vea como un documento de Word**. Referencia: el
documento sobre sistemas de pago que compartio Nacho — jerarquia tipografica,
uso del espacio, estetica propia. Una sola plantilla para todos los contenidos.

Ella misma anota que **Julia deberia estar en esta definicion** (su punto 9.2).

### 1.4 Tres niveles de acceso

| Nivel | Quien | Que ve |
|---|---|---|
| 1 | Visitante sin cuenta | Las cinco categorias y las portadas; solo algunos textos generales de muestra |
| 2 | Persona con cuenta | La biblioteca completa |
| 3 | Persona en proceso | La biblioteca completa + el Manual Evolutivo segun su etapa |

El texto exacto del muro para el nivel 1, que es copy de la clienta:

> Estos contenidos se entregan a quienes participan del programa evolutivo. Para
> acceder, es necesario completar el formulario de postulacion y participar de
> una primera experiencia.

### 1.5 El Manual Evolutivo

Un libro en tres segmentos, entregados progresivamente:

| Etapa | Cuando se entrega |
|---|---|
| Foundations | Despues de la primera experiencia |
| Evolution | Despues de dos o tres experiencias |
| Advanced | En etapas mas avanzadas del proceso |

La habilitacion **la define el equipo caso a caso**. En la web puede estar
visible como producto, con descripcion, pero el contenido requiere habilitacion.

### 1.6 Lectura, impresion y proteccion

Necesitan: leer comodo en cualquier dispositivo, poder imprimir, y que **no se
pueda descargar ni reenviar como documento**. Ella misma reconoce la tension:
todo lo imprimible se puede guardar como PDF.

Su recomendacion, que es la correcta: **lector web protegido + marca de agua
personalizada** con el nombre o correo de quien accede, mas una nota al inicio
de cada material diciendo que es para uso personal del participante.

### 1.7 Newsletter desde la biblioteca

Publicar un contenido y poder enviarlo por correo a la comunidad. El correo
**no lleva el texto**, lleva el link. Requisitos: elegir a quien se envia (toda
la comunidad o segmentos), que el link lleve al contenido dentro del sitio, que
el acceso respete los niveles, y registro de envios con opcion de baja.

---

## 2. Contra lo que ya existe

| Lo que pide | Estado |
|---|---|
| Cargar contenido sin depender del desarrollador | **Hecho** — `/admin/contenidos` existe desde el 18/08 |
| Categorias | Hay tres, pide cinco → migracion |
| Textos tipo ensayo con listas y citas | El parser solo entiende parrafo y `## ` → hay que ampliarlo |
| Navegacion Netflix | No existe: hoy es filtro + grilla |
| Plantilla unica de lectura | `/contenidos/[slug]` existe pero **no fue rediseñada por Julia** |
| Niveles de acceso | **No existe nada.** `articles` es publico-o-borrador |
| Manual Evolutivo | No existe |
| Marca de agua | No existe |
| Newsletter | Hay `newsletter_subscribers` y alta desde el footer. **No hay envio** |
| Testimonios como categoria | Hay tabla `testimonials` aparte, para los carruseles del sitio |

---

## 3. El conflicto con Julia: codigo de acceso vs. cuenta

Es el punto que hay que resolver antes de escribir el gate.

- **El video de Julia del 02/09** (`~/Escritorio/things/cosmic-eagle-material/entregas-julia/2026-09-02-contenidos-mobile.mp4`)
  muestra `/contenidos` con candados y un modal dorado: *"SOLO PARA MIEMBROS —
  Introduce tu codigo de acceso"*.
- **Este documento** dice que el acceso se gestiona desde la cuenta, y lo
  recomienda explicitamente: *"La primera opcion parece mas ordenada y evita que
  circulen links sueltos."*

Coinciden en el resto: sus tres etapas (Foundations / Evolution / Advanced) son
exactamente el acordeon de tres niveles del video.

**Recomendacion: por cuenta, sin codigo.** Postularse ya exige sesion, asi que
el nivel de cada persona se puede derivar de lo que la plataforma ya sabe
(solicitudes aprobadas, viajes completados) mas una habilitacion manual del
equipo para el Manual. Un codigo suelto se comparte por WhatsApp y anula el
control que ella pide en el punto 1.6. Esto cierra
`docs/consulta-sofia-acceso.txt`, abierto desde el 15/08.

---

## 4. Los contenidos que llegaron

En `docs/contenidos/`, transcriptos del PDF de Canva:

| Archivo | Que es | Destino |
|---|---|---|
| `preparacion-cosmica.md` | Ensayo completo, 8 secciones | `articles`, categoria Preparación e Integración |
| `integracion-cosmica.md` | Ensayo completo, 7 secciones | idem |
| `testimonios.md` | 8 testimonios con nombre y pais | tabla `testimonials` |
| `_deck-cosmic-eagle-espanol.md` | El deck de venta del retiro | **no publicar todavia**, tiene 3 articulos candidatos adentro |

### Correcciones de tipeo

La transcripcion respeta el copy de la clienta salvo erratas evidentes, que se
corrigieron y se listan aca por si quieren revisarlas:

- "confiar" (decia "confíar"), "energia" → "energía", "esta liberando" → "está
  liberando", "experieriencia" → "experiencia", "sanar a otos" → "otros",
  "an mis alrededor" → "a mi alrededor", "Muchas paz" → "Mucha paz", "Fué" →
  "Fue", "a los desconocido" → "a lo desconocido".
- "Benjamín, France" quedo como "Benjamín, Francia": el resto de los paises esta
  en español.
- En "Usa las palabras" el PDF muestra cuatro globos sueltos; se transcribieron
  como los dos pares que son ("fue muy loco" → "fue interesante y profundo",
  "fue dificil" → "logre llegar donde queria").

### Para avisarle a Sofia

1. Los **tres testimonios de la pagina 12 del deck** estan firmados los tres
   "Laura, Brasil", con el texto repetido. Es un error de copia en su archivo.
2. Aparece una casilla nueva del dominio, `estela@cosmiceaglejourney.com`.
   `docs/EMAIL.md` solo tiene `contacto@`.
3. El deck se pisa con el copy de `/nosotros` en la parte de Estela y el metodo.

---

## 5. Sus seis preguntas (el punto 9 del documento)

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | ¿El modelo Netflix es viable? | Si. Rieles horizontales por categoria, uno debajo del otro. Sin libreria: scroll nativo con snap |
| 2 | Plantilla de lectura | Falta que la defina Julia. Es lo unico de la lista que no podemos destrabar solos |
| 3 | Proteccion del contenido | Su opcion 3 (lector protegido + marca de agua). Ver §6 |
| 4 | Acceso al Manual | Por cuenta. Ver §3 |
| 5 | Herramienta de envio | Resend, que ya esta integrado. No sumar una plataforma externa |
| 6 | Carga de contenidos | Ya resuelto: `/admin/contenidos` desde el 18/08 |

---

## 6. Sobre la proteccion: lo que se puede y lo que no

Hay que decirselo sin vueltas, porque es el punto donde mas facil se promete de
mas:

- **Se puede:** que el texto viva solo en la pagina, sin boton de descarga, con
  una hoja de estilo de impresion propia, y con el nombre y el correo de quien
  lee impresos en la pagina y en cada hoja impresa.
- **No se puede:** impedir la captura de pantalla, el "guardar como PDF" del
  navegador, ni el copiar y pegar. Cualquier cosa que se muestre en una pantalla
  se puede copiar. Los trucos que lo intentan (deshabilitar el click derecho,
  texto en imagen) rompen la accesibilidad, el buscador de la pagina y la
  lectura en movil, y se saltean en diez segundos.

La marca de agua es lo que si funciona, y no porque bloquee: porque el material
que circula queda identificado. Es exactamente lo que ella escribio.

---

## 7. Plan

| Fase | Que | Estado |
|---|---|---|
| 1 | Transcribir los PDF a `docs/contenidos/` | **hecha** |
| 2 | Ampliar el parser del cuerpo (listas, subtitulos, citas, negrita de arranque) | **hecha** |
| 3 | Las cinco categorias (migracion; la tabla estaba en cero filas) | **hecha** |
| 4 | Cargador por linea de comandos: `.md` → `articles`, sin pasar por el panel | **hecha** |
| 5 | Niveles de acceso (`articles.access_level` + policy + muro) | bloqueada por la decision de §3 |
| 6 | Navegacion Netflix | pendiente |
| 7 | Plantilla de lectura definitiva y marca de agua | Julia |
| 8 | Manual Evolutivo | §3 y contenido |
| 9 | Newsletter de contenidos | dominio verificado en Resend |

Las cuatro primeras dejaron contenido real publicado sin depender de nadie mas,
que es lo que pide su punto 10: *"Ya tenemos los primeros contenidos listos para
subir."*

### Lo que quedo cargado

Dos articulos publicados en la categoria **Preparación e Integración**
(`/contenidos/preparacion-cosmica` y `/contenidos/integracion-cosmica`) y los
ocho testimonios en el carrusel "Voces de Luz" de la home, que paso de tres a
once.

Las otras cuatro categorias existen y salen vacias: el filtro las muestra y
avisa que todavia no hay contenidos ahi.

## 8. El cargador por linea de comandos

`scripts/cargar-contenidos.mjs` lee `docs/contenidos/*.md` y hace upsert en
`articles` y `testimonials`.

    node scripts/cargar-contenidos.mjs --dry   # muestra que haria
    node scripts/cargar-contenidos.mjs         # carga

**No reemplaza al panel**, que sigue siendo la via de la clienta. Existe para la
carga inicial y para los textos que transcribimos nosotros: con el `.md` en el
repo el texto se edita con diff, se revisa en un pull request y se vuelve a
cargar con un comando, en vez de pegarse a mano en un textarea.

Cuatro cosas para saber antes de tocarlo:

- **Es idempotente.** Upsert por `slug` en articulos y por autor + seccion en
  testimonios: correrlo dos veces no duplica nada.
- **Usa la service role key** y es el segundo consumidor de esa llave despues
  del cron de correos. La justificacion esta escrita en el encabezado del
  script: corre fuera de Next, sin sesion, y las policies exigen
  `private.is_admin()`. Solo corre en local, la llave sale de `.env.local`.
- **No manda `published_at`**: lo sella el trigger la primera vez que el
  articulo se publica, igual que desde el panel.
- **Los `<!-- comentarios -->` del `.md` no llegan a la base.** El cuerpo se
  guarda como texto plano y se verian tal cual en el sitio.

### El formato del cuerpo

`parseArticleBody` entiende cinco reglas y **no es markdown completo** a
proposito: no hay sanitizador de HTML en el proyecto y aceptar marcado del
formulario del panel seria un XSS almacenado. Cada regla elige una etiqueta, el
texto sale como texto.

| Marca | Sale como |
|---|---|
| linea en blanco | parrafo nuevo |
| `## ` | subtitulo (`h2`) |
| `### ` | subtitulo chico (`h3`) |
| `- ` | lista, con la estrella de cuatro puntas de marcador |
| `> ` | cita destacada |
| `**Titulo.**` al empezar un item | entradilla en negrita |

La ultima existe porque los textos de la clienta son listas de "concepto +
explicacion" ("Detenerse. Dedica tiempo al silencio...").

### Las portadas

`docs/contenidos/covers/` guarda las dos portadas, recortadas a 16:9 desde las
imagenes de fondo del PDF de Canva. Son **binarios en el repo**, que la regla
del proyecto reserva para assets fijos de layout: van igual porque son la
entrada de un script documentado y pesan 51 KB entre las dos. La imagen que se
sirve no sale del repo — el script las sube a `site-assets/articles/`, como
cualquier portada cargada desde el panel.

**Son chicas** (602x339 y 450x253): es la resolucion maxima que tenian adentro
del PDF. Alcanzan de sobra para la tarjeta del listado, pero el banner del
detalle las estira a todo el ancho. **Hay que pedirle portadas propias a
Julia**, una por articulo.
