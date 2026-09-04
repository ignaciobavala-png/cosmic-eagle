import { test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * El recorrido POR EL SITIO, para mostrárselo a la clienta: la home narrativa,
 * Nosotros, Experiencias, Contenidos y las FAQs, pantalla por pantalla.
 *
 * Es el complemento de `capturas.escritura.spec.ts`, que captura el embudo de
 * inscripción. Los dos escriben su `pasos*.json` en la misma carpeta y
 * `armar-indice.mjs` los une en un solo visor.
 *
 * **No escribe nada** (por eso es `.lectura`): sólo navega el sitio público.
 *
 * ─── Por qué acá las animaciones van ENCENDIDAS ────────────────────────────
 *
 * El spec del embudo usa `reducedMotion: "reduce"`, porque ahí lo que importa
 * es el contenido del formulario y una captura de página entera con el
 * observador de scroll activo sale con medio contenido en opacidad 0.
 *
 * Acá es al revés: lo que se muestra ES el diseño, y aplanado no se parece a lo
 * que la clienta va a ver. Entonces las animaciones quedan activas y cada
 * captura se toma DESPUÉS de haber scrolleado de verdad hasta la sección, en
 * pasos chicos, para que el `IntersectionObserver` de `Reveal` dispare y la
 * cascada termine. De ahí el `esperar` largo de `irA`.
 *
 * Y la captura es del VIEWPORT, no `fullPage`: una página entera de 15.000px no
 * se proyecta en una videollamada, y además `fullPage` reencuadra el documento
 * y desarma justo los bloques `sticky` del relato.
 */

const DESTINO =
  process.env.CAPTURAS_DIR ??
  path.join(
    process.env.HOME ?? "",
    "Escritorio/things/cosmic-eagle-material",
    "capturas-flujo-inscripcion"
  );

test.use({
  viewport: { width: 1440, height: 900 },
  // Chrome headless viene con `reduce` puesto por defecto: sin esto el sitio se
  // sirve aplanado y las capturas no muestran ninguna animación.
  contextOptions: { reducedMotion: "no-preference" },
});

type Paso = {
  archivo: string;
  titulo: string;
  detalle: string;
  actor: string;
  capitulo: string;
};
const pasos: Paso[] = [];
let n = 0;
let capitulo = "";

function slug(t: string) {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function capturar(page: Page, titulo: string, detalle: string) {
  n += 1;
  const archivo = `s${String(n).padStart(2, "0")}-${slug(titulo)}.png`;
  await page.addStyleTag({ content: `nextjs-portal { display: none !important; }` });
  await page.screenshot({ path: path.join(DESTINO, archivo) });
  pasos.push({ archivo, titulo, detalle, actor: "Sitio público", capitulo });
}

/** Abre una ruta y espera a que asiente el layout (fuentes incluidas: el
 * observador de `Reveal` se arma después de `load` + doble rAF justo por eso). */
async function abrir(page: Page, ruta: string) {
  await page.goto(ruta, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
}

/**
 * Scrollea hasta una sección **en pasos chicos**, como una persona, y espera a
 * que termine la cascada.
 *
 * `fraccion` es qué tan adentro de la sección quedar: 0 la deja arriba, y en un
 * bloque alto (el relato mide 400vh) 0.9 la deja casi al final, que es donde el
 * efecto está completo.
 */
async function irA(page: Page, selector: string, fraccion = 0, esperar = 1800) {
  const destino = await page.evaluate(
    ([sel, f]) => {
      const el = document.querySelector(sel as string);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      const recorrido = Math.max(0, r.height - window.innerHeight);
      return Math.max(0, Math.round(top + recorrido * (f as number)));
    },
    [selector, fraccion] as const
  );
  if (destino === null) throw new Error(`No existe la sección ${selector}`);

  const desde = await page.evaluate(() => window.scrollY);
  const pasosScroll = 14;
  for (let i = 1; i <= pasosScroll; i += 1) {
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior }),
      Math.round(desde + ((destino - desde) * i) / pasosScroll)
    );
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(esperar);
}

test.setTimeout(240_000);

test("recorrido por el sitio, sección por sección", async ({ page }) => {
  fs.mkdirSync(DESTINO, { recursive: true });

  try {
    // ─── La home ─────────────────────────────────────────────────────────────
    capitulo = "La home";
    await abrir(page, "/");
    await capturar(
      page,
      "La portada",
      "Lo primero que ve alguien que llega: la imagen a pantalla completa con un acercamiento lento, el navbar y el indicador de scroll."
    );

    await irA(page, "#manifiesto", 0.15);
    await capturar(
      page,
      "La frase manifiesto",
      "Las dos líneas entran una después de la otra al llegar a la sección. Es la primera pieza de texto del sitio."
    );

    await irA(page, "#relato", 0.55);
    await capturar(
      page,
      "El relato, a mitad de camino",
      "El bloque se queda fijo y el texto se va apagando párrafo por párrafo mientras se baja, dejando encendidas cuatro palabras."
    );

    await irA(page, "#relato", 0.95);
    await capturar(
      page,
      "Las cuatro palabras",
      "Al final del recorrido las palabras se despegan del párrafo y viajan al centro. Ahí aparece el botón que abre la cartelera."
    );

    // La cartelera arranca cerrada (corrección de Julia del 02/09) y la abre el
    // botón del relato, que vive 400vh más arriba.
    await page.locator('#relato a[href="#calendario"]').click();
    await page.waitForTimeout(2500);
    // El botón despliega el panel y ademas salta hacia el, con scroll suave.
    // Ese salto no deja la sección donde se la quiere fotografiar, asi que se
    // vuelve a encuadrar a mano una vez que el panel terminó de abrir.
    await irA(page, "#calendario", 0, 1200);
    await capturar(
      page,
      "La cartelera de experiencias",
      "El botón despliega el calendario: las sesiones y los viajes abiertos, en tarjetas que se mueven solas y se frenan al pasar el mouse."
    );

    await irA(page, "#atmosferica", 0.2);
    await capturar(
      page,
      "La frase sobre imagen",
      "Una de las franjas de imagen editables desde el panel de multimedia, sin tocar código."
    );

    await irA(page, "#proposito", 0.1);
    await capturar(
      page,
      "Nuestro propósito",
      "Bloque de texto sobre fondo claro, con la píldora dorada que es el botón del sistema."
    );

    await irA(page, "#experiencias", 0.1);
    await capturar(
      page,
      "Sesiones y Viajes",
      "El panel doble que separa los dos tipos de experiencia y lleva a cada uno."
    );

    await irA(page, "#voces", 0.1);
    await capturar(
      page,
      "Voces de Luz",
      "Los testimonios, arrastrables. Se cargan desde el panel y hoy hay once publicados."
    );

    await irA(page, "#tecnologia", 0.1);
    await capturar(
      page,
      "Tecnología del Alma",
      "El cierre narrativo de la home, antes del pie de página."
    );

    // ─── El gate de sesión ───────────────────────────────────────────────────
    capitulo = "El gate de sesión";
    await irA(page, "#calendario", 0.1, 800);
    /**
     * La pista de la cartelera lleva DOS juegos de tarjetas (es lo que hace el
     * loop sin salto), asi que la primera del DOM suele ser una copia recortada
     * contra el borde izquierdo. Se elige la primera que entre entera en
     * pantalla, o el click cae sobre una tarjeta a medias.
     */
    const indice = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#calendario a[href^="/viajes/"]')];
      return cards.findIndex((c) => {
        const r = c.getBoundingClientRect();
        return r.left > 60 && r.right < window.innerWidth - 60 && r.width > 200;
      });
    });
    const tarjeta = page.locator('#calendario a[href^="/viajes/"]').nth(Math.max(0, indice));
    if (indice >= 0) {
      /**
       * Se clickea con el mouse en coordenadas, no con `locator.click()`.
       *
       * Las tarjetas de la cartelera se desplazan solas en escritorio, y una
       * marquesina infinita **nunca queda quieta**: la comprobación de
       * estabilidad que hace Playwright antes de cada click (y antes de cada
       * `hover`) espera hasta agotar el timeout. Moviendo el mouse a mano se
       * dispara primero el hover que frena la pista, y recién ahí se clickea
       * sobre la posición ya detenida.
       */
      const antes = (await tarjeta.boundingBox())!;
      await page.mouse.move(antes.x + antes.width / 2, antes.y + antes.height / 2);
      await page.waitForTimeout(1200);
      const quieta = (await tarjeta.boundingBox())!;
      await page.mouse.click(quieta.x + quieta.width / 2, quieta.y + quieta.height / 2);
      await page.waitForTimeout(1600);
      await capturar(
        page,
        "La invitación a entrar",
        "Quien toca una experiencia sin haber iniciado sesión ve esta tarjeta. No es un candado: la página de la experiencia sigue siendo pública, es una invitación a crear la cuenta."
      );
      await page.keyboard.press("Escape");
      await page.waitForTimeout(600);
    }

    // ─── Nosotros ────────────────────────────────────────────────────────────
    capitulo = "Nosotros";
    await abrir(page, "/nosotros");
    await capturar(
      page,
      "Nosotros",
      "La portada de la página institucional, con el copy real de la clienta."
    );

    await irA(page, "#enfoque", 0.05);
    await capturar(
      page,
      "Las cuatro palabras y el enfoque",
      "Primera franja clara del sitio. Las palabras entran una por una, escalonadas."
    );

    await irA(page, "#somos", 0.5);
    await capturar(
      page,
      "Somos investigadores",
      "El relato que se va revelando con el scroll, párrafo por párrafo."
    );

    await irA(page, "#vision", 0.1);
    await capturar(page, "El cierre de Nosotros", "Los dos botones del sistema, sólido y vidrio.");

    // ─── Experiencias ────────────────────────────────────────────────────────
    capitulo = "Experiencias";
    await abrir(page, "/viajes");
    await capturar(
      page,
      "Experiencias",
      "La página a la que lleva «Experiencias» del navbar. El desplegable del menú baja directo a cada bloque."
    );

    await irA(page, "#sesiones", 0.05);
    await capturar(
      page,
      "Sesiones Cósmicas",
      "El bloque de las sesiones de un día, con su calendario desplegable y su banda de testimonios."
    );

    await irA(page, "#viajes", 0.05);
    await capturar(page, "Viajes Cósmicos", "El mismo bloque, para los viajes de una semana.");

    await irA(page, "#salud", 0.05);
    await capturar(page, "Salud y Seguridad", "El bloque de cierre de Experiencias.");

    // ─── Contenidos ──────────────────────────────────────────────────────────
    capitulo = "Contenidos y preguntas";
    await abrir(page, "/contenidos");
    await capturar(
      page,
      "La biblioteca",
      "Los contenidos que carga la clienta desde el panel, filtrables por categoría. Hoy hay dos ensayos publicados."
    );

    const articulo = page.locator('a[href^="/contenidos/"]').first();
    if (await articulo.count()) {
      await articulo.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1400);
      await capturar(
        page,
        "Un contenido por dentro",
        "La plantilla de lectura: el texto se escribe en el panel en texto plano y el sitio le pone la tipografía."
      );
    }

    await abrir(page, "/faqs");
    await capturar(
      page,
      "Preguntas frecuentes",
      "La sección está construida y es editable desde el panel; el texto todavía no está cargado (se perdió el anexo que lo traía)."
    );
  } finally {
    fs.writeFileSync(path.join(DESTINO, "pasos-sitio.json"), JSON.stringify(pasos, null, 2));
  }
});
