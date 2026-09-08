# Acceso a la biblioteca: niveles, habilitaciones y códigos

Pedido de la organización, 08/09/2026:

> una opción en el panel de control para habilitar a los inscriptos a un viaje a
> acceder a la documentación de contenidos, tener un código, y en la sección
> contenidos poder seleccionar qué contenido pueden ver los guest o no logueados
> o los que tengan el código otorgado.

Es la implementación de los tres niveles de `docs/BIBLIOTECA.md` §1.4 y cierra el
conflicto de §3 (código de Julia vs. cuenta de Sofía). Migración
`20260908160000_content_access_levels.sql`.

---

## 1. La escala

Enum `content_access_level`, y **el orden de declaración es el orden de
comparación**: `publico < miembros < programa`.

| Nivel | Quién llega | Cómo se llega |
|---|---|---|
| `publico` | Cualquiera, sin cuenta | — |
| `miembros` | Cualquier persona registrada | Registrarse |
| `programa` | Quien fue habilitado | Botón del panel, o canjear un código |

El admin siempre resuelve `programa`: no podría revisar lo que publica.

Cada artículo declara **qué nivel pide** (`articles.access_level`, desplegable
«Quién puede leerlo» en `/admin/contenidos`). El default de un artículo nuevo es
`miembros` y no `publico` a propósito: equivocarse hacia adentro se corrige con
un click, hacia afuera es contenido del programa publicado sin querer.

Los dos ensayos que ya estaban publicados quedaron en `publico`: son los "textos
generales de muestra" que pide §1.4.

## 2. Dónde vive el gate

**En la RLS, no en la página.** `articles_select_published` pasó a exigir
`access_level <= private.content_level()`. Es el mismo criterio con el que
`articles` filtra los borradores desde el 18/08: si el filtro lo hiciera cada
ruta, la primera ruta nueva que se olvide filtra el texto entero.

Verificado: el cuerpo de un artículo cerrado **no aparece en el HTML** que se
sirve a quien no tiene acceso. No se esconde con CSS ni se recorta en el
cliente — no sale de la base.

## 3. Por qué existe la vista `articles_public`

§1.4 pide que quien no tiene acceso vea igual las categorías y las portadas, y
el mockup de Julia muestra **candados, no ausencia**. Eso no se puede hacer con
una sola policy: o la fila sale o no sale.

Entonces hay dos lecturas:

- `articles_public` — vista `security_invoker = false` con los metadatos de todo
  lo publicado (título, bajada, portada, categoría, nivel). **No expone `body`.**
  La lee `/contenidos` para dibujar la grilla completa con sus candados.
- `articles` — la tabla, con el cuerpo, filtrada por la policy. La lee el
  detalle del artículo.

**Ojo**: una vista definer también *escribe* como su dueño, así que sólo se
otorgó SELECT. Sin ese cuidado sería un puente para escribir `articles` sin RLS.

La página del artículo cerrado **existe igual** y muestra el muro con el copy de
la clienta más el canje del código. Un 404 dejaría a la persona sin saber que
ese contenido existe ni cómo pedirlo, y sacaría del buscador una ficha que sí es
pública.

## 4. Las habilitaciones (`content_grants`)

**Salen solas de la aprobación.** Migración
`20260908190000_content_access_on_approval.sql`: un trigger sobre `applications`
escribe la habilitación cuando el estado pasa a `approved`. Estela no hace un
segundo paso — la decisión ya la tomó al aprobar, y el dato ya está en el panel.

La primera versión de esta sección pedía elegir nivel y escribir una nota en un
formulario. **Eso se sacó el mismo día**: ese formulario no se iba a llenar, y
repetía una decisión ya tomada.

Sigue habiendo una fila por habilitación —a quién, qué nivel, de qué solicitud
salió, quién la dio, cuándo, hasta cuándo— porque es lo que permite quitarla y
lo que deja el rastro.

Detalles que sostienen esto:

- **El umbral es la aprobación, no el pago.** Quien fue aceptada necesita el
  material de preparación *antes* de viajar: es lo que promete el correo [6].
  Moverlo al pago es cambiar el `if` del trigger.
- **`content_grants.application_id` con índice único parcial** es lo que hace
  idempotente al trigger: sin él, cada ida y vuelta de estado agregaría una fila.
- **`on conflict do nothing`, no `do update`.** Si la habilitación se revocó a
  mano, esa decisión gana: volver a pasar por «aprobada» no la resucita.
  Verificado.
- **El trigger es `security definer`** para que funcione por cualquier camino
  —el panel, un SQL a mano, el backfill— sin depender de quién corre el update.
- La migración **hace backfill** de las solicitudes ya aprobadas. En producción
  no había ninguna.

El botón del panel quedó para las dos excepciones: **quitarle** el acceso a
alguien, y **dárselo** a alguien cuya solicitud todavía no está aprobada o que
ceremonió por fuera de la plataforma. No pide nivel ni nota: los dos los sabe el
sistema.

La habilitación **es independiente de la solicitud**: la persona la conserva
después del viaje, hasta que se la quiten.

Nadie se auto-habilita: `authenticated` no tiene INSERT sobre `content_grants`
más que por la policy de admin. Verificado con `set role`.

## 5. Los códigos (`access_codes`)

**Uno por viaje o por tanda, no uno por persona** (decisión de Ignacio, 08/09).
Estela escribe el código —no se genera al azar, para que sea decible por
WhatsApp: `TULUM-2026`—, elige el tope de usos y el vencimiento, y se lo pasa al
grupo.

**Canjear un código no es una forma de entrar.** El canje exige sesión abierta y
lo único que hace es escribir una fila en `content_grants` para esa cuenta. Eso
concilia las dos entregas que se contradecían:

- el modal dorado del video de Julia (02/09) existe, y el gesto de entregar una
  llave también;
- pero el permiso vive en la cuenta, que es lo que recomienda Sofía
  (`docs/BIBLIOTECA.md` §3: *"evita que circulen links sueltos"*).

Un código que fuera login alternativo no se podría revocar ni limitar, y anularía
la marca de agua personalizada que ella misma pide en §1.6.

El control no lo da el secreto del código sino **el tope de usos, el vencimiento
y el botón de apagarlo**. Apagar un código corta la entrada de gente nueva pero
**no le saca el acceso a quien ya lo canjeó**: para eso está el botón de quitar,
uno por persona.

Detalles que no hay que "simplificar":

- **Nadie que no sea admin puede leer `access_codes`.** Poder listarla es poder
  canjear cualquier código. El canje no la lee: lo hace
  `public.redeem_access_code`, definer, que sólo responde si el código sirve.
- **Un código apagado responde igual que uno inexistente** (`invalido`): decir
  "existe pero está cerrado" le confirma a quien prueba códigos que acertó uno.
- **Canjear dos veces el mismo código no consume un uso nuevo** ni da error.
- El vencimiento del código **también vence el acceso** de quien lo canjeó: la
  fila del grant hereda su `expires_at`.

## 6. Lo que verificamos

Con `set role` sobre la base real: `anon` ve 2 de 4 artículos en la tabla y los
4 en la vista; una cuenta sin habilitación ve los públicos y los de miembros
pero no los del programa; el auto-insert en `content_grants` rechazado; los
códigos invisibles para quien no es admin; el canje con minúsculas y espacios
funcionando; el tercer canje de un código de dos usos devolviendo `agotado`; una
persona sin ver las habilitaciones de otra; la revocación bajando el nivel de
`programa` a `miembros` en la misma consulta; y la vista no escribible.

Más `tsc`, lint (los 2 errores de `multimedia/SlotEditor.tsx` son previos), build
de producción, y el muro servido de verdad por `next start`: el cuerpo secreto
del artículo de prueba **no aparece** en el HTML de la lista ni del detalle, y el
artículo abierto se sigue leyendo entero. Filas de prueba borradas.

Los dos advisors nuevos (`lint 0010` por la vista definer y `lint 0029` por
`redeem_access_code`) son a propósito y están explicados arriba.

## 7. Lo que falta

1. **Verificación end-to-end con sesión de admin** (la hace Ignacio): aprobar
   una solicitud y ver a esa persona aparecer habilitada; y crear un código
   desde `/admin/acceso`, canjearlo con otra cuenta y ver la biblioteca abrirse.
2. **El diseño del muro y del modal es nuestro, no de Julia.** Ella dibujó el
   modal dorado en el video de `/contenidos` mobile, pero ese rediseño entero
   —acordeón de tres niveles, navegación tipo Netflix— **no está implementado**:
   hoy la biblioteca sigue siendo la grilla con filtros. El muro se compuso con
   las primitivas que ya existen.
3. **El Manual Evolutivo sigue sin existir.** Sus tres etapas (Foundations /
   Evolution / Advanced) no son tres niveles de acceso: son tres cuerpos de
   contenido. Con lo de acá se pueden gatear los tres al nivel `programa`, pero
   entregarlos por etapa pide o un nivel más en la escala o una marca por
   artículo. **A definir con Sofía.**
4. **La marca de agua personalizada** (§1.6) no está.
5. **Avisarle a la organización** que el default de un contenido nuevo es «Con
   cuenta»: si cargan algo pensando que es abierto, no lo va a ver un visitante.
