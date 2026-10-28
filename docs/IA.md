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
| `listar_viajes` | viajes y sesiones: fechas, USD, cupo, solicitudes por estado, lugares libres |
| `listar_solicitudes` | nombre, país, estado, pago y viaje (filtros por estado, pago, viaje, nombre) |
| `listar_textos_sitio` | clave, grupo y valor actual de los textos editables (para encontrar la clave antes de cambiarlos) |
| `listar_avisos` | la campanita: solicitudes nuevas, comprobantes, correos que fallaron |

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
