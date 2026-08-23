# CRM — segmentación de contactos

> Origen: reunión con Estela y Sofía (2026-08-03), notas de Ignacio. Documento de trabajo:
> lo marcado como **abierto** todavía no está confirmado con la clienta.

## Estado (2026-08-05)

Primera versión implementada en `/admin/crm` (rama `dashboard`). Es deliberadamente
mínima: **solo los ejes que se pueden calcular** con los datos que ya existen —
experiencia y geografía. Género y cargo quedan afuera hasta que se defina de dónde salen.

- `src/lib/crm.ts` — lógica pura: escala de experiencia, estado de relación, agregación.
- `src/app/admin/crm/page.tsx` — tabla + filtros por estado / experiencia / país, y
  copiar los mails del segmento filtrado (reusa `CopyEmails` de suscriptores).
- Migración `20260805191720_profiles_email_for_crm.sql` — `profiles.email`, backfilleado
  desde `auth.users` y sincronizado por trigger. Sin esto el CRM no tenía el mail: vivía
  solo en `auth.users`, que la Data API no expone.

**No hay tabla de CRM.** El cruce `profiles` × `applications_*` se hace en memoria en el
Server Component. Es viable con decenas de personas; si crece a miles, mover a una vista
con `security_invoker = true` (la RLS de `applications_*` ya es admin-only, así que la
vista no abre nada nuevo).

## 1. Qué pidieron

Un CRM para *caracterizar*, *categorizar* y *canalizar la comunicación* con los contactos.
No es un sistema de permisos: es una capa de etiquetas sobre las personas, para saber a
quién se le habla y de qué.

**Confirmado (2026-08-05):** las categorías de experiencia (nuevo → experto) son
**etiquetas de segmentación**, igual que país o género — no cambian lo que la persona ve
ni puede hacer en el sitio. La decisión de `docs/ROLES.md:5` (un solo rango de usuario,
sin niveles de viajero) **sigue vigente**: el acceso al panel se sigue rigiendo por tener
o no una solicitud `approved`.

## 2. Los cuatro ejes de segmentación

Un contacto puede tener etiquetas de los cuatro ejes a la vez (ej. mujer + España +
healer + intermedio).

### 2.1 Experiencia

Derivada del historial de ceremonias, no cargada a mano.

| Categoría | Criterio anotado |
|---|---|
| Nuevo | 0 ceremonias |
| Principiante | 1 ceremonia |
| Intermedio | 5 ceremonias |
| Avanzado | **abierto** — sin umbral definido |
| Experto | **abierto** — sin umbral definido |

**Abierto:**
- Umbrales de Avanzado y Experto.
- Si "5 ceremonias" es el piso de Intermedio o su techo (qué pasa con 2, 3 y 4).
- Qué cuenta como ceremonia: solo las hechas con Estela, o también las previas con otros
  facilitadores. Hoy son campos distintos — `applications_returning.previous_ceremonies`
  es "cantidad de ceremonias previas con Estela", mientras que
  `applications_first_time.plants_detail` describe experiencias previas ajenas.
- Los recurrentes que ceremoniaron vía Google Forms tienen historial cero en Supabase, así
  que el cálculo automático los clasificaría como "nuevo". Es la misma decisión abierta
  que ya está en `docs/FORMULARIOS.md`.

### 2.2 Geografía

Secciones nombradas en la reunión:

- **Europa**: España, Francia
- **Latinoamérica + USA**: Chile, Uruguay, Argentina, México, USA

**Abierto:** si las secciones son regiones (Europa / LatAm) con países adentro, o una lista
plana de países. La lista de países nombrados no pretende ser exhaustiva.

**Dato disponible hoy:** `applications_first_time.country` (país de origen, texto libre).
No hay país en `profiles` ni en `applications_returning`.

### 2.3 Género

Una sección explícita: **Mujeres**.

**Abierto:** qué otras categorías existen y de dónde sale el dato — hoy no se pide el
género en ningún formulario ni en el registro.

### 2.4 Cargo / rol

- **Healers**
- **Líderes**
- **Influencers**

**Abierto:** si la lista es fija o el admin puede crear etiquetas nuevas. El dato no se
pide en ningún lado hoy: sale de la carga manual del admin.

## 3. Alcance: solo gente con cuenta

**Decidido (2026-08-05):** el CRM cubre **únicamente a las personas registradas** —
`auth.users` + `profiles`. No hay entidad de contacto separada, ni carga manual de gente
suelta, ni importación de planillas.

La gente sin cuenta se captura solo por email, a través del newsletter o de alguna
herramienta futura de captación. Esa lista (`newsletter_subscribers`) **queda fuera del
CRM**: no tiene con qué segmentarse, es un email y nada más. Vive donde ya vive, en
`/admin/suscriptores`.

Consecuencia práctica: la tabla central del CRM es `profiles`, y la segmentación se
construye encima de ella. Es el camino más corto — no hay que inventar un modelo de
contactos nuevo.

**"Clientes potenciales"**, entonces, no puede significar "gente sin cuenta". Dentro del
universo de registrados, la lectura razonable es: alguien que se registró pero todavía no
tiene ninguna solicitud aprobada — o nunca aplicó a un viaje, o aplicó y quedó pendiente
o rechazado. Eso es calculable con lo que ya hay en `applications_*`, no hace falta una
etiqueta manual.

**Abierto:** confirmar esa lectura con Sofía.

## 3.b Ficha de salud por persona (2026-08-23)

Pedido de la reunión con Sofía y Juli: *"generar fichas de salud por usuario:
armar historial de salud donde se acumulan las nuevas respuestas de formularios
respondidos por el usuario"*.

Implementado en `/admin/crm/[id]`. **No hizo falta migración**: el historial ya
se acumulaba solo, repartido entre las dos etapas de la inscripción (ver
`docs/FLUJO_INSCRIPCION.md`). Lo que no existía era una lectura por persona —
todo se veía por solicitud, en `/admin/solicitudes/[id]`.

La página tiene tres partes:

1. **Aviso de atención** — las respuestas marcadas (enfermedad grave,
   tratamiento psiquiátrico, medicación, condición de salud, trauma, sustancias)
   según lo último declarado. Es el mismo criterio de los triggers de aviso.
2. **Estado actual** — el último valor conocido de cada pregunta del formulario
   extenso, sin tener que abrir entrega por entrega.
3. **Historial** — cada entrega en orden, de la más nueva a la más vieja, con
   las respuestas que **cambiaron** respecto de la anterior marcadas
   ("antes decía: ..."). Ese diff es lo que convierte la lista en historial.

Decisiones:

- **El diff se calcula contra la entrega anterior del mismo tipo.** Comparar el
  filtro corto con el formulario extenso sería comparar preguntas distintas.
- **Las listas de preguntas se declaran una sola vez**, en
  `src/lib/health-history.ts` (`SCREENING_FIELDS` / `HEALTH_FIELDS`), y las
  consumen tanto esta ficha como el detalle de solicitud a través de
  `src/app/admin/AnswerList.tsx`. Antes estaban escritas a mano en la página del
  detalle; con dos pantallas mostrando las mismas ~20 preguntas se
  desincronizaban solas (es el mismo problema que tuvo `TYPE_LABEL`).
- **Sin tabla ni vista nueva.** El cruce se arma en memoria, igual que el resto
  del CRM: si esto crece a miles de personas hay que mover el join a una vista,
  y la nota de §3 aplica igual.
- Las dos pantallas se enlazan cruzadas: de la ficha a cada solicitud, y del
  detalle de solicitud al historial de la persona.

**Ojo con §7**: esta pantalla junta en un solo lugar todo lo que la persona
declaró sobre su salud. Es exactamente el dato sensible del que habla esa
sección, y ahora está a un click desde el listado del CRM. La RLS ya lo limita a
admin (las policies `*_admin_all`), pero cualquier rol intermedio que se agregue
más adelante **no** puede heredar el acceso a `/admin/crm` sin pensar esto.

## 4. Canalización de comunicación

El CRM define los segmentos; la comunicación es el canal que les habla. Son dos features
distintas, pero el segmento es el input de la otra: el pendiente #2 del roadmap
(comunicación admin → usuario, unidireccional, ver `docs/ROLES.md`) pasa a poder
dirigirse a un segmento en vez de a todos.

**Abierto:** canal (email, in-app, ambos) y si es difusión o mensaje individual.

## 5. Cupones e invitaciones

Anotado en la misma reunión, es un pedido **separado** del CRM aunque lo toque (los códigos
se entregan a segmentos). Son dos cosas distintas:

- **Cupón de descuento con código** — reduce el aporte de un viaje.
- **Invitación** — habilita a alguien a algo.

**Problema de fondo:** la plataforma no cobra. `trips.price` es informativo, no hay checkout
ni pasarela de pago. Un cupón sin cobro solo puede ser un código que la persona presenta y
que el admin ve al revisar la solicitud — un registro, no un cálculo.

**Restricción dura:** un código de invitación **no puede** saltear el formulario de salud ni
la aprobación manual (`docs/CONTEXT.md:37`, decisión cerrada). Lo que sí podría hacer:
reservar cupo, marcar a la persona como referida por alguien, o dar acceso a un viaje que no
está listado públicamente.

**Abierto:** porcentaje o monto fijo; un uso o varios; con vencimiento; por viaje o global;
y qué significa exactamente "invitación" para ella.

## 6. Preguntas para la próxima charla

1. ~~Las categorías de experiencia, ¿son permisos o etiquetas?~~ **Resuelto: etiquetas.**
2. ~~"Clientes potenciales", ¿de dónde salen esos contactos?~~ **Resuelto: el CRM es solo
   gente con cuenta.** Falta confirmar que "potencial" = registrado sin aprobación (§3).
3. Los datos del CRM (género, país, cargo), ¿los carga el admin a mano o se los pedimos a la
   persona al registrarse?
4. El cupón, ¿contra qué se descuenta si la plataforma no cobra?
5. "Invitación": ¿es reservar un lugar, es acceso a un viaje no publicado, o es otra cosa?
6. Los umbrales de Avanzado y Experto.

## 7. Nota de sensibilidad

Género, país y cargo atados a una persona que además tiene un registro de salud suben el
nivel de sensibilidad del dato. Cualquier tabla de CRM sigue la misma regla que
`applications_*`: RLS restringido a admin, nunca expuesta al cliente sin control de acceso
(`docs/CONTEXT.md:138`).
