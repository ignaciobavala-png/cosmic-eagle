# Tests end-to-end (Playwright)

`pnpm e2e` corre todo. `pnpm e2e:lectura` sólo lo público, `pnpm e2e:panel`
sólo el panel, `pnpm e2e:ui` abre el modo interactivo.

## 1. Por qué existen, si el proyecto dice "sin testing"

`CLAUDE.md` dice **sin testing**, y esto lo contradice a propósito. No es
cobertura de unidades: es la única forma de verificar lo que **nunca se pudo
verificar**.

Cada sesión de las últimas seis terminó con la misma frase: *"sin verificar
end-to-end (requiere sesión, la hace Ignacio)"*. Se acumularon nueve
verificaciones pendientes —la campanita de avisos, el acordeón de Multimedia,
las portadas de viaje, los slots nuevos de la home, la pantalla de acceso,
cargar un artículo, cargar un riel de cobro, subir un comprobante, cargar una
FAQ— todas por lo mismo: **el panel está detrás de un login**, y un agente sin
navegador no puede pasar de ahí.

Con esto, esas verificaciones las hace la máquina.

## 2. Corren contra la base de PRODUCCIÓN

No hay entorno de staging. Por eso la suite está partida por lo que toca:

| Proyecto | Qué hace | Escribe |
|---|---|---|
| `setup` | Inicia sesión de admin una vez y guarda las cookies en `e2e/.auth/` | no |
| `lectura` / `lectura-mobile` | Las rutas públicas, sin sesión | **no** |
| `panel` | Todas las secciones del panel, con la sesión del setup | **no** |
| `escritura` | El flujo de inscripción completo | sí — **todavía sin implementar**, ver §5 |

`fullyParallel: false` y `workers: 1`: contra una base compartida, dos tests
escribiendo a la vez se pisan.

## 3. Credenciales

Salen de `.env.local` (gitignoreado), nunca del código:

```
E2E_ADMIN_EMAIL=…
E2E_ADMIN_PASSWORD=…
```

Son las de la cuenta admin de prueba, que vive en
`~/Escritorio/account/cosmic-eagle-acces.txt`, fuera del repo.

El login se hace **una sola vez** (`e2e/auth.setup.ts`) y el estado se guarda;
los demás tests parten de ahí. Son ~20 navegaciones menos y un solo login contra
el Auth real.

## 4. Los dos tests que valen más que "la página carga"

**a. Ningún bloque de texto queda invisible.** Es el bug del 28/08: `useScroll`
delegado al motor nativo del browser hacía que las palabras del scroll-story se
desvanecieran justo cuando tenían que quedar solas. **Compilaba igual y se veía
mal** — ni `tsc` ni el build lo detectan.

La invariante **no** es "todo visible al final": los bloques ligados al scroll
están en opacidad 0 arriba de todo, a propósito, y se apagan de nuevo al pasar
de largo. Lo que se verifica es que **cada bloque llegue a verse en algún punto
del recorrido**. El test baja la página de a 250px y guarda la opacidad máxima
efectiva de cada `h1`/`h2`/`p` (el producto de la cadena de ancestros: un padre
en 0 esconde al hijo aunque el hijo esté en 1).

El corte es **0.5 y no 1**: el diseño de Julia atenúa texto a propósito
(`opacity-85` y `opacity-90` en el panel doble de la home). Un reveal que no
dispara deja 0, no 0.85.

**b. Los anclajes no caen debajo del navbar.** El navbar es una banda opaca de
84px; sin `scroll-padding-top` cualquier ancla deja la sección tapada. Cubre
`#sesiones` y `#viajes`, que son la navegación principal a Experiencias.

## 5. Lo que falta: el flujo de escritura

El test que importa —registro → filtro corto → aprobación → datos de pago →
comprobante → marcar pagado → formulario de salud— **no está escrito todavía, y
está bloqueado por una sola cosa: no se puede limpiar lo que escribe.**

Verificado contra la base: **no hay ninguna policy de DELETE** sobre
`applications`, `payment_proofs`, `health_form_first_time` ni
`admin_notifications`. Es correcto y deliberado —una solicitud no se borra desde
la web— pero significa que ni el postulante ni el admin pueden deshacer lo que
el test cree.

Hace falta **`SUPABASE_SERVICE_ROLE_KEY` en `.env.local`** (Supabase → Settings →
API → `service_role`). Con eso el teardown borra todo lo prefijado `E2E` y la
suite queda cerrada sobre sí misma. Sin eso, cada corrida dejaría una solicitud
falsa en el panel de Estela.

**La clave nunca va al repo ni al browser**: sólo la usa el teardown, en Node.

## 6. Detalles de selectores que costaron y conviene no repetir

- `getByLabel("Contraseña")` matchea **dos** elementos: el input y el ojito de
  mostrar/ocultar, que lleva `aria-label="Mostrar contraseña"`. Va
  `getByRole("textbox", { name: "Contraseña" })`.
- Los items del desplegable del panel llevan `role="menuitem"`, que **pisa el rol
  implícito** de `<a>`: no aparecen como `link`. Es correcto para un menú.
- En `dev`, el botón de las Dev Tools de Next también tiene
  `aria-haspopup="menu"`. Hay que acotar el selector a `nav`.
- El primer grupo de `/admin/multimedia` viene **abierto** a propósito
  (`open={i === 0}`). Para probar el acordeón hay que usar el segundo.
