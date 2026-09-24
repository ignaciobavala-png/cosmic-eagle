# Arquitectura de acceso público/privado del sitio

Pedido de la organización, feedback del 23/09
(`docs/entregas/2026-09-23-feedback-org/CEJ_Correcciones_Home_Web.docx`, §12–18):
separar el sitio en una capa pública liviana y una capa con más profundidad que
sólo vean personas registradas. El documento deja 10 preguntas abiertas; esta es
la resolución que tomamos nosotros (Ignacio, sin volver a consultar — Julia ya
no está y esto no es su rediseño aprobado, es una decisión de producto nueva).

**No inventamos un sistema nuevo.** El sitio ya tiene una escala de tres niveles
para la biblioteca (`docs/ACCESO_CONTENIDOS.md`): enum `content_access_level`,
`publico < miembros < programa`, resuelto por `private.content_level()`. La
extendemos para gatear también la navegación del sitio, no sólo los artículos.

## 1. Qué nivel pide cada sección

| Sección | Nivel | Nota |
|---|---|---|
| Home, Nosotros, FAQs, Privacidad, Términos | `publico` | Sin cambios. |
| Experiencias (listado, sin fechas cerradas) | `publico` | Ver qué existe, no el detalle operativo. |
| Calendario, detalle de una experiencia con fecha/cupo, Testimonios completos | `miembros` | Hay que tener cuenta. |
| Contenidos | ya resuelto | Sigue la escala existente, sin cambios. |
| Inscripción a una experiencia | `miembros` + aprobación | Ya existe: `applications`. |

`trips` no cambia su RLS (`docs/CLAUDE.md`: "`trips` filtra los borradores en
cada página, no en RLS"). Lo que cambia es **qué pinta cada página cuando no
hay sesión**: sin sesión, `/viajes` muestra nombre + lugar + formato
(sesión/retiro) pero no fecha ni cupo ni botón de inscripción — eso ya lo
puede resolver la página, sin tocar la base.

## 2. El filtro inicial

Se agrega **al registro**, no antes: pedir un filtro previo a un formulario
de registro es una fricción de más y el propio doc admite que la alternativa A
(registro + formulario breve) es la más simple de las tres. Las preguntas que
pide el doc (quién es, de dónde viene, cómo llegó, quién la recomendó, por qué
está interesada) se agregan como campos del registro en `/cuenta`, no como
paso 0 aparte.

**No dispara aprobación por sí solo.** Da de alta la cuenta en nivel `miembros`
de inmediato (ya es lo que pasa hoy: cualquiera que se registra entra). Estas
respuestas son información para el CRM de Estela, no un gate — el gate real
sigue siendo la aprobación de la solicitud a una experiencia puntual, que no
cambia.

## 3. Códigos y accesos temporales

Ya existe `access_codes` para la biblioteca (uno por viaje/tanda, no por
persona). No se crea un sistema paralelo para "ver el calendario": si alguien
llega por WhatsApp con un código de contenidos y canjea, ya tiene cuenta y
por lo tanto ya ve el calendario — no hace falta un segundo tipo de código.

**Se descarta la opción C (link privado sin cuenta)**: es la misma razón por
la que se descartó para contenidos (`docs/BIBLIOTECA.md` §3, "evita que
circulen links sueltos") — un link no se revoca ni se limita.

## 4. Quién aprueba y cuánto dura

- Alta en `miembros`: automática al registrarse, sin aprobación (como hoy).
- Alta en `programa` (contenidos del programa): la aprueba Estela al aprobar
  la solicitud — sin cambios, ya está en `docs/ACCESO_CONTENIDOS.md` §4.
- El acceso `miembros` no vence. El acceso `programa` hereda el `expires_at`
  del grant o del código, como ya está.

## 5. Lo que esto no resuelve todavía

- El copy exacto de "por qué no puedo ver la fecha" en `/viajes` sin sesión
  (candado vs. mensaje).
- Si el filtro va a pedirle also un teléfono/WhatsApp para el CRM (Estela no
  lo pidió explícitamente, se pregunta antes de agregarlo).
- Se implementa gateando **vistas**, no ocultando con CSS: mismo criterio que
  ya se verificó para `articles` (el HTML no debe traer lo que no toca).
