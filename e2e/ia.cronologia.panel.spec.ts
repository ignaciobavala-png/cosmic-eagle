import { test, expect } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";

/**
 * Auditoria de cronologia del asistente de IA: que no confunda lo que YA
 * sucedio con lo que viene. Hace preguntas con trampa contra los datos reales
 * y deja las respuestas en `test-results/ia-cronologia.md` para leerlas.
 *
 * Llama a DeepSeek de verdad (centavos por corrida) y no escribe nada en el
 * negocio. Las asserts son solo las que se pueden fijar sin ambiguedad; lo
 * demas se lee a mano en el reporte.
 */
test.setTimeout(180_000);

const PREGUNTAS: { id: string; pregunta: string }[] = [
  { id: "separar", pregunta: "¿Qué sesiones y retiros ya sucedieron y cuáles vienen? Separalos y decime cuánto falta para el próximo. Contestá corto." },
  { id: "pasado-con-cupo", pregunta: "¿Cuántos lugares libres quedan en el retiro de Los Vilos?" },
  { id: "dias", pregunta: "¿Cuántos días faltan para el retiro de la Reserva Natural Dos Ojos?" },
  { id: "octubre", pregunta: "¿Cuántas sesiones hubo en octubre y de qué ciudad?" },
  { id: "contenido-ego", pregunta: "¿Qué dice la organización sobre el ego? Citá en qué artículo lo dice. Contestá corto." },
  { id: "contenido-integracion", pregunta: "¿Qué recomiendan para la integración después del viaje? Basate en los artículos." },
  { id: "contenido-inexistente", pregunta: "¿Qué dicen los artículos sobre el ayuno de dopamina?" },
  { id: "mapa-sitio", pregunta: "¿Qué páginas tiene el sitio público y qué hay en cada una? Contestá corto." },
  { id: "viajeros", pregunta: "¿Cuántas personas ya viajaron con nosotros? Explicame cómo lo contás." },
];

const resultados: string[] = [];

for (const { id, pregunta } of PREGUNTAS) {
  test(`cronologia: ${id}`, async ({ page }) => {
    await page.goto("/admin/ia");
    await page.getByLabel("Mensaje para el asistente").fill(pregunta);
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByRole("button", { name: "Enviar" })).toBeVisible({ timeout: 150_000 });

    const respuesta = (await page.locator(".glass-card .space-y-2").last().innerText()).trim();
    resultados.push(`## ${id}\n\n**Pregunta:** ${pregunta}\n\n${respuesta}\n`);
    mkdirSync("test-results", { recursive: true });
    writeFileSync("test-results/ia-cronologia.md", `# Auditoría de cronología\n\n${resultados.join("\n---\n\n")}`);

    expect(respuesta.length).toBeGreaterThan(10);

    // Un evento que ya paso no tiene "lugares libres".
    if (id === "pasado-con-cupo") {
      expect(respuesta, "no debería dar lugares libres de un evento pasado").not.toMatch(/quedan\s+\d+\s+lugares/i);
    }
  });
}
