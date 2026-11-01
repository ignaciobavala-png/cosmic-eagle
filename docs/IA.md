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
