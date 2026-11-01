# Asistente de IA del panel (`/admin/ia`)

> Rama `ia`. Objetivo del proyecto: que un agente dentro de la plataforma pueda
> operar el sistema completo (viajes y sesiones, solicitudes, textos, banners,
> correos). La organización está armando la API de WhatsApp; el chat interno es
> la primera superficie y el mismo motor servirá para WhatsApp. **Etapa 1
> (28/10): solo consulta.** Las escrituras llegan en la etapa 2.

## Cómo está armado

```
/admin/ia  (ChatInterface, useChat)
   └─ POST /api/ia/chat          ← verifica sesión + is_admin en el SERVIDOR
        └─ ToolLoopAgent (AI SDK v7, deepseek-flash, máx. 8 pasos)
             └─ herramientas de lectura (src/lib/ia/tools.ts)
                  └─ cliente Supabase de LA SESIÓN del admin (RLS)
                  └─ cada llamada → ai_agent_log
```

- **Motor:** `ai@7` + `@ai-sdk/deepseek@3`, modelo **`deepseek-flash`**. Los alias
  `deepseek-chat` / `deepseek-reasoner` se retiraron el 24/07/2026: no usarlos.
  Es un modelo que **razona**: el razonamiento llega como parte `reasoning` y la UI
  no lo muestra. Con herramientas, el SDK reenvía el razonamiento al siguiente
  paso solo (DeepSeek devuelve 400 si falta).
- **El agente se arma por request**, nunca como singleton: lleva el cliente y el
  `user_id` de quien habla.
- **El rol sale de la sesión**, no de un header ni del body
  (`permiso-por-header-falsificable` en brain-data).
- Variable de entorno: `DEEPSEEK_API_KEY` (en `.env.local` y, para producción,
  en Vercel → Production). Sin ella el endpoint responde 503.

## Qué datos ve el modelo (decisión del 28/10)

Lo que devuelve una herramienta **sale a DeepSeek**, un tercero. Por eso:

- **Ve nombres. No ve mails ni teléfonos.**
- **Nada de salud:** ni el filtro médico de `applications` (`serious_illness`,
  `current_medication`, `mental_health_treatment` y sus detalles), ni los
  comentarios libres, ni el formulario de salud, el consentimiento o los
  comprobantes.
- Cada herramienta lista sus columnas **a mano**; nunca `select("*")`. Una columna
  nueva en esas tablas no entra sola.
- Topes: 25 filas por respuesta, textos recortados.

## Herramientas de la etapa 1

| Herramienta | Qué devuelve |
|---|---|
| `listar_viajes` | retiros y sesiones: fechas, USD, cupo, solicitudes por estado, lugares libres. Por defecto solo próximos; `cuando: pasados` para la historia |
| `listar_solicitudes` | nombre, país, estado, pago y evento (filtros por estado, pago, viaje, nombre, `tipo` retiro/sesión y `cuando`) |
| `consultar_crm` | segmentos del CRM (estado, nivel de experiencia, país, género, evento) con conteos del segmento completo; sin mails |
| `ver_participante` | ficha de una persona + historial de reservas (qué retiros y sesiones, cuáles ya pasaron, si asistió) |
| `listar_textos_sitio` | clave, grupo y valor actual de los textos editables (para encontrar la clave antes de cambiarlos) |
| `listar_avisos` | la campanita: solicitudes nuevas, comprobantes, correos que fallaron |

## Fechas y tipo de evento (30/10)

- `momento()` en `tools.ts` calcula `ya sucedió` / `en curso` / `próximo` contra
  la fecha de **Buenos Aires** (`trips.start_date`/`end_date` son `date`, sin
  hora) y marca `estado_desactualizado` si un evento pasado sigue `open`/`closed`
  (hoy hay un retiro así). En un evento pasado `lugares_libres` es `null`.
- Antes `listar_viajes` ordenaba por fecha ascendente con tope de 25: la historia
  tapaba lo que viene. Ahora el default es `proximos`.
- Cada resultado trae `tipo_nombre` (Retiro / Sesión). No existe la entidad
  "invitado": una solicitud es la reserva de una persona en **un** evento.
- `ver_participante` expone país, género, profesión, experiencia previa,
  prácticas espirituales y cómo nos conoció, **sin** mail, teléfono ni salud.
  `asistio` = aprobada + evento pasado + pago distinto de `pending`.

**Cierre automático:** `/api/cron/cerrar-eventos` (13:30 UTC, exige `CRON_SECRET`)
pasa a `completed` lo `open`/`closed` cuya `end_date` ya pasó. Un evento que
termina hoy se cierra mañana.

## Totales, resumen y tope de uso (01/11)

- **`total` real.** `listar_viajes` y `listar_solicitudes` usan `count: "exact"` y
  devuelven `total` + `aviso` cuando el tope de 25 corta la lista. Antes el modelo
  podía tomar "25 filas" por "25 en total".
- **`resumen`**: ocupación, solicitudes y pagos por estado y cobrado en USD, ya
  calculado (sin nombres). El prompt le prohíbe sumar o contar filas a mano.
- **Tope diario:** 100 mensajes por persona y por día de Buenos Aires
  (`IA_DAILY_LIMIT` lo cambia sin tocar código) y 4000 caracteres por mensaje.
  Responde 429 / 413.
- **Uso en el log:** `kind='message'` al empezar el turno (un turno abortado
  igual cuenta) y `kind='usage'` al terminar, con `input_tokens` y
  `output_tokens` (migración `20261101160000`). Medida inicial: una consulta
  simple con dos herramientas gastó ~8.300 tokens de entrada.

## Voz y correo al equipo (01/11)

- **Dictado gratis:** botón de micrófono en el chat (Web Speech API del navegador,
  `es-AR`). El texto cae en el cuadro y **no se envía solo**: se revisa antes,
  sobre todo los nombres propios. Chrome manda el audio a Google para
  transcribirlo; en Firefox no existe y el botón no aparece.
- **`enviar_correo_equipo`** (primera herramienta de escritura): correo interno
  por Resend (`AvisoInterno`) a una persona del equipo o a todos. El destinatario
  sale de `profiles.is_admin` en el servidor: el modelo no ve ni escribe
  direcciones, y no puede escribirle a un viajero. **Exige aprobación**: el chat
  muestra el borrador completo con "Aprobar y enviar" / "Rechazar"
  (`toolApproval: 'user-approval'`) y el pedido va firmado
  (`experimental_toolApprovalSecret`, derivado de la llave de servicio salvo que
  exista `TOOL_APPROVAL_SECRET`). Tope de 20 correos por persona y día; cada envío
  queda en `ai_agent_log` (`kind='write'`).
- Hoy hay **una sola cuenta admin** (sin nombre cargado), así que "todos" o
  cualquier nombre llegan a esa cuenta. Cuando Estela y Sofía tengan cuenta de
  admin con nombre, se las puede nombrar.
- El e2e prueba el camino de rechazo. **El de aprobar (envío real por Resend) todavía
  no se probó**: falta hacerlo una vez a mano desde `/admin/ia`.

## Burbuja del asistente en todo el panel (01/11)

- **`AssistantBubble`** (`src/app/(sistema)/admin/AssistantBubble.tsx`) vive en el
  layout del admin: botón flotante en todas las pantallas menos `/admin/ia`. Misma
  `ChatInterface` en `variant="bubble"`.
- **La charla sobrevive a la navegación** (el layout no se desmonta) y cerrada
  no se desmonta: si contesta con la ventana cerrada, aparece un punto en el botón.
- **Sabe dónde estás:** el cliente manda `pagina` (la ruta) y el servidor la limpia
  con `cleanPagina` (solo `/admin…`, sin query). `src/lib/ia/panel-guide.ts` trae
  el mapa del panel (qué hace cada sección y cómo se usa) y, de la pantalla actual,
  el detalle. **Si una pantalla cambia, se actualiza esa guía**: es lo que evita
  que el asistente invente botones. Lo que no está en la guía, lo dice.
- **Sugerencias por pantalla** (en `AssistantBubble.tsx`), "Nueva conversación"
  y mensajes de error del servidor tal cual (tope diario, mensaje largo).
- **Responsive:** hoja a pantalla completa en celular, ventana abajo a la derecha
  en escritorio. Esc la cierra y devuelve el foco al botón. Solo transiciones CSS
  (`motion-reduce`), sin cambiar el árbol.
- e2e: `e2e/ia.panel.spec.ts` (abre, sabe la pantalla, responde, Esc, no aparece
  en `/admin/ia`).

## Búsqueda de nombres tolerante (01/11)

`src/lib/ia/names.ts`: normaliza (sin acentos ni mayúsculas) y tolera un error de
tipeo en palabras largas ("Sofia" = "Sofía", "Estella" = "Estela", "Maria Jose" =
"María José"). Todas las palabras buscadas tienen que aparecer, en cualquier
orden. Lo usan `listar_solicitudes`, `ver_participante` (por nombre), `listar_viajes`
(por título: hay "Sabado" con y sin tilde), `consultar_crm` (país) y
`listar_textos_sitio`. Compara en memoria sobre `id, user_id, full_name` (tope
5000 filas): alcanza para cientos de personas; si la base crece, el paso
siguiente es `unaccent` + `pg_trgm` en Postgres. Se verificó con un script suelto
(no hay runner de tests unitarios en el repo) y que las herramientas corren sin
error; **falta probarlo con personas reales**, hoy no hay solicitudes cargadas.

## Historial, más lectura, crear viajes y artículos (01/11)

- **Conversaciones guardadas** (`ai_conversations`, migración `20261101180000`):
  el servidor guarda la charla completa al terminar cada turno (`onFinish`);
  cada admin ve **solo las suyas** (RLS). El botón **Historial** las lista (lectura
  directa desde el browser, con RLS), las retoma tal cual quedaron y las borra.
  No hay borrado automático por antigüedad.
- **Lectura nueva** (`tools-extra.ts`): artículos, FAQs, testimonios, correos
  programados enviados, códigos de acceso, material, suscriptores (solo conteo) y
  medios de cobro. **No salen del servidor** (a propósito, el modelo es un
  tercero): el valor de los códigos, el token de los links de material, el cuerpo
  de artículos y material, los correos de los suscriptores y los datos de cuenta.
- **Escritura con aprobación** (`write-tools.ts`), todas con `toolApproval` y
  firma: `crear_viaje` (siempre **borrador**, rechaza duplicados por tipo + fechas
  + ciudad) y `crear_articulo` (borrador salvo que pidan publicar; el texto lo
  pone la persona, el modelo no escribe contenido de la organización).
  Las reglas de validación **son las del panel**: se extrajeron a
  `src/lib/trip-form.ts` y `src/lib/article-form.ts`, y `experiencias/actions.ts`
  y `contenidos/actions.ts` las importan. Una regla nueva se escribe una vez.
  No cargan portada, galería, audio ni programa: eso se completa en el panel
  (la herramienta devuelve `editar_en`).
- **Interfaz** (`ChatParts.tsx`): tablas, botón Copiar, rastro con los filtros
  usados ("Consultó solicitudes (estado: pending_review)"), tarjetas de aprobación
  por herramienta (con aviso de "borrador" o "se publica ya") y cuadro que crece.
- **Pendiente:** `crear_usuario` (decisión abierta: ver abajo) y edición de lo
  existente. e2e: `ia.panel.spec.ts` (historial y rechazo de `crear_viaje`);
  el camino de aprobar se probó a mano creando y borrando un viaje y un artículo.
- Dos tests viejos de `panel.panel.spec.ts` fallan desde antes: esperan un título
  "Viajes" (hoy "Retiros") y 13 secciones en el menú (hay 15).

## Testimonios (01/11)

Antes el asistente solo veía los primeros 160 caracteres de cada testimonio (un
recorte mío para no gastar tokens), así que no podía copiarlos a artículos ni
cargar nuevos. Ahora:

- `listar_testimonios` trae la cita completa (≤ 250 caracteres, el largo de la
  tarjeta) y avisa si hay relato completo y de cuántos caracteres.
- `ver_testimonio(id)`: cita + relato completo, bajo demanda.
- `crear_articulos_desde_testimonios(ids)`: **el servidor copia el texto completo**
  (relato o cita) a Contenidos, categoría Testimonios, **borrador**; el modelo no
  lee ni reescribe nada. Saltea títulos que ya existen. La tarjeta de aprobación
  lista **quiénes** se copian, calculado en el servidor (`toolApproval` con
  `reason`), no los ids que puso el modelo.
- `crear_testimonio`: borrador, con la validación del panel
  (`src/lib/testimonial-form.ts`, compartida).
- Dato real: de los 27 testimonios, 11 son de home y 11 de viajes (mismo largo
  medio: posiblemente los mismos textos) y 5 de sesiones con relato de hasta 6.178
  caracteres; **esos 5 ya están publicados en Contenidos**.

## Editar y publicar (01/11)

`src/lib/ia/edit-tools.ts`. **Editar sí, publicar sí, borrar no** (no existe ningún
delete en el asistente).

- `editar_viaje`, `editar_articulo`, `editar_testimonio`, `editar_faq`,
  `cambiar_texto_sitio`. Todas con `toolApproval` firmado.
- **La tarjeta muestra el antes → después calculado en el servidor**
  (`buildEditApprovals`: lee el valor actual de la base y compara), con
  "⚠ SE PUBLICA" / "Se OCULTA" arriba. Si el objeto no existe o no hay cambios,
  deniega sin molestar.
- **Publicar es un campo**: `estado` (`open` abre inscripciones y se ve; `published`
  en artículos) o `publicado`/`publicada`. El prompt exige que la persona lo pida
  de forma explícita.
- **Solo cambia lo que se manda** (update parcial): no pisa programa, galería,
  habitaciones ni versiones en inglés (que no se tocan y se avisa). Aplica las
  reglas del panel sobre los valores combinados (fin ≥ inicio, seña < precio, cupo
  ≥ reservas aprobadas).
- No edita imágenes, audio, HTML subido (se sube otro archivo), slugs ni los
  legales (copia literal de la clienta).
- `cambiar_texto_sitio` usa `revalidateTag(SITE_CONTENT_TAG, { expire: 0 })`:
  `updateTag` solo existe en Server Actions y esto corre en un Route Handler.
- Tope de 60 escrituras por persona y día, registradas en `ai_agent_log`.
- Probado: la cita de un testimonio se editó y guardó con aprobación; publicar se
  mostró como "SE PUBLICA" y, rechazado, no publicó. **El camino de publicar con
  aprobación real no se ejecutó** para no tocar el sitio en vivo.

## Auditoría

`ai_agent_log` (migración `20261028160000`): una fila por llamada a herramienta
(`kind`, `tool`, `args`, `rows_returned`, `error`, `user_id`, `conversation_id`).
Solo admin la lee; el panel no puede editarla ni borrarla. Es el registro de lo
que el modelo vio y, desde la etapa 2, de lo que hizo.

## Etapa 2 (pendiente): escrituras con confirmación

Diseño, tomado del agente de RRHH de `contexto-investment` y del `dental-saas`:

- **Operaciones con nombre, no escritura libre de tablas** (`crear_viaje`,
  `aprobar_solicitud`, `cambiar_texto`…): llaman a las **mismas funciones** que el
  panel, para que IA y panel no puedan divergir y se disparen los efectos
  (correos, habilitaciones).
- `toolApproval: 'user-approval'` del AI SDK + **`experimental_toolApprovalSecret`**
  (el historial viaja del cliente: sin firma, un cliente puede fabricar una
  aprobación).
- Cada operación declara su **inversa** para deshacer; el log guarda los argumentos.
- Todo lo que le llegue a un viajero (correos) exige confirmación humana siempre.
- Subir banners: la imagen entra por la UI (no por el modelo: DeepSeek no ve
  imágenes) y se comprime en el browser como hoy.

## Verificación

`e2e/ia.panel.spec.ts` (proyecto `panel`): el endpoint da 401 sin sesión, y el
chat contesta con datos reales usando la herramienta. Llama a DeepSeek de verdad.
Ojo de Playwright: `playwright.request.newContext()` **hereda** el `storageState`
del proyecto; para probar "sin sesión" hay que pasarle uno vacío.
