# Flujo de inscripción de Sofía vs. lo que hay hoy en la web

> Fuente: `flujo-inscripcion-cosmic-eagle.md` (Sofía, recibido 2026-08-18, en
> `~/Descargas`, **fuera del repo**). Comparado contra el código de `main`.
> Complementa `docs/FLUJO_USUARIO.md` (auditoría del 2026-08-13), que mira lo mismo
> desde los roles de usuario.

## Tabla de paridad

| # | Paso de Sofía | Estado hoy | Dónde |
|---|---|---|---|
| 1 | Contacto inicial | **Distinto**. No hay formulario de contacto ni botón "me interesa". El equivalente es postularse, que ya exige cuenta | `viajes/[id]/page.tsx` |
| 2 | Envío de info general + ficha del evento | **Parcial**. La ficha vive en la página del viaje (descripción, programa, aporte, condiciones). No hay descarga de PDF ni envío automático por mail | `viajes/[id]/page.tsx`, `trips.schedule` / `trips.terms` |
| 3 | Filtro de salud de 3 preguntas | **No existe como paso previo**. Hoy se pide de una el formulario largo (18 campos) o el corto | `solicitar/FirstTimeForm.tsx` |
| 4 | Evaluación del filtro (punto de decisión) | **Existe, pero manual siempre**. `pending_review` → admin aprueba/rechaza. No hay avance automático cuando todas las respuestas son negativas | `admin/solicitudes/actions.ts` |
| 5 | Link de pago (total o reserva) | **No existe.** La web no cobra | — |
| 5b | Pago del saldo, recordatorios, estados | **No existe.** No hay estados de pago ni fecha de corte | — |
| 6 | Guía de preparación | **No existe.** `/preparacion` está pendiente | `docs/CONTENT_MAP.md` |
| 6 | Consentimiento informado en cada evento | **Tabla creada, sin UI ni textos.** Los textos legales son de la clienta y no están en el repo | `supabase/migrations/20260725235104_consents.sql` |
| 6 | Form de salud extenso (nuevo) / corto (recurrente) | **HECHO y coincide 1:1** | `solicitar/page.tsx` elige según historial |
| 6 | Se llena en **cada** evento | **HECHO.** El chequeo de "ya te postulaste" es por `trip_id`, así que cada viaje pide el formulario de nuevo | `solicitar/page.tsx` |
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

1. **El orden no coincide.** En el proceso manual el pago va **antes** del formulario
   de salud y el consentimiento (paso 5 → paso 6). En la web el formulario de salud es
   lo primero, y el gate es la aprobación del admin, no el pago. Con pasarela habría
   que decidir si el pago se mete en el medio o si se conserva el orden actual
   (aprobar → cobrar → consentimiento). **Es la decisión más importante de la reunión.**
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

1. ¿El pago va antes o después del formulario de salud? (define todo el orden)
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
| **Cuándo se llena el form de salud** | "Todos deben completar un formulario de salud **antes de ser aceptados**" (FAQs, los dos juegos) | El formulario extenso va **después del pago**; antes sólo el filtro de 3 preguntas | Antes de todo, es el único paso |
| **Preparación previa** | Sesiones: "al menos cinco días". Viajes: "al menos una semana". El cuerpo de Sesiones dice "una semana" | "Guía de preparación" sin plazo | No existe |

La contradicción del formulario de salud se resuelve sola **si** "el formulario de salud
antes de ser aceptado" de las FAQs es el filtro corto de 3 preguntas, y el extenso es
posterior al pago. Conviene confirmarlo, porque de eso depende qué se le pide a la
persona en la primera pantalla.

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
