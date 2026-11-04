# Guía de la plataforma para la organización

> **Qué es esto (04/11/2026).** Cómo funciona hoy la plataforma, para que el
> asistente del panel pueda contestárselo a la organización sin pasar por
> Ignacio. Sale del código y de `docs/`; lo que la organización ya decidió o
> todavía no, va marcado.
>
> Cómo está escrito: cada `## ` es un tema que el asistente pide por separado.
> Lo que **no está decidido** va marcado con **[PENDIENTE]**: el asistente dice
> "eso todavía no está definido" y no inventa. Lo que no está verificado contra
> el código va marcado con **[CONFIRMAR]**.
>
> Para quien mantiene esto: si cambia una regla de la plataforma, se cambia acá
> el mismo día. Las preguntas que el asistente no pudo contestar quedan en
> `ai_agent_log` (tool `guia_sin_respuesta`): son lo que falta documentar.

---

## Cómo se inscribe una persona (el recorrido completo)

El orden es este, y es siempre el mismo para todos:

1. **Se registra** en la página con mail y contraseña. No hace falta confirmar el
   mail: lo que filtra de verdad es la aprobación de Estela.
2. **Completa el filtro corto** (tres preguntas de salud) en la página del viaje
   o sesión, botón de postularse. Es una solicitud **por evento**: para otro
   viaje hay que postular de nuevo.
3. **Estela revisa** la solicitud en el panel (`Solicitudes`).
4. Si la aprueba, la persona recibe un **correo** y ve en su cuenta cómo pagar.
5. **Paga** (reserva o total) y sube el comprobante. Estela confirma el pago a mano.
6. Con el pago confirmado, se abre el **formulario de salud extenso**.
7. Después firma el **consentimiento informado**.
8. Antes del evento recibe los **datos de llegada** (dirección, horarios, qué
   llevar).

Cada etapa es un paso nuevo: la persona nunca vuelve a editar lo que ya mandó.

La pantalla `Mi cuenta` le dice a cada persona **en qué paso está y cuál sigue**.

Si alguien pregunta "¿en qué paso está fulana?", se mira su solicitud en
`Solicitudes`: el estado y el pago dicen dónde quedó.

## El filtro corto y la revisión de Estela

- Son **tres preguntas**: enfermedad grave, tratamiento psiquiátrico o
  psicológico, y tratamiento médico o medicación actual. El texto es de Sofía y
  **no se reescribe** sin consultarle. Está en tuteo a propósito.
- **Ninguna respuesta rechaza sola.** El sistema no aprueba ni rechaza nada
  automáticamente: **todas las solicitudes las lee Estela**. Si la persona
  marcó algo, la solicitud sube arriba en la campanita y nada más.
- Estela tiene **tres salidas**:
  - **Aprobar**: la persona recibe el correo para avanzar.
  - **Requiere conversación** ("Conversemos"): se le escribe para hablar antes
    de decidir. Después de hablar, vuelve a aprobar o a no aprobar.
  - **No aprobar**: nunca sale un mensaje solo; se revisa antes de mandar.
- **Quien se anotó no puede revisar su propia solicitud**, aunque sea admin. Es
  una regla del sistema, no un error.
- Rechazar o dar por vencida una solicitud **no manda correo automático**: un
  rechazo por salud merece una conversación.
- Una persona rechazada para un viaje **puede postular a otro** más adelante.

## Pagos: cómo se cobra

- **No hay pasarela de pago en la plataforma.** El pago es por transferencia (o
  por el link de tarjeta de Encuadrado) y **Estela lo confirma a mano** mirando
  el comprobante. Esto no es un parche: es como funciona.
- Cuando una persona es aprobada, ve en su cuenta los **medios de cobro
  visibles** (cargados en `Pagos`) y puede **subir el comprobante**.
- Subir el comprobante **no marca el pago**. Lo marca Estela desde la solicitud.
  Cuando llega un comprobante aparece un aviso en la campanita.
- Los comprobantes son **privados**: solo los ve el equipo, con un link que
  vence a los 10 minutos.
- El **precio de cada viaje está en dólares (USD)**. Los otros medios cobran el
  equivalente del día; el medio aclara su moneda (euros, pesos chilenos).
- Hoy hay cargados: transferencia en euros (Santander, España) y transferencia a
  Mercado Pago (Chile). Los datos bancarios se cargan y editan en `Pagos`.
- **Estados de pago**: `pendiente` → `seña pagada` → `pagado`. Además existe
  `sin cargo`, para invitaciones o casos en que no se cobra.
- **Seña o total**: la persona puede reservar con una seña o pagar todo. El monto
  de la seña **lo define la organización viaje por viaje** (campo del viaje).
  Si un viaje no tiene seña cargada, se paga completo. La seña tiene que ser
  mayor que cero y menor que el precio.
- Estela registra **cuánto llegó** (monto acumulado); el saldo es la resta.
- Al confirmar un pago, la persona recibe un correo: "pago confirmado" si pagó
  todo, "cupo reservado" si fue seña, "saldo completado" al cerrar.
- Cada viaje puede tener un **link de pago de tarjeta** (Encuadrado) cargado a
  mano en su ficha. Solo lo ve quien está aprobado, nunca en la página pública.

**[PENDIENTE]** Estas cinco cosas no están decididas y el asistente no debe
responderlas como si lo estuvieran:

1. Si el saldo se puede pagar en **cuotas** y cuántas.
2. El **plazo** para pagar el saldo. En el código hay 15 días antes del evento
   como valor provisorio; ninguna pantalla lo promete.
3. **Qué pasa si alguien no paga** el saldo (si se libera el cupo, si se
   devuelve lo pagado). Hoy lo decide Estela caso por caso.
4. Si la **tarjeta** puede cobrar la seña o solo el total.
5. Por qué medio se paga el **saldo**.

## Políticas que NO están escritas

- **La política de cancelación** no está cargada. Hay un lugar para ella en
  `Multimedia` (grupo "Condiciones") pero está vacío a propósito: el texto es de
  la organización. Mientras no esté, el asistente no debe inventar condiciones
  de cancelación ni reembolso.
- Los **textos legales** (Privacidad y Términos) tienen datos entre corchetes
  sin completar. De eso depende qué ley de datos aplica, según el país.

## Los correos que manda la plataforma

Hay dos tipos que se confunden:

- **Los de la cuenta** (recuperar contraseña): los manda el sistema de acceso.
- **Los del recorrido**: los manda la plataforma. Salen de
  `hola@cosmiceaglejourney.com`; **las respuestas llegan a `booking@`**.

Firma de todos: *"Con cariño, Equipo Cosmic Eagle. Un viaje hacia el Humano
Luminoso."* Ningún correo promete **plazos de respuesta**.

**Los que salen hoy:**

| Cuándo | Correo |
|---|---|
| Al postularse | "Recibimos tu postulación" |
| Al aprobar | "Puedes avanzar al siguiente paso" (con cómo pagar) |
| Si requiere conversar | "Nos gustaría conversar" (lo manda Estela, no es automático) |
| Si no se aprueba | "Sobre tu postulación" (se revisa antes de mandar) |
| Al confirmar un pago | pago confirmado / cupo reservado / saldo completado |
| Automático, saldo pendiente | recordatorio de saldo |
| Automático, faltan formularios | "Formularios pendientes" |
| Automático, antes del evento | "Datos finales" (dirección, horarios, qué llevar) |

**Los que todavía no existen:** bienvenida tras aprobar el formulario de salud,
preparación, material de integración, feedback ("Tu mirada"), "formularios
recibidos", mensaje recibido, cambio o cancelación. Les falta contenido o una
pantalla.

**Cómo salen:**
- Los que dispara un botón (aprobar, registrar pago) salen en el momento.
- Los programados los manda un barrido **todos los días a las 13:00 UTC**. Cada
  correo programado sale **una sola vez** por persona.
- Si un correo falla, queda un aviso **"correo que no salió"** en la campanita y
  hay que escribirle a la persona a mano. Un correo fallido **no se reintenta**.
- **Tope diario:** unos 40 por corrida. Si hay más, el resto sale al día siguiente.

**Los plazos de los programados** son **[CONFIRMAR]** (casi todos provisorios,
salen de sugerencias de Sofía): recordatorio de saldo, aviso de formularios
pendientes (a los 3 días del pago), preparación (10 días antes en sesiones, 14
en viajes), datos finales (4 días antes), integración (2 días después), feedback
(8 días después).

**El correo de "Datos finales" no sale si el viaje no tiene dirección ni lista
cargada.** Si alguien dice "no me llegó la dirección", lo primero es mirar que
el viaje tenga esos campos completos.

**Para el equipo:** desde el CRM se puede mandar un correo a un grupo filtrado,
con el redactor, y copiar los mails del grupo.

## Los formularios de salud y el consentimiento

- **Filtro corto** (antes de aprobar) y **formulario extenso** (después de pagar)
  son dos etapas distintas.
- El formulario extenso **se abre solo si la solicitud está aprobada y el pago
  registrado**.
- El **consentimiento informado** se firma después del formulario de salud, en
  **cada evento**. El texto es de la organización (viene de su formulario de
  Google) y está versionado.
- Estos datos son **sensibles**: los ve solo el equipo admin, y **el asistente
  de IA no los ve** (ver más abajo).

## Viajes y Sesiones

- **Viaje Cósmico** = retiro de varios días (una semana). **Sesión Cósmica** =
  ceremonia de **un día**. En el panel: `Retiros` y `Sesiones`.
- **Cada Sesión es única, irrepetible y dura un día.** No hay fechas
  repetidas: cada fecha es su propio evento.
- Estados: **borrador** (no se ve en el sitio), **abierta** (se pueden anotar),
  **cerrada**, **realizada**.
- Un evento abierto cuya fecha ya pasó **se pasa solo a "realizada"** (el
  barrido corre a diario; un evento que termina hoy se cierra mañana).
- **La tarjeta del sitio no muestra la fecha**: se escribe en el nombre. Las
  fechas reales igual se cargan, porque el sistema las usa.
- Cada evento lleva: nombre, fechas, cupo, precio en USD, seña (opcional),
  portada, y los datos de llegada (ciudad, dirección, horarios, qué incluye,
  qué llevar).
- **La dirección exacta no es pública**: la ven los pagados, en su cuenta y en el
  correo de datos finales.
- El cupo se descuenta con solicitudes **aprobadas**.

## La biblioteca de contenidos y los niveles de acceso

Cada contenido tiene un **nivel de acceso**:

| Nivel | Quién lo lee |
|---|---|
| **Público** | cualquiera, sin cuenta |
| **Miembros** ("Con cuenta") | cualquier persona registrada |
| **Programa** | quien fue habilitada |

- **Un contenido nuevo arranca en "Miembros"**, a propósito: equivocarse hacia
  adentro se corrige con un click; hacia afuera publicás algo del programa sin
  querer. **Si cargás algo pensando que es abierto, un visitante sin cuenta no
  lo va a ver.** Se cambia en el desplegable "Quién puede leerlo".
- **Aprobar una solicitud habilita a la persona sola** al nivel Programa. No hay
  que hacerlo a mano. La habilitación se conserva después del viaje.
- Quien ve un contenido cerrado ve el **candado** (título y portada), pero el
  texto no sale de la base.
- **Códigos de acceso**: uno por viaje o por tanda, no por persona (ej.
  `TULUM-2026`). Se crean en `Niveles de acceso`, con tope de usos y
  vencimiento. Sirven para quien **no pasó por la plataforma** (por ejemplo, quien
  ceremonió antes de la web). **Canjear un código exige tener cuenta**.
- Apagar un código frena a gente nueva pero **no le saca el acceso a quien ya
  lo canjeó**: para eso hay un botón de quitar, uno por persona.
- El cuerpo de un artículo es **texto plano** con reglas simples: `## ` título,
  `### ` subtítulo, `- ` lista, `> ` cita, `**Título.** resto`. **No se pega
  HTML en un texto.**
- Se puede **subir un documento HTML ya armado** como contenido ("Formato del
  contenido: HTML subido"). No tiene versión en inglés.
- **Envío material**: sube un HTML (hasta 3 MB) y saca un link público sin
  cuenta; "Dejar de compartir" lo corta en el acto. Las fotos embebidas hay que
  comprimirlas antes de exportar; las rutas relativas (`img/foto.jpg`) no
  funcionan.

**[PENDIENTE]** El Manual Evolutivo (tres etapas de contenido) y la marca de
agua personalizada no existen todavía.

## Editar el sitio sin tocar código

- **Textos e imágenes de las páginas públicas**: `Multimedia`. Lo que se cambia se
  ve enseguida.
- **Imágenes**: se recortan y comprimen en el navegador al subir; lo que se ve
  en la vista previa es lo que queda.
- **Videos pesados (más de ~4 MB) todavía fallan al subir.** Hay que
  comprimirlos antes. Es un problema conocido sin resolver.
- Si un texto "no aparece" donde se esperaba, puede estar cargado en
  `Multimedia` y no en la página.
- **Preguntas frecuentes, testimonios, medios de cobro y documentos legales** tienen
  su propia sección del panel. Un borrador no se muestra en el sitio.
- **Los textos legales, las FAQs, el consentimiento y el filtro corto son de la
  organización.** No se reescriben sin consultar.
- Hay versión en **inglés** del sitio público; no están todavía en inglés el
  recorrido de inscripción, los correos ni los legales.

## Mapa del sitio público (qué hay en cada página)

El sitio está en español e inglés. Estas son las páginas que ve cualquier visitante:

- **Inicio (`/`)**: una página narrativa, sin listas de datos. Cuenta la propuesta
  de Cosmic Eagle y lleva a los viajes y sesiones.
- **Nosotros (`/nosotros`)**: cuatro palabras → quiénes somos (el relato de Estela
  y el equipo) → nuestro propósito → una frase → el enfoque → cierre. El menú de
  la página y su orden van juntos.
- **Viajes (`/viajes`)**: dos bloques, **Sesiones Cósmicas** (un día) y **Viajes
  Cósmicos** (una semana), cada uno con su calendario desplegable. La tarjeta de
  cada evento **no muestra la fecha**: está escrita en el nombre.
- **Detalle de un evento (`/viajes/[id]`)**: pública. Descripción, programa,
  condiciones y botón para postularse. **No muestra la dirección exacta** ni el
  link de pago.
- **Contenidos (`/contenidos`)**: la biblioteca. Entra por **cinco tarjetas de
  tema**: salud, tecnología, evolución, preparación y testimonios. Los contenidos
  cerrados se ven con candado.
- **Un contenido (`/contenidos/[slug]`)**: el texto completo si el nivel de acceso
  de la persona alcanza; si no, un muro que explica qué hace falta (cuenta o
  código). Tiene botón de **Compartir**.
- **Preguntas frecuentes (`/faqs`)**: las preguntas y respuestas que la
  organización carga en el panel.
- **Privacidad (`/privacidad`) y Términos (`/terminos`)**: los textos legales que
  se cargan en el panel (**[PENDIENTE]** completar los datos entre corchetes).
- **Mi cuenta (`/cuenta`)**: ingreso y registro; para quien ya tiene sesión, el
  panel con sus solicitudes, en qué paso está cada una y qué sigue.
  - **Recuperar contraseña (`/cuenta/recuperar`)**: manda un correo con un link.
- **Calendario**: ya no existe. La dirección vieja (`/calendario`) lleva a `/viajes`.
- **Pie de página**: suscripción al boletín (los mails que se anotan se ven en
  `Suscriptores`).

Casi todos los textos e imágenes de estas páginas se editan sin tocar código desde
`Multimedia`; las preguntas frecuentes, los testimonios, los contenidos, los
medios de cobro y los legales, desde su propia sección del panel.

## Qué dicen los contenidos de la biblioteca

La biblioteca tiene **31 contenidos** (a 04/11/2026), casi todos públicos, en cinco
temas. Para saber **qué dice** uno o qué enseña la organización sobre un asunto,
el asistente los lee con `buscar_en_contenidos` y `leer_articulo` (no están
resumidos acá, para que lo que contesta salga del texto real y no de un resumen):

- **Salud**: movimiento, nutrición consciente, alimentos de poder, la psilocibina
  como herramienta, el poder de la mente, preparar el cuerpo.
- **Tecnología** (tecnología humana): la mente, el ego, el alma, la conciencia, la
  frecuencia interior, la frecuencia del amor, todo es energía, el despertar.
- **Evolución**: el viaje cósmico, el proceso evolutivo, el camino de la
  evolución, conectar con el alma, el sanador interior, trascender el ego, de la
  tercera a la quinta dimensión.
- **Preparación**: bienvenida (nivel miembros), preparación para el viaje cósmico,
  prácticas, integración después del viaje.
- **Testimonios**: relatos de participantes.

Los títulos y temas pueden cambiar cuando la organización publica o edita: la
lista real es la de `listar_articulos`.

## Quién puede qué

- **Visitante**: ve el sitio público y los contenidos de nivel Público.
- **Solicitante / registrada**: puede postular y ve contenidos de nivel Miembros.
- **Viajera** (aprobada): ve su cuenta y su recorrido, y los contenidos del
  programa.
- **Admin**: entra al panel (`/admin`). El acceso al panel se da por un campo de
  la cuenta (`is_admin`), no por contraseña aparte.
- Un admin **no puede aprobar su propia solicitud**.
- El panel no tiene roles distintos dentro del admin: quien entra ve todo.

## Problemas frecuentes

- **"Se registró pero no puede entrar"**: revisar que haya completado el
  registro; no se pide confirmar el mail.
- **"No le llegó el mail de recuperar contraseña"**: el correo sale por el
  sistema de acceso. Pedirle que mire spam. **[CONFIRMAR]** si hay otra vía hoy
  (un link generado por el panel está pendiente de construir).
- **"No le llegó un correo del recorrido"**: mirar la campanita (¿hay un aviso de
  "correo que no salió"?) y, para datos finales, que el viaje tenga dirección y
  lista cargadas. Los correos programados salen una vez al día.
- **"No puede subir el comprobante"**: solo aparece cuando la solicitud está
  aprobada y sin pagar.
- **"No ve el formulario de salud"**: se abre solo con solicitud aprobada **y** pago
  registrado. Falta que Estela lo marque.
- **"No ve un contenido"**: revisar su nivel de acceso y el del contenido.
- **"Una persona que ya ceremonió con Estela antes de la web"**: no tiene
  historial en la plataforma. Se le puede dar acceso a la biblioteca con un
  código o con el botón de habilitar de `Niveles de acceso`.
- **"Video que no sube"**: comprimirlo antes (límite ~4 MB).

## Qué hace y qué no hace el asistente de IA del panel

- **Puede**: consultar viajes, solicitudes, el CRM, participantes, textos del
  sitio, testimonios y avisos; explicar cómo se usa el panel; crear y editar
  viajes, artículos, testimonios, FAQs y textos (siempre con una **tarjeta de
  aprobación** que muestra el antes y el después).
- **No puede**: borrar nada; ver **mails ni teléfonos** de las personas; ver
  **datos de salud**, consentimientos ni comprobantes; editar imágenes, audio,
  slugs ni los textos legales; leer la casilla de correo de la organización.
- **Por qué no ve esos datos**: lo que consulta el asistente sale a un proveedor
  externo (DeepSeek). Por eso se dejaron afuera los datos personales sensibles.
- Tiene un tope de **100 mensajes por persona por día** y 60 escrituras.
- Todo lo que consulta o hace queda registrado.

## Lo que todavía no existe

- Pasarela de pago automática.
- Página `/preparacion` y los correos de preparación, integración y feedback.
- Formulario de contacto y de feedback.
- Manual Evolutivo y marca de agua.
- Chip de grupo en las FAQs.
- Cuotas, plazo del saldo y política de cancelación (ver Pagos).

## Para cualquier cosa que esta guía no cubra

El asistente dice: *"Eso no lo tengo documentado. Consultalo con Ignacio."* No
inventa. Cada pregunta sin respuesta queda registrada para sumarla a la guía.
