import { test, expect } from "@playwright/test";

/**
 * Las rutas publicas, sin sesion y sin escribir nada.
 *
 * Cubre lo que hasta ahora se verificaba a ojo o con curl: que cada pagina
 * responda, que el chrome global este, y las dos cosas que ya se rompieron una
 * vez —el reveal que deja contenido invisible y los anclajes que caen debajo
 * del navbar opaco—.
 */

const RUTAS = [
  { path: "/", titulo: /Cosmic Eagle/i },
  { path: "/nosotros", titulo: /Cosmic Eagle/i },
  { path: "/viajes", titulo: /Cosmic Eagle/i },
  { path: "/contenidos", titulo: /Contenidos/i },
  { path: "/faqs", titulo: /Preguntas frecuentes/i },
  { path: "/cuenta", titulo: /Cosmic Eagle/i },
];

for (const ruta of RUTAS) {
  test(`${ruta.path} carga con navbar y footer`, async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));

    const res = await page.goto(ruta.path);
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(ruta.titulo);

    await expect(page.locator("header").first()).toBeVisible();
    await expect(page.getByText("© 2026 Cosmic Eagle Journey")).toBeVisible();

    expect(errores, `errores de JS en ${ruta.path}`).toEqual([]);
  });
}

test("una ruta inexistente da 404", async ({ page }) => {
  const res = await page.goto("/no-existe-esta-ruta");
  expect(res?.status()).toBe(404);
});

/**
 * El bug del 28/08: `useScroll` delegado al motor nativo del browser hacia que
 * las palabras del scroll-story se desvanecieran justo cuando tenian que quedar
 * solas en pantalla. Se arreglo con `use-section-progress.ts`, y el sintoma era
 * invisible en el build: compila igual y se ve mal.
 *
 * La invariante NO es "todo visible al final": los bloques ligados al scroll
 * estan en opacidad 0 a proposito arriba de todo y se apagan de nuevo al pasar
 * de largo. Lo que tiene que cumplirse es que **cada bloque de texto llegue a
 * verse en algun punto del recorrido**. Eso es justo lo que el bug rompia.
 */
async function opacidadMaximaPorBloque(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __maxOpacidad: Map<Element, number> };
    w.__maxOpacidad = new Map();
  });

  const alto = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= alto; y += 250) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(70);
    await page.evaluate(() => {
      const w = window as unknown as { __maxOpacidad: Map<Element, number> };
      for (const el of document.querySelectorAll("main h1, main h2, main p")) {
        if (!el.textContent?.trim()) continue;
        // La opacidad efectiva es el producto de la cadena de ancestros: un
        // padre en 0 esconde al hijo aunque el hijo este en 1.
        let node: HTMLElement | null = el as HTMLElement;
        let efectiva = 1;
        while (node && node.tagName !== "BODY") {
          efectiva *= Number(getComputedStyle(node).opacity);
          node = node.parentElement;
        }
        w.__maxOpacidad.set(el, Math.max(w.__maxOpacidad.get(el) ?? 0, efectiva));
      }
    });
  }

  return page.evaluate(() => {
    const w = window as unknown as { __maxOpacidad: Map<Element, number> };
    const nuncaVisibles: string[] = [];
    for (const [el, max] of w.__maxOpacidad) {
      // El corte es 0.5 y no 1: el diseño de Julia atenua texto a proposito
      // (`opacity-85`, `opacity-90` en el panel doble de la home), y eso es
      // legitimo. Lo que se busca es texto que quede INVISIBLE — un reveal que
      // no dispara deja 0, no 0.85.
      if (max < 0.5) {
        nuncaVisibles.push(`${(el.textContent ?? "").trim().slice(0, 60)} (max ${max.toFixed(2)})`);
      }
    }
    return nuncaVisibles;
  });
}

for (const ruta of ["/", "/nosotros", "/viajes", "/faqs"]) {
  test(`recorrer ${ruta} no deja bloques que nunca se vean`, async ({ page }) => {
    await page.goto(ruta);
    await page.waitForLoadState("load");

    const nuncaVisibles = await opacidadMaximaPorBloque(page);

    expect(
      nuncaVisibles,
      `en ${ruta} hay texto que nunca llega a verse en todo el recorrido`
    ).toEqual([]);
  });
}

/**
 * El navbar es una banda OPACA de 84px. Sin `scroll-padding-top` cualquier
 * anclaje deja el arranque de la seccion debajo de el — y `#sesiones` y
 * `#viajes` son la navegacion principal a Experiencias.
 */
test("los anclajes no caen debajo del navbar", async ({ page }) => {
  await page.goto("/viajes");
  await page.waitForLoadState("load");

  for (const ancla of ["sesiones", "viajes", "salud"]) {
    await page.evaluate((id) => { location.hash = `#${id}`; }, ancla);
    await page.waitForTimeout(900);

    const { top, navbar } = await page.evaluate((id) => ({
      top: document.getElementById(id)!.getBoundingClientRect().top,
      navbar: document.querySelector("header")!.getBoundingClientRect().height,
    }), ancla);

    expect(Math.round(top), `#${ancla} quedo tapado por el navbar`).toBeGreaterThanOrEqual(
      Math.round(navbar) - 2
    );
  }
});

test("/faqs: el acordeón abre y cierra", async ({ page }) => {
  await page.goto("/faqs");

  const preguntas = page.locator("#preguntas details");
  const cuantas = await preguntas.count();

  if (cuantas === 0) {
    // Estado esperado mientras la clienta no cargue el texto (docs/FAQS.md §3).
    await expect(page.getByText(/Estamos preparando esta sección/i)).toBeVisible();
    test.skip(true, "todavia no hay preguntas cargadas");
    return;
  }

  const primera = preguntas.first();
  const respuesta = primera.locator("div").first();
  await expect(respuesta).toBeHidden();
  await primera.locator("summary").click();
  await expect(respuesta).toBeVisible();
  await primera.locator("summary").click();
  await expect(respuesta).toBeHidden();
});
