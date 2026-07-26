# Cosmic Eagle Journey — Contexto del proyecto

> Documento de referencia para desarrollo (humano o agente de IA). Vive en `/docs/CONTEXT.md`. Actualizar cada vez que cambie una decisión de alcance o modelo de datos.

## 1. Resumen

Plataforma web para Cosmic Eagle Journey (viajes de ceremonias ancestrales chamánicas). Reemplaza el flujo actual basado en Google Forms + gestión manual por una plataforma con:

- Sitio público
- Panel de administración
- Panel de usuario (viajero aprobado)
- Calendario de viajes con cupos
- Formulario de solicitud con datos de salud → flujo de aprobación/rechazo
- Consentimiento informado
- Comunicación jerárquica (admin → usuarios) y, a definir, entre usuarios

Cliente: Estela (Cosmic Eagle Journey). Contacto de desarrollo: Ignacio Bavala.

## 2. Stack técnico (definido en la propuesta aprobada)

- **Frontend:** Next.js
- **Backend / DB:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Estilos:** Tailwind CSS
- **Idiomas:** ES / EN (i18n)
- **Extra:** Chatbot con IA
- **Roles base definidos en la propuesta:** Administrador, Cliente

## 3. Roles y flujo de usuario (estado actual)

| Rol | Definido en propuesta | Pendiente de confirmar |
|---|---|---|
| Administrador | Sí | Cuántos admins, permisos diferenciados (ver Word: sección 7.8) |
| Cliente / Viajero | Sí (acceso directo) | Si convive con flujo de aprobación manual antes de habilitar el acceso |
| Solicitante (pre-aprobación) | No | Estado intermedio: envía formulario → espera revisión → aprobado/rechazado |

**Decidido (2026-07-25):** el flujo es de **aprobación manual previa obligatoria** basada en datos de salud, no inscripción directa. Al ser viajes de turismo que exigen revisión de medicación, no puede haber acceso directo sin revisión de un admin.

## 4. Modelo de datos actual (relevado de los formularios en uso)

Estela usa actualmente 3 formularios distintos de Google Forms. Estructura real, para mapear a tablas de Supabase:

### 4.1 Solicitud — viajero primerizo ("Formulario de Salud Cosmic Eagle", ES)

Formulario largo, único punto de entrada para quien nunca hizo una ceremonia con ella.

| Campo | Tipo sugerido | Notas |
|---|---|---|
| Nombre y Apellido | text | obligatorio |
| Edad | number | obligatorio |
| Estatura | text/number | obligatorio |
| Peso | text/number | obligatorio |
| País de origen | text | obligatorio |
| Email | email | obligatorio |
| Teléfono | text | obligatorio |
| Ocupación | text | obligatorio |
| ¿Condición de salud relevante / tratamiento médico o psiquiátrico actual? | boolean | obligatorio — **campo de decisión** |
| Detalle de condición/medicación (condicional si Sí) | textarea | — |
| ¿Estrés, angustia o ansiedad actual? | boolean | obligatorio |
| Detalle (condicional) | textarea | — |
| ¿Trauma importante en su vida? | boolean | obligatorio |
| Detalle + si hizo terapia (condicional) | textarea | — |
| ¿Consume alguna droga o sustancia actualmente? | boolean | obligatorio — **campo de decisión** |
| Detalle: tipo y cantidad (condicional) | textarea | — |
| ¿Reacciones alérgicas a medicamentos/sustancias? | boolean | — |
| Detalle (condicional) | textarea | — |
| ¿Práctica energética o espiritual? | boolean | — |
| Detalle (condicional) | textarea | — |
| ¿Primera experiencia con plantas de poder? | boolean | — |
| Detalle de plantas previas (condicional si No) | textarea | — |
| ¿Tiene temas específicos a trabajar o busca expansión de conciencia? | boolean | obligatorio |
| Detalle de temas (condicional) | textarea | — |
| ¿Miedos o dudas sobre la experiencia? | boolean | — |
| Detalle (condicional) | textarea | — |
| Comentario libre / propósito de la ceremonia | textarea | opcional |

### 4.2 Solicitud — viajero recurrente ("Viajer@s" ES / "Travelers" EN)

Formulario corto. Se usa cuando la persona ya tiene ceremonias previas con Estela — no repite datos base (edad, peso, alergias, etc.), solo actualiza salud reciente e intención.

| Campo | Tipo sugerido | Notas |
|---|---|---|
| Nombre y Apellido | text | — |
| Email | email | — |
| Fecha de la próxima ceremonia | date | — |
| ¿Comenzó tratamiento médico/psiquiátrico desde la última ceremonia? | boolean | **campo de decisión** |
| Detalle (condicional) | textarea | — |
| ¿Estrés, angustia o ansiedad actual? | boolean | — |
| Detalle (condicional) | textarea | — |
| Tema a abordar en esta ceremonia | textarea | obligatorio |
| Propósito / situación personal | textarea | obligatorio |
| Cantidad de ceremonias previas con Estela | number | obligatorio |

**Implicancia de diseño:** el sistema necesita distinguir entre "usuario nuevo" y "usuario recurrente" para mostrar el formulario correcto, y debería poder pre-cargar los datos base del formulario largo si la persona ya está en el sistema.

### 4.3 Consentimiento informado (ES / EN — mismo contenido, dos idiomas)

Se completa **después** del formulario de salud (el propio formulario lo exige como una de las confirmaciones). No es un formulario de datos, es una aceptación de términos + firma.

Estructura:
- Fecha
- Texto fijo con 5 bloques informativos: Viaje, Facilitador, Experiencia, Consideraciones, Confidencialidad (contenido legal/descriptivo, no cambia por usuario — se puede guardar como texto estático versionado, no por campo)
- Checkbox múltiple obligatorio con 4 confirmaciones:
  - Leyó y comprendió los términos
  - Participa voluntariamente y tiene capacidad legal
  - Pudo hacer preguntas y se siente informado/a
  - Completó el formulario de salud obligatorio
- Firma digital: nombre completo tipeado como firma

**Regla de negocio:** el consentimiento depende de que el formulario de salud ya esté completo (una de las propias confirmaciones lo verifica). El sistema debería bloquear el acceso al consentimiento si no hay un formulario de salud asociado al usuario para ese viaje.

## 5. Reglas de negocio detectadas (a validar con la clienta)

1. Hay campos que funcionan como **gatillo de revisión manual obligatoria**: tratamiento médico/psiquiátrico actual, consumo de sustancias, trauma importante. Estos no deberían auto-aprobar nunca.
2. El formulario de salud y el consentimiento son **dos pasos separados y secuenciales**, no uno solo.
3. Existen dos variantes de formulario de solicitud (primerizo / recurrente) — la plataforma necesita lógica para elegir cuál mostrar.
4. Los formularios están vinculados a **un viaje/ceremonia concreto** (piden fecha de la próxima ceremonia), no son un perfil único estático — es razonable modelarlo como una solicitud por viaje, no un formulario de salud "de por vida".
5. Todo el contenido de salud es dato sensible — ver sección 6 del documento Word (`Legal y privacidad`) para retención y control de acceso.

## 6. Decisiones de alcance (2026-07-25)

- **Aprobación:** manual y obligatoria, nunca directa (ver §4 arriba).
- **Comunicación:** en esta primera fase, solo jerárquica admin → usuario. Comunicación entre usuarios/comunidad queda para una fase futura, no se construye ahora.
- **Rangos de usuario:** se arranca simple, un solo rango. Estados posibles: `visitante` (sin aprobación) y `viajero aprobado`. No hay niveles adicionales por ahora.
- **Versionado de solicitudes:** las solicitudes son **por viaje**, no de por vida — un usuario rechazado para un viaje puede volver a aplicar y ser aprobado para otro (ej. no podía por medicación un año, al año siguiente sí). El admin debe poder ver el historial completo de solicitudes de un usuario, no solo la última.
- **Retención/expiración:** el admin puede marcar solicitudes/aprobaciones como expiradas manualmente (no hay borrado automático todavía). Política de borrado de datos de salud queda pendiente (legal).

## 7. Pendientes de definición

Ver `Cosmic_Eagle_Journey_Relevamiento.docx` / `.pdf` para el detalle completo. En resumen, sigue abierto:

- Criterios exactos de aprobación/rechazo dentro de una revisión (quién decide en casos límite) y canal de notificación (email, in-app)
- Legal: política de privacidad, retención de datos de salud, derecho de borrado
- Secciones finales del panel de administración (borrador en sección 7 del Word)

## 8. Notas para agentes de desarrollo (Claude Code / OpenCode)

- Los datos de salud (sección 4.1 y 4.2) son **dato sensible** — cualquier tabla que los contenga necesita RLS (Row Level Security) en Supabase restringido a rol admin, nunca expuesto en el cliente sin control de acceso.
- No auto-generar copys de marketing ni textos legales — los bloques de consentimiento (sección 4.3) son contenido fijo provisto por la clienta, no se reescriben.
- El flujo es de aprobación manual obligatoria (§4, §6) — ya no está en discusión, no ofrecer "inscripción directa" como alternativa.
- Mantener separación clara entre formulario primerizo y recurrente como dos flujos, no un único formulario con campos opcionales.
- No construir comunicación entre usuarios ni sistema de rangos múltiples — fuera de alcance de esta fase (§6).
