# Flujo de inscripción de Sofía vs. lo que hay hoy en la web

> Fuente: `flujo-inscripcion-cosmic-eagle.md` (Sofía, recibido 2026-08-18, en
> `~/Descargas`, **fuera del repo**). Comparado contra el código de `main`.
> Complementa `docs/FLUJO_USUARIO.md` (auditoría del 2026-08-13), que mira lo mismo
> desde los roles de usuario.

## El orden definitivo (confirmado por Ignacio el 2026-08-19)

Esto **ya no es una pregunta abierta**. El orden real de la inscripción es:

```
registro → form corto (4 preguntas) → Estela revisa → link de pago → pago
        → formulario de salud extenso → consentimiento → logística
```

Consecuencias directas, porque contradicen cómo está armada la web hoy:

- **Los dos formularios de salud dejan de ser alternativas y pasan a ser dos etapas.**
  Hoy `solicitar/page.tsx` elige *cuál de los dos* mostrar según el historial del usuario
  (primerizo → 18 campos, recurrente → 4). En el flujo confirmado **todos** llenan primero
  el corto, y el extenso llega después de pagar. La bifurcación por historial deja de ser
  "qué formulario" y pasa a ser, en todo caso, "qué versión del extenso".
- **El filtro corto es el "formulario de salud antes de ser aceptado" de las FAQs.** La
  contradicción que quedaba abierta contra `web-cosmic-journey-ES.md` se resuelve así.
- **La aprobación de Estela va entre el filtro y el pago**, no al final. Sigue siendo
  manual y sigue siendo el gate real de acceso.
- **El consentimiento va después del formulario extenso**, no antes ni en el medio. Encaja
  con que una de sus 4 confirmaciones sea "completé el formulario de salud".

### Lo que este orden bloquea

**El pago no existe y la pasarela todavía no está elegida** (charla pendiente sobre qué
proveedores se usan). Es el escalón del medio: sin él, el flujo se puede construir hasta
la revisión de Estela y retomar recién en el consentimiento, pero queda partido al medio.

### Lo que hay que definir antes de escribir código

1. **El form corto está redactado para recurrentes.** Pregunta *"desde tu última
   ceremonia"* y *"¿cuántas ceremonias has realizado con Estela previamente?"*. Si es el
   primer paso de todos, a un primerizo esas dos no le aplican. Falta saber si se reescribe
   el encabezado para que sirva a los dos, o si el primerizo entra por otra puerta.
2. **Sofía habla de un filtro de 3 preguntas, no de 4**, y menciona un texto de encuadre
   (adicciones, bipolaridad, depresión severa) que no aparece en ningún Google Form
   relevado. Falta confirmar si su filtro corto **es** el formulario de Viajer@s o es otra
   cosa que todavía no existe.
3. ~~**El modelo de datos asume un formulario por solicitud.**~~ **HECHO el 2026-08-19**,
   ver "El modelo de dos etapas" abajo.

### El modelo de dos etapas (implementado el 2026-08-19)

Migración `20260819180444_two_stage_applications.sql`. Se eligió **padre + hijos** y no
"una fila que se completa":

```
applications                      etapa 1: filtro corto + estado + revisión + pago
  ├─ health_form_first_time       etapa 2: el formulario extenso, posterior al pago
  └─ consents                     etapa 3: sin UI todavía
```

El motivo es de seguridad, no de prolijidad: con etapas encadenadas **cada etapa es un
INSERT nuevo** y el postulante nunca necesita UPDATE sobre una fila con datos médicos. La
otra opción obligaba a abrir UPDATE sobre datos de salud y blindarlo con grants por
columna, que es donde este proyecto ya se quemó una vez.

Se dropearon las dos tablas viejas en vez de migrarlas: estaban en **cero filas**.

Lo que quedó construido, en el orden en que lo recorre una persona:

| Paso | Dónde | Estado |
|---|---|---|
| Filtro corto | `/viajes/[id]/solicitar` (`ScreeningForm`) | ✅ |
| Revisión de Estela | `/admin/solicitudes/[id]` | ✅ |
| Pago | `PaymentControls` en el detalle: lo marca el admin a mano | ⚠️ sin pasarela |
| Formulario extenso | `/viajes/[id]/salud` (`HealthForm`) | ✅ |
| Consentimiento | — | ❌ faltan los textos legales |
| Logística | — | ❌ |

`/viajes/[id]/solicitar` pasó a ser también la pantalla de estado: dice en qué paso está
la persona y linkea al siguiente, en vez de repetir "en revisión / aprobada".

**El pago es el único escalón que la web no hace.** Mientras no haya pasarela, Estela
coordina el cobro por fuera y lo registra en el panel; ese click es lo que habilita el
formulario extenso. `payment_status` tiene tres valores (`pending`, `paid`, `waived`) —
`waived` existe para las invitaciones y cupones de `docs/CRM.md` §5.

---

## Tabla de paridad

| # | Paso de Sofía | Estado hoy | Dónde |
|---|---|---|---|
| 1 | Contacto inicial | **Distinto**. No hay formulario de contacto ni botón "me interesa". El equivalente es postularse, que ya exige cuenta | `viajes/[id]/page.tsx` |
| 2 | Envío de info general + ficha del evento | **Parcial**. La ficha vive en la página del viaje (descripción, programa, aporte, condiciones). No hay descarga de PDF ni envío automático por mail | `viajes/[id]/page.tsx`, `trips.schedule` / `trips.terms` |
| 3 | Filtro de salud de 3 preguntas | **HECHO el 2026-08-19** como primer paso de todos, con las preguntas de Viajer@s (las de Sofía no existen como formulario) | `solicitar/ScreeningForm.tsx` |
| 4 | Evaluación del filtro (punto de decisión) | **Existe, pero manual siempre**. `pending_review` → admin aprueba/rechaza. No hay avance automático cuando todas las respuestas son negativas | `admin/solicitudes/actions.ts` |
| 5 | Link de pago (total o reserva) | **Parcial.** La web no cobra, pero el pago ya es un estado de la solicitud y el admin lo registra a mano; sin eso no se habilita el paso siguiente | `admin/solicitudes/PaymentControls.tsx` |
| 5b | Pago del saldo, recordatorios, estados | **No existe.** No hay estados de pago ni fecha de corte | — |
| 6 | Guía de preparación | **No existe.** `/preparacion` está pendiente | `docs/CONTENT_MAP.md` |
| 6 | Consentimiento informado en cada evento | **Tabla creada, sin UI ni textos.** Los textos legales son de la clienta y no están en el repo | `supabase/migrations/20260725235104_consents.sql` |
| 6 | Form de salud extenso, después del pago | **HECHO el 2026-08-19.** Ya no compite con el corto: es la etapa 2, y sólo se abre con la solicitud aprobada y el pago registrado | `viajes/[id]/salud/` |
| 6 | Se llena en **cada** evento | **HECHO.** Una solicitud viva por viaje (índice único parcial), así que cada viaje lo pide de nuevo | `solicitar/page.tsx` |
| 7 | Datos logísticos condicionados a los documentos | **No existe.** El aprobado sólo ve una tarjeta del viaje en `/cuenta`. Dirección exacta, qué llevar, horarios: no son campos de `trips` | `cuenta/MisSolicitudes.tsx` |
| 8 | Asistencia | — (fuera de la web) | — |
| 9 | Material de integración post-evento | **No existe.** No hay envío programado ni sección para material | — |

## Lo que ya está resuelto y ella lo tiene como pendiente

- **Pendiente 4, "definición de persona nueva"**: el sistema ya lo hace. Cuenta las
  solicitudes `approved` del usuario (`applications_first_time` +
  `applications_returning`); con una o más muestra el formulario corto. La base de
  datos con historial que ella pide **ya existe**.
  *Salvedad conocida*: quien ceremonió por Google Forms tiene historial cero en
  Supabase y vería el formulario largo (`docs/FORMULARIOS.md`).
- **Pendiente 5, manejo de datos de salud**: hay RLS en todas las tablas, cada usuario
  ve sólo lo suyo, el admin ve todo, y las vistas `my_applications_*` excluyen los
  campos médicos del panel del viajero. Falta la política escrita — pero el anexo de
  Privacidad que mandó Sofía en `web-cosmic-journey-ES.md` ya la cubre en parte.

## Las tres diferencias de fondo

1. ~~**El orden no coincide.**~~ **RESUELTO el 2026-08-19**, ver la sección "El orden
   definitivo" arriba. Se adopta el orden del proceso manual: el pago va en el medio,
   entre la revisión de Estela y el formulario de salud extenso. La web hoy hace lo
   contrario y hay que darla vuelta.
2. **Ella pide dos filtros de salud, la web tiene uno.** El filtro corto de 3 preguntas
   sirve para no pedirle 18 campos a alguien que todavía no confirmó interés. Se puede
   implementar como primer paso del mismo formulario o dejar sólo el largo. Ojo: el
   texto largo de encuadre del paso 3 (adicciones, bipolaridad, depresión severa) **no
   está en ningún lado de la web** y conviene mostrarlo antes de las preguntas.
3. **Después de aprobar, la web no acompaña.** Los pasos 6, 7 y 9 —preparación,
   consentimiento, logística, integración— son hoy cero código. Es el mismo hueco que
   marca `docs/FLUJO_USUARIO.md`: ser viajero aprobado casi no cambia nada.

## Lo que ella no menciona y la web sí tiene

- Registro con cuenta y sesión (su flujo es todo por WhatsApp/mail).
- Panel de admin con revisión, CRM y niveles de experiencia.
- Newsletter.

## Preguntas para la reunión

1. ~~¿El pago va antes o después del formulario de salud?~~ **RESPONDIDO el 2026-08-19**:
   antes del extenso, después del filtro corto y de la revisión. Queda pendiente **qué
   pasarela** se usa — sin decidir.
2. El "avance automático al pago si todas las respuestas son negativas": ¿lo quieren
   de verdad, o Estela prefiere revisar siempre a mano? Hoy revisa siempre.
3. ¿Los datos logísticos (dirección exacta, qué llevar, horarios) los queremos como
   campos del viaje, visibles sólo al aprobado? Coincide con los campos nuevos que ya
   pedía el boceto de Sofía.
4. Consentimiento: hacen falta los textos legales. Sin eso no se puede construir.
5. Material de integración: ¿archivo por viaje, mail programado, o sección en `/cuenta`?

---

## Cruce con el boceto de estructura (`web-cosmic-journey-ES.md`)

Ese archivo **no es nuevo**: es el mismo documento que entró el 2026-08-15 y ya está
incorporado (ver CLAUDE.md, sesión del 15/08). Vale igual cruzarlo con el flujo de
inscripción, porque los dos describen el mismo proceso desde ángulos distintos y en
algunos puntos **no dicen lo mismo**.

### Donde se contradicen

| Tema | Boceto de estructura | Flujo de inscripción | Web hoy |
|---|---|---|---|
| **Ver el detalle de un evento** | Requiere cuenta o **código de acceso**; sin eso hay que postular | No lo menciona: el paso 2 es que le mandan la ficha del evento a cualquiera que consulte | `/viajes/[id]` es **público**, sin sesión |
| **Consentimiento informado** | No aparece nunca, ni en la lista de datos de cada sesión | Obligatorio, **en cada evento**, nuevo o recurrente | Tabla creada, sin UI |
| **Cuándo se llena el form de salud** | "Todos deben completar un formulario de salud **antes de ser aceptados**" (FAQs, los dos juegos) | El formulario extenso va **después del pago**; antes sólo el filtro de 3 preguntas | Antes de todo, es el único paso — **hay que darlo vuelta**, ver "El orden definitivo" |
| **Preparación previa** | Sesiones: "al menos cinco días". Viajes: "al menos una semana". El cuerpo de Sesiones dice "una semana" | "Guía de preparación" sin plazo | No existe |

La contradicción del formulario de salud **quedó confirmada el 2026-08-19**: "el
formulario de salud antes de ser aceptado" de las FAQs es el filtro corto, y el extenso es
posterior al pago. Lo que sigue sin cerrar es si ese filtro corto es el formulario de
Viajer@s (4 preguntas) o el de 3 preguntas de Sofía, que no existe como Google Form.

### Donde se refuerzan

- **El código de acceso es un gate de nivel, no un login.** El anexo de Privacidad lo dice
  explícito: el detalle de ciertos viajes y los contenidos avanzados están disponibles
  sólo para quien ya participó de una Sesión Cósmica o pasó una evaluación individual.
  Sesiones abiertas a primerizos, Viajes y *Saber Más* gateados. Eso responde en parte la
  consulta de `docs/consulta-sofia-acceso.txt`: **no reemplaza el botón de aprobar**, es
  otra cosa — controla acceso a *contenido*, no a la postulación.
- **Material de integración**: los dos documentos lo dan por hecho (paso 9 del flujo,
  "guía de integración" en las FAQs de los dos tipos). No existe en la web.
- **Revisión individual de cada postulación**: las FAQs repiten "cada postulación se revisa
  de forma individual". Refuerza que el avance automático al pago del paso 4 hay que
  preguntarlo antes de construirlo.

### Lo que falta en los dos

- **Política de cancelación**: las FAQs de Viajes remiten a ella ("revisa nuestra Política
  de Cancelación") pero el texto no está en los anexos, y el flujo de inscripción la deja
  como pendiente. Hay que pedirla.
- **Montos de reserva**: el boceto lista "Valor" como dato de cada evento; el flujo habla
  de pago total o reserva sin definir el monto. Es su pendiente #3.
