# Comunicaciones al viajero — orden cronológico

Fuente: **`Comunicaciones-Orden-Cronologico_1.pdf`**, que mandó Sofía el
**26/08/2026** y llegó a `~/Descargas` el 02/09. El PDF **no se guarda en el
repo** (es un export de `wkhtmltopdf`, no la fuente): el copy literal de las 14
comunicaciones está transcripto entero acá abajo, en §2. Si alguna vez hay que
volver al original, se lo pedimos a Sofía — pero no debería hacer falta.

Es la tercera vez que un documento de las clientas se pierde en `~/Descargas`
(los tres HTML de Julia, el `web-cosmic-journey-ES.md` con las FAQs y
Privacidad). **Lo que mandan se transcribe al repo el mismo día.**

Ojo con el nombre: el archivo dice "orden cronológico de la página" pero **no es
la estructura del sitio**. Es el árbol de los mails automáticos, con los caminos
alternativos que puede tomar una postulación.

---

## 1. El mapa

```
POSTULACIÓN
└─ [1] Postulación recibida
   ├── APROBADA ───────────→ [2]  Puedes avanzar
   ├── REQUIERE EVALUACIÓN → [2A] Conversemos
   └── NO APROBADA ────────→ [2B] Sobre tu postulación [FIN]

PAGO
├── PAGO TOTAL ──────→ [3]  Pago confirmado
└── RESERVA DE CUPO ─→ [3A] Cupo reservado
                       └─ [3B] Recordatorio de saldo
                          └─ [3C] Saldo completado

FORMULARIOS
└─ [4] Formularios recibidos   (si no llegan → [4A] Formularios pendientes)
   ├── APROBADO ───────────→ [5]  Bienvenido
   └── REQUIERE EVALUACIÓN → [2A] Conversemos

ANTES DE LA EXPERIENCIA
└─ [6] Comienza tu preparación
   └─ [7] Datos finales

DESPUÉS
└─ [8] Material de integración
   └─ [9] Tu mirada (feedback)

EN CUALQUIER MOMENTO
├─ [C1] Mensaje recibido
└─ [C2] Cambio o cancelación
```

**[2A] es un nudo, no una hoja**: se llega desde la revisión de la postulación y
también desde la revisión del formulario de salud, y desde ahí se vuelve a [2] o
a [2B].

---

## 2. El copy, literal

Está en tuteo, como el filtro corto y a diferencia del voseo del resto del
sitio. **Es copy de la clienta: no se reescribe sin consultar.**

### ETAPA 1 — POSTULACIÓN

#### [1] Postulación recibida
*Se envía: al completar el formulario de postulación. Automático.*
**Asunto: Recibimos tu postulación**

> Hola {nombre},
> Recibimos tu postulación. Gracias por el tiempo y la honestidad con que la completaste.
> Nuestro equipo la está revisando con calma. Pronto te llegará nuestra respuesta.
> Cualquier duda, responde este correo. Estamos conectados.

### ETAPA 2 — RESPUESTA A LA POSTULACIÓN

Tres caminos posibles. El equipo define cuál corresponde.

#### [2] Puedes avanzar
*Se envía: al aprobar la postulación.*
**Asunto: Puedes avanzar al siguiente paso**

> Hola {nombre},
> Revisamos tu postulación y nos alegra contarte que puedes avanzar.
> Ya puedes reservar formalmente tu lugar en {nombre de la experiencia}. Puedes reservar tu cupo con {monto reserva}, o pagar el total de {monto total}.
>
> {Botón: Reservar mi lugar}
> Una vez confirmado tu pago, recibirás la guía de preparación y los formularios.
> Nos alegra que estés aquí.

#### [2A] Conversemos — requiere evaluación
*Se envía: cuando la postulación necesita revisión personal antes de decidir.*
*Recomendación: envío manual o con aprobación del equipo.*
**Asunto: Sobre tu postulación — nos gustaría conversar**

> Hola {nombre},
>
> Gracias por tu postulación y por la honestidad con la que compartiste tu información.
> Antes de avanzar nos gustaría conversar contigo. Hay algunos aspectos de lo que nos contaste que preferimos mirar juntos, con calma, para entender qué cuidados necesita tu proceso.
> Esto no significa que no puedas participar. Significa que queremos hacerlo bien.
>
> Nuestro equipo se pondrá en contacto contigo. Si prefieres, puedes responder este correo y coordinamos.
> Un abrazo.

*Después de la conversación, la persona vuelve a [2] o a [2B].*

#### [2B] Solicitud no aprobada
*Se envía: cuando la participación no es apropiada.*
*Recomendación: nunca automático. Revisión del equipo antes de enviar.*
**Asunto: Sobre tu postulación**

> Hola {nombre},
>
> Gracias por tu postulación y por la honestidad con la que compartiste tu información.
> Después de revisar tu caso con cuidado, sentimos que este no es el momento adecuado para que participes. No es un juicio sobre ti ni sobre tu camino: es una decisión que tomamos desde el cuidado.
> Nuestro trabajo no reemplaza ni acompaña un tratamiento médico, psicológico o psiquiátrico, y participar sin el sostén adecuado puede no ser lo mejor para tu proceso.
>
> Esto no cierra la puerta. Si tu situación cambia, o si cuentas con el acompañamiento de un profesional que pueda sostener el proceso contigo, escríbenos y lo conversamos.
> Si quieres hablarlo, responde este correo. Estaremos disponibles.
> Te deseamos lo mejor en tu camino.

### ETAPA 3 — PAGO

Dos caminos según lo que elija la persona.

#### [3] Pago total confirmado
*Se envía: al procesarse el pago completo. Automático.*
**Asunto: Tu pago fue confirmado**

> Hola {nombre},
>
> Recibimos tu pago de {monto total}. Tu cupo en {nombre de la experiencia} está confirmado.
> Te enviamos ahora los formularios para seguir avanzando: el formulario de salud y el consentimiento informado.
> {Botón: Completar mis formularios}
>
> Junto con eso encontrarás la guía de preparación en tu espacio personal.
> Nos vemos pronto.

#### [3A] Cupo reservado — saldo pendiente
*Se envía: al procesarse el pago de reserva. Automático.*
**Asunto: Tu cupo está reservado**

> Hola {nombre},
> Recibimos tu pago de {monto pagado}. Tu cupo en {nombre de la experiencia} está reservado.
>
> Queda un saldo pendiente de {monto pendiente}, que debe estar pagado a más tardar 15 días antes de la experiencia. Puedes hacerlo desde tu espacio personal cuando quieras, de una vez o en cuotas.
> {Botón: Ver mi saldo}
> Te enviamos también los formularios para seguir avanzando: el formulario de salud y el consentimiento informado.
>
> {Botón: Completar mis formularios}
> Si necesitas conversar sobre los plazos, escríbenos con confianza.

#### [3B] Recordatorio de saldo
*Se envía: unos días antes del corte de los 15 días. Automático, solo si hay saldo.*
**Asunto: Recordatorio de tu saldo pendiente**

> Hola {nombre},
> Te escribimos para recordarte que queda un saldo pendiente de {monto pendiente} para {nombre de la experiencia}.
> La fecha límite para completarlo es el {fecha límite}. Puedes pagarlo desde tu espacio personal, de una vez o en cuotas.
>
> {Botón: Ver mi saldo}
> Si necesitas conversar sobre los plazos, escríbenos con confianza. Siempre hay manera de acomodarlo.

#### [3C] Saldo completado
*Se envía: al completarse el pago del saldo. Automático.*
**Asunto: Tu pago está completo**

> Hola {nombre},
> Recibimos el saldo de {monto pagado}. Tu inscripción en {nombre de la experiencia} está completamente pagada.
>
> Gracias por la confianza. Nos vemos pronto.

### ETAPA 4 — FORMULARIOS

#### [4] Formularios recibidos
*Se envía: al recibir el formulario de salud y el consentimiento. Automático.*
**Asunto: Recibimos tus formularios**

> Hola {nombre},
>
> Recibimos tu consentimiento y tu formulario de salud. Gracias por completarlos con cuidado.
> Nuestro equipo está revisando tu formulario de salud. Pronto te confirmaremos.
> Un abrazo.

#### [4A] Formularios pendientes
*Se envía: cuando pagó pero no completó los formularios. Automático.*
**Asunto: Te faltan unos pasos para completar tu inscripción**

> Hola {nombre},
> Tu cupo en {nombre de la experiencia} está reservado, pero aún no recibimos tus formularios.
> Para poder confirmar tu participación necesitamos el formulario de salud y el consentimiento informado completos.
> {Botón: Completar mis formularios}
> Si tuviste algún problema para completarlos o quieres conversar algo antes, escríbenos.

### ETAPA 5 — APROBACIÓN FINAL

#### [5] Bienvenido
*Se envía: al aprobar el formulario de salud.*
**Asunto: ¡Bienvenido a Cosmic Eagle!**

> Hola {nombre},
> Tu formulario de salud fue aprobado. Estás en condiciones de participar en {nombre de la experiencia}.
> En tu espacio personal encontrarás la guía de preparación, los datos de ubicación y traslados, qué llevar y los recursos digitales.
> {Botón: Acceder a mi espacio}
> Comienza tu preparación con tiempo y sin apuro. Lo que ocurre antes de llegar ya es parte de la experiencia.
> Nos vemos pronto.

*Si el formulario de salud revela algo que requiere revisión, se envía [2A] en lugar de este.*

### ETAPA 6 — ANTES DE LA EXPERIENCIA

#### [6] Comienza tu preparación
*Se envía: al comenzar el período de preparación. Automático.*
**Asunto: Falta poco — comienza tu preparación**

> Hola {nombre},
>
> Faltan {X} días para {nombre de la experiencia}. Es momento de comenzar la preparación.
> Estos días te recomendamos alimentación limpia y liviana, descanso, buena hidratación, evitar el alcohol y otras sustancias, y reducir el ruido: menos pantallas, más espacio interior.
> {Botón: Revisar mi preparación}
> Cualquier duda antes de llegar, escríbenos. Te esperamos.

#### [7] Datos finales
*Se envía: en los días previos. Automático.*
**Asunto: Todo lo que necesitas saber para tu llegada**

> Hola {nombre},
> Ya estamos cerca. Acá van los datos para tu llegada a {nombre de la experiencia}.
> Dónde: {dirección}
> Cuándo: {fecha y hora}
> Qué llevar: {lista}
>
> {Botón: Ver todos los detalles}
> Si tienes cualquier duda antes de llegar, escríbenos.
> Te esperamos.

### ETAPA 7 — DESPUÉS DE LA EXPERIENCIA

#### [8] Material de integración
*Se envía: en los días posteriores. Automático.*
**Asunto: Para los días que vienen**

> Hola {nombre},
> Gracias por haber estado. Por lo que trajiste, por lo que soltaste, por cómo habitaste este espacio.
> Los días que vienen son parte del proceso. La integración es donde lo vivido se asienta y encuentra su lugar en tu vida cotidiana.
> Te recomendamos descanso, introspección y espacio sin apuro.
>
> En tu espacio personal está la guía de integración y los recursos que preparamos para acompañarte.
> {Botón: Acceder al material de integración}
> Si necesitas conversar algo de lo vivido, escríbenos. Seguimos aquí.
>
> Un abrazo grande.

#### [9] Tu mirada — feedback de la experiencia
*Se envía: unos días después de [8], cuando la integración ya comenzó a asentarse. Automático.*
**Asunto: Nos gustaría escucharte**

> Hola {nombre},
>
> Ahora que han pasado unos días, nos gustaría escuchar tu mirada sobre lo vivido.
> Lo que nos cuentes nos ayuda a cuidar mejor este espacio y a quienes vengan después. Son pocas preguntas y puedes responderlas con la extensión que quieras.
> {Botón: Compartir mi experiencia}
> Si prefieres contárnoslo por escrito o conversarlo, responde este correo. También nos sirve, y mucho.
> Gracias por tu honestidad.

**Preguntas sugeridas para el formulario:**

1. ¿Cómo describirías lo que viviste?
2. ¿Qué fue lo que más te acompañó durante la experiencia?
3. ¿Hubo algo que echaste de menos, o que haríamos mejor?
4. ¿Cómo te sentiste con la preparación previa y con el material de integración?
5. ¿Hay algo que quieras compartir con nosotros que no te hayamos preguntado?
6. ¿Nos autorizas a compartir parte de lo que escribiste como testimonio? (Sí / Sí, pero de forma anónima / No)

> Nota de Sofía: la pregunta 6 es importante. La sección de Testimonios de la web
> necesita material, y este es el momento natural para pedir esa autorización. La
> política de privacidad ya compromete no publicar nada sin consentimiento previo.

**Es la fuente de la tabla `testimonials`**, que hoy tiene sembrados los tres de
`home` y los otros dos juegos vacíos esperando contenido.

### EN CUALQUIER MOMENTO

#### [C1] Mensaje recibido
*Se envía: al completar el formulario de contacto. Automático.*
**Asunto: Recibimos tu mensaje**

> Hola {nombre},
> Recibimos tu mensaje y ya está en manos de nuestro equipo. Pronto estaremos en contacto contigo.
> Gracias por escribirnos. Estamos aquí para acompañarte.

#### [C2] Cambio o cancelación
*Se envía: solo cuando ocurre. Nunca automático — el motivo lo redacta el equipo en cada caso.*
**Asunto: Un cambio en {nombre de la experiencia}**

> Hola {nombre},
> Te escribimos para contarte que {nombre de la experiencia} {no podrá realizarse en la fecha prevista / cambió de fecha}.
> {Motivo, redactado por el equipo.}
> {Nueva fecha, si corresponde.}
> Nuestro equipo se pondrá en contacto contigo para ver las alternativas y resolverlo de la mejor manera posible.
>
> Lamentamos el cambio y agradecemos tu comprensión. Cualquier cosa, responde este correo.

---

## 3. Reglas generales

**Firma de todos los correos:**

> Con cariño,
> Equipo Cosmic Eagle
> Un viaje hacia el Humano Luminoso.

- **Nunca se comprometen plazos de respuesta.** Todos dicen "pronto te llegará
  nuestra respuesta" o similar. No se menciona cantidad de días. *(Nuestro
  `SolicitudRecibida` actual hay que revisarlo contra esta regla.)*
- **No se incluyen ciudad ni fechas** de inicio/término en los correos de
  postulación y pago, porque las Sesiones son de un día y los Viajes de una
  semana. Los datos específicos van todos en [7].
- **[2A], [2B] y [C2] no salen automáticos.** Requieren revisión del equipo. El
  resto puede automatizarse por completo.

**Variables del sistema:** `{nombre}` · `{nombre de la experiencia}` ·
`{monto total}` · `{monto reserva}` · `{monto pagado}` · `{monto pendiente}` ·
`{fecha límite}` · `{X días}` · `{dirección}` · `{fecha y hora}` · `{lista}`

Cuatro de esas variables (`{dirección}`, `{fecha y hora}`, `{lista}`,
`{monto reserva}`) **no existen como campo de `trips`** — son parte de los campos
nuevos que ya pedía el boceto de estructura y siguen pendientes (ver la sesión
del 15/08 en `CLAUDE.md`, punto 1 de "lo próximo").

---

## 4. Cruce contra lo implementado

Tenemos **4 de 14**, y son justo las que ella marca como automatizables sin
discusión. Ver `docs/EMAIL.md` (Resend) y `docs/NOTIFICACIONES.md` (la casilla
interna, que es el otro canal y no se confunde con este).

| # | Comunicación | Estado |
|---|---|---|
| [1] | Postulación recibida | ✅ `SolicitudRecibida`, disparado en `submitApplication` |
| [2] | Puedes avanzar | ✅ `SolicitudAprobada`, en la transición a `approved` |
| [2A] | Conversemos | ✅ `SolicitudConversemos`, estado `needs_conversation` (02/09) |
| [2B] | No aprobada | ✅ `SolicitudRechazada` |
| [3] | Pago confirmado | ✅ `PagoRegistrado`, cuando Estela marca el pago |
| [3A] | Cupo reservado | ❌ no existe el modelo de seña |
| [3B] | Recordatorio de saldo | ❌ ídem + no hay envíos programados |
| [3C] | Saldo completado | ❌ ídem |
| [4] | Formularios recibidos | ❌ falta el consentimiento |
| [4A] | Formularios pendientes | ❌ ídem + no hay envíos programados |
| [5] | Bienvenido | ❌ no existe "formulario de salud aprobado" |
| [6] | Comienza tu preparación | ❌ no hay envíos programados ni `/preparacion` |
| [7] | Datos finales | ❌ ídem + faltan los campos de `trips` |
| [8] | Material de integración | ❌ ídem + no hay material de integración |
| [9] | Tu mirada | ❌ ídem + no hay formulario de feedback |

Lo que falta **no es escribir diez templates**. Son cinco piezas de sistema:

1. ~~**Un tercer resultado de revisión: "conversemos".**~~ **HECHO el 02/09**,
   ver §6.
2. **Seña + saldo.** `payment_status` es `pending | paid | waived`, un booleano
   con excepción. El documento pide reserva, saldo, pago en cuotas y una fecha de
   corte a 15 días. **Contradice lo que quedó decidido el 01/09** en
   `docs/PAGOS.md` §7 ("por Encuadrado se cobra el total, la seña sigue siendo
   transferencia con comprobante") — por eso está preguntado, ver
   `docs/consulta-sofia-pagos.txt`. **Bloqueante de [3], [3A], [3B] y [3C].**
3. **Consentimiento informado + aprobación del formulario de salud.** La tabla
   `consents` existe desde el schema original y sigue sin UI, y los textos legales
   son de la clienta. Sin eso no hay [4] ni [5]. El estado "salud aprobada"
   tampoco existe: hoy la etapa 2 se completa y no hay nada que revisar
   formalmente después.
4. **Envíos programados por fecha del viaje** ([3B], [4A], [6], [7], [8], [9]).
   No hay ningún cron de mails: `vercel.json` sólo tiene el keep-alive diario.
   Lo natural es colgar un segundo cron del mismo mecanismo, con una tabla de
   envíos para no remandar (mismo criterio que `reviewApplication`, que relee el
   estado anterior).
5. **Formulario de contacto** ([C1]) y **formulario de feedback** ([9]), que hoy
   no existen como ruta.

### Choques con decisiones ya tomadas

- **El pago va antes de los formularios**, y eso ya lo implementamos: es la
  inscripción en dos etapas del 19/08 (`docs/FLUJO_INSCRIPCION.md`). El documento
  lo confirma, no lo contradice.
- **[3] y [3A] mandan los formularios y el consentimiento juntos.** Nuestra etapa
  2 hoy es sólo el formulario de salud; el consentimiento quedaría en la misma
  pantalla.
- **"Tu espacio personal"** aparece en seis de los catorce correos (saldo,
  formularios, preparación, integración). Hoy `/cuenta` muestra perfil +
  solicitudes; todo lo demás de esa lista no existe. **`/cuenta` es la ruta más
  cargada de deuda de este documento y no fue rediseñada por Julia.**

---

## 5. Pendientes de definir

Los seis que ella misma deja al pie, con su sugerencia:

| # | Pregunta | Sugerencia de Sofía |
|---|---|---|
| 1 | Cuántos días antes va [6] preparación | 10 para Sesiones (prep. de 5 días), 14 para Viajes (prep. de una semana) |
| 2 | Cuántos días antes va [7] datos finales | 3 a 5 |
| 3 | Cuántos días después va [8] integración | 1 a 2 |
| 3b | Cuántos días después va [9] feedback | 7 a 10 |
| 4 | Cuándo va [3B] recordatorio de saldo | 25 y 18 días antes (margen antes del corte de 15) |
| 5 | Cuándo va [4A] formularios pendientes, y si se repite | — sin sugerencia |
| 6 | Idioma de los envíos | — |

Sobre el 6: **el documento dice "la web está en inglés y estos textos en
español". Es falso** — la web está enteramente en español y el i18n ES/EN sigue
sin hacerse (punto 3 de "lo que sigue" en `CLAUDE.md`). Hay que corregirlo antes
de que planifiquen sobre ese supuesto. Cuando exista el i18n, el idioma del mail
sale del idioma de la cuenta, no del texto.

Los 1 a 5 son elecciones de ella y alcanza con que confirme la sugerencia; **no
bloquean nada hasta que exista el cron**, así que se preguntan junto con el resto.


---

## 6. [2A] "Conversemos", implementado (02/09)

Migraciones `20260902160000_application_status_conversation.sql` y
`20260902160100_conversation_keeps_slot.sql`.

Es el primer paso del documento que se construyó, y se eligió por barato: no
inventa flujo, le pone nombre a algo que el sistema ya sabía. El trigger
`private.notify_new_application` levantaba un aviso interno cuando el filtro
corto traía banderas de salud (enfermedad grave, tratamiento, medicación), pero
ese aviso **moría en el panel**: la revisión sólo tenía dos salidas, y la persona
del otro lado quedaba en "en revisión" sin enterarse de nada. Ahora ese mismo
hecho es un estado visible para las dos partes.

- **`needs_conversation` va segundo en el enum**, entre `pending_review` y
  `approved`, que es su lugar en el recorrido.
- **Dos migraciones y no una.** `alter type ... add value` no se puede *usar* en
  la misma transacción en la que se agrega, y cada migración corre en una. El
  índice que lo usa va aparte. Mismo caso que `payment_proof` en
  `admin_notification_kind` (01/09).
- **El índice parcial de "una sola solicitud viva por viaje" tuvo que
  ampliarse.** Sin eso, `needs_conversation` caía fuera del índice y la persona
  podía mandar una segunda solicitud al mismo viaje mientras la conversación
  estaba abierta — se duplicaría justo el caso en el que hay algo delicado que
  mirar. Un rechazo y un vencimiento siguen fuera a propósito: esos sí liberan el
  cupo.
- **La etapa 2 sigue cerrada**: `private.owns_approved_application` exige
  `approved`, así que "conversemos" no abre el formulario de salud. Verificado.
- **Es el único correo del flujo sin botón.** El paso siguiente es humano:
  contesta Estela por privado. Y **no dice qué hay que conversar** — lo que
  dispara el estado suele ser un dato de salud, y detallarlo en un mail es
  mandar información médica por un canal que después no controlamos. Mismo
  criterio que `SolicitudRechazada`.
- **No es un estado terminal.** Después de hablar, Estela mueve la solicitud a
  aprobada o rechazada desde el mismo panel, y ese segundo movimiento dispara el
  mail que corresponda. Los tres avisos salen sólo en la transición, así que un
  ida y vuelta no remanda nada.
- En el CRM, una conversación abierta **sigue contando como "solicitante"**, no
  como "potencial".
- El aviso rojo de "requiere revisión manual" del detalle ahora dice que
  «Conversemos» existe. Antes ese aviso no ofrecía ningún camino intermedio.

Verificado: `tsc`, lint, build de producción, y sobre la base real — insert en
`needs_conversation`, segunda solicitud al mismo viaje rechazada por el índice,
la vista `my_applications` devolviéndole el estado al postulante mientras la
tabla base le sigue dando cero filas, la etapa 2 cerrada en `needs_conversation`
y abierta al aprobar, y el trigger escribiendo su aviso. Filas de prueba
borradas (la base volvió a cero). Advisors sin novedades.

**Sin verificar end-to-end** (requiere sesión de admin, la hace Ignacio): apretar
«Conversemos» en el panel y ver la pantalla del postulante. **El correo no sale
todavía**: sigue faltando verificar el dominio en Resend (`docs/EMAIL.md`). Hasta
entonces el "no salió" queda registrado en la casilla de avisos, no en los logs.
