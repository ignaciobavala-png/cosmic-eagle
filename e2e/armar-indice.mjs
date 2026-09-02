/**
 * Arma el índice HTML del recorrido a partir de `pasos.json`, que deja
 * `capturas.escritura.spec.ts` junto a las capturas.
 *
 *   node e2e/armar-indice.mjs ["<carpeta>"]
 */
import fs from "node:fs";
import path from "node:path";

const dir =
  process.argv[2] ??
  process.env.CAPTURAS_DIR ??
  path.join(process.env.HOME, "Escritorio", "flujo de pagos y formulario");

const pasos = JSON.parse(fs.readFileSync(path.join(dir, "pasos.json"), "utf8"));
const fecha = new Date().toLocaleDateString("es-CL", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const esc = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const secciones = pasos
  .map(
    (p, i) => `
    <section class="paso" id="paso-${i + 1}">
      <div class="cabeza">
        <span class="numero">${String(i + 1).padStart(2, "0")}</span>
        <div>
          <h2>${esc(p.titulo)}</h2>
          <p class="detalle">${esc(p.detalle)}</p>
        </div>
        <span class="actor ${p.actor.startsWith("Estela") ? "panel" : ""}">${esc(p.actor)}</span>
      </div>
      <a href="${encodeURI(p.archivo)}" target="_blank" rel="noreferrer">
        <img src="${encodeURI(p.archivo)}" alt="${esc(p.titulo)}" loading="lazy">
      </a>
    </section>`
  )
  .join("\n");

const indice = pasos
  .map(
    (p, i) =>
      `<li><a href="#paso-${i + 1}">${String(i + 1).padStart(2, "0")} · ${esc(p.titulo)}</a></li>`
  )
  .join("\n");

fs.writeFileSync(
  path.join(dir, "index.html"),
  `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cosmic Eagle — el flujo de inscripción y pago</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: #05060a; color: #fff6eb;
    font-family: "Montserrat", system-ui, -apple-system, sans-serif;
    line-height: 1.6;
  }
  .cinta { background: linear-gradient(90deg, #05125a, #0079b3); padding: 40px 24px; }
  .ancho { max-width: 1080px; margin: 0 auto; }
  h1 { font-family: Georgia, "Times New Roman", serif; font-size: 34px; margin: 0 0 8px; color: #f9d78f; font-weight: 400; }
  .bajada { margin: 0; max-width: 62ch; opacity: .92; }
  .fecha { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; opacity: .7; margin: 0 0 14px; }
  .nota { border-left: 2px solid #b3964b; padding: 12px 18px; margin: 28px 0 0; background: rgba(179,150,75,.08); font-size: 14px; }
  .nota strong { color: #e3c37d; }
  nav { padding: 32px 24px 8px; }
  nav ol { columns: 2; gap: 32px; list-style: none; padding: 0; margin: 0; font-size: 14px; }
  nav a { color: #e3c37d; text-decoration: none; }
  nav a:hover { text-decoration: underline; }
  main { padding: 24px; }
  .paso { max-width: 1080px; margin: 0 auto 56px; scroll-margin-top: 20px; }
  .cabeza { display: flex; gap: 18px; align-items: flex-start; padding: 18px 0 14px; border-top: 1px solid rgba(227,195,125,.28); }
  .numero { font-family: Georgia, serif; font-size: 30px; color: #b3964b; line-height: 1; min-width: 46px; }
  h2 { font-family: Georgia, serif; font-size: 21px; margin: 0 0 4px; color: #f9d78f; font-weight: 400; }
  .detalle { margin: 0; font-size: 14.5px; opacity: .88; max-width: 68ch; }
  .actor { margin-left: auto; white-space: nowrap; font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
           border: 1px solid rgba(227,195,125,.5); color: #e3c37d; border-radius: 999px; padding: 5px 12px; }
  .actor.panel { border-color: rgba(0,121,179,.8); color: #6fc4f0; }
  img { width: 100%; display: block; border: 1px solid rgba(255,255,255,.1); border-radius: 6px; }
  footer { padding: 32px 24px 60px; text-align: center; font-size: 12px; opacity: .55; }
  @media (max-width: 700px) { nav ol { columns: 1; } .cabeza { flex-wrap: wrap; } .actor { margin-left: 0; } }
</style>
</head>
<body>
  <div class="cinta">
    <div class="ancho">
      <p class="fecha">Cosmic Eagle Journey · ${fecha}</p>
      <h1>El flujo de inscripción y pago, pantalla por pantalla</h1>
      <p class="bajada">
        Estas ${pasos.length} capturas son el recorrido real, tomado de forma automática sobre el sitio:
        una persona se inscribe a una experiencia, Estela la revisa y aprueba desde el panel,
        la persona ve los medios de cobro y sube el comprobante, Estela registra el pago y recién
        ahí se abre el formulario de salud. No son maquetas: cada pantalla es la aplicación andando.
      </p>
      <p class="nota">
        <strong>Dos cosas todavía no están:</strong> los correos automáticos están escritos y cableados
        pero no salen hasta verificar el dominio en Resend, y el cobro con tarjeta abre el link de
        Encuadrado —la confirmación del pago la hace Estela mirando el comprobante, como en la tiquetera—.
        Los datos bancarios que se ven son los cargados de prueba y se editan desde el panel.
      </p>
    </div>
  </div>

  <nav class="ancho"><ol>
${indice}
  </ol></nav>

  <main>
${secciones}
  </main>

  <footer>Generado desde el recorrido automatizado del sitio · i.vavala</footer>
</body>
</html>
`
);

console.log(`index.html armado con ${pasos.length} pasos en ${dir}`);
