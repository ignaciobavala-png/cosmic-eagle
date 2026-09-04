/**
 * Arma el visor HTML del recorrido a partir de los `pasos*.json` que dejan los
 * dos specs de capturas junto a las imágenes:
 *
 *   - `pasos-sitio.json`  ← capturas-sitio.lectura.spec.ts  (el sitio público)
 *   - `pasos.json`        ← capturas.escritura.spec.ts      (inscripción y pago)
 *
 *   node e2e/armar-indice.mjs ["<carpeta>"]
 *
 * Es un recorrido de a UNA pantalla por vez, no una página larga: se muestra
 * proyectado en una videollamada, donde el scroll se lee mal y la imagen tiene
 * que entrar entera. Se avanza con las flechas del teclado, con los botones o
 * desde el índice, y cada paso tiene su propio hash para poder volver a uno.
 *
 * El archivo queda autocontenido (todo el CSS y el JS adentro) y al lado de los
 * PNG: se abre con doble click, sin servidor.
 */
import fs from "node:fs";
import path from "node:path";

const dir =
  process.argv[2] ??
  process.env.CAPTURAS_DIR ??
  path.join(
    process.env.HOME,
    "Escritorio/things/cosmic-eagle-material",
    "capturas-flujo-inscripcion"
  );

function leer(archivo, capituloPorDefecto) {
  const ruta = path.join(dir, archivo);
  if (!fs.existsSync(ruta)) return [];
  return JSON.parse(fs.readFileSync(ruta, "utf8")).map((p) => ({
    ...p,
    capitulo: p.capitulo ?? capituloPorDefecto,
  }));
}

// El sitio primero y el embudo después: es el orden en que lo vive una persona.
const pasos = [
  ...leer("pasos-sitio.json", "El sitio"),
  ...leer("pasos.json", "La inscripción y el pago"),
];

if (!pasos.length) {
  console.error(`No hay ningún pasos*.json en ${dir}. Corré antes los specs de capturas.`);
  process.exit(1);
}

const fecha = new Date().toLocaleDateString("es-CL", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const capitulos = [...new Set(pasos.map((p) => p.capitulo))];

const esc = (t) =>
  String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const datos = JSON.stringify(
  pasos.map((p) => ({
    a: p.archivo,
    t: p.titulo,
    d: p.detalle,
    ac: p.actor,
    c: p.capitulo,
  }))
).replace(/</g, "\\u003c");

const listaIndice = capitulos
  .map((c) => {
    const items = pasos
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.capitulo === c)
      .map(
        ({ p, i }) =>
          `<li><button data-ir="${i}"><span class="num">${String(i + 1).padStart(
            2,
            "0"
          )}</span> ${esc(p.titulo)}</button></li>`
      )
      .join("");
    return `<section><h3>${esc(c)}</h3><ol>${items}</ol></section>`;
  })
  .join("");

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cosmic Eagle — el recorrido completo</title>
<style>
  :root {
    color-scheme: dark;
    --tinta: #fff6eb;
    --oro: #f9d78f;
    --oro-tenue: #e3c37d;
    --oro-hondo: #b3964b;
    --azul: #05125a;
    --celeste: #0079b3;
    --fondo: #05060a;
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0; background: var(--fondo); color: var(--tinta);
    font-family: "Montserrat", system-ui, -apple-system, sans-serif;
    line-height: 1.55; overflow: hidden;
  }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }

  /* ─── Portada ─────────────────────────────────────────────────────────── */
  #portada {
    position: fixed; inset: 0; z-index: 30; overflow: auto;
    background: linear-gradient(160deg, var(--azul), #020c41 55%, var(--fondo));
    display: grid; place-items: center; padding: 40px 24px;
  }
  #portada .caja { max-width: 720px; }
  #portada .sello { font-size: 11px; letter-spacing: .22em; text-transform: uppercase;
                    color: var(--oro-hondo); margin: 0 0 18px; }
  #portada h1 { font-family: Georgia, "Times New Roman", serif; font-weight: 400;
                font-size: clamp(30px, 4.4vw, 48px); line-height: 1.15; color: var(--oro);
                margin: 0 0 18px; }
  #portada p { margin: 0 0 16px; opacity: .9; }
  #portada .nota { border-left: 2px solid var(--oro-hondo); padding: 12px 18px;
                   background: rgba(179,150,75,.09); font-size: 14px; opacity: .95; }
  #portada .nota strong { color: var(--oro-tenue); }
  .empezar { margin-top: 28px; display: inline-flex; align-items: center; gap: 10px;
             background: linear-gradient(90deg, var(--oro), var(--oro-hondo));
             color: #2b2000; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
             font-size: 13px; padding: 14px 30px; border-radius: 999px; }
  .tecla { display: inline-block; border: 1px solid rgba(227,195,125,.5); border-radius: 5px;
           padding: 1px 7px; font-size: 12px; color: var(--oro-tenue); }

  /* ─── Visor ───────────────────────────────────────────────────────────── */
  /* Cuatro filas y no tres: header, la barra de avance, el lienzo y el pie. Con
     tres, la barra se queda con el 1fr y el lienzo cae en una fila implicita
     auto, o sea que la imagen desborda y el pie se le monta encima. */
  #visor { height: 100%; display: grid; grid-template-rows: auto auto minmax(0, 1fr) auto; }

  header { display: flex; align-items: center; gap: 16px; padding: 12px 20px;
           background: linear-gradient(90deg, var(--azul), var(--celeste));
           font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
  header .cap { color: var(--oro); font-weight: 600; }
  header .sep { opacity: .45; }
  header .cuenta { margin-left: auto; opacity: .85; font-variant-numeric: tabular-nums; }
  header button { opacity: .85; letter-spacing: .1em; text-transform: uppercase; font-size: 11px;
                  border: 1px solid rgba(255,255,255,.35); border-radius: 999px; padding: 5px 13px; }
  header button:hover { opacity: 1; border-color: var(--oro); color: var(--oro); }

  #barra { height: 2px; background: rgba(255,255,255,.12); }
  #barra i { display: block; height: 100%; background: var(--oro); transition: width .25s ease; }

  #lienzo { position: relative; min-height: 0; padding: 18px 64px; display: grid; place-items: center; }
  /* El link va a ALTO COMPLETO, no max-height: un porcentaje contra un padre de
     alto automatico se ignora, y la imagen desbordaba el lienzo montandose sobre
     el pie. Con alto definido, el max-height de la imagen ya tiene contra que
     resolverse. */
  #lienzo a { display: flex; align-items: center; justify-content: center;
              width: 100%; height: 100%; min-height: 0; }
  #lienzo img { max-width: 100%; max-height: 100%; object-fit: contain; display: block;
                border: 1px solid rgba(255,255,255,.12); border-radius: 6px;
                box-shadow: 0 20px 60px rgba(0,0,0,.55); }
  .flecha { position: absolute; top: 50%; transform: translateY(-50%); width: 46px; height: 46px;
            border-radius: 999px; border: 1px solid rgba(227,195,125,.35); color: var(--oro-tenue);
            display: grid; place-items: center; font-size: 20px; background: rgba(5,6,10,.6); }
  .flecha:hover { border-color: var(--oro); color: var(--oro); background: rgba(5,18,90,.8); }
  .flecha[disabled] { opacity: .2; cursor: default; }
  #anterior { left: 10px; } #siguiente { right: 10px; }

  footer { padding: 16px 24px 22px; border-top: 1px solid rgba(227,195,125,.22);
           display: flex; gap: 20px; align-items: flex-start; }
  footer .numero { font-family: Georgia, serif; font-size: 30px; color: var(--oro-hondo);
                   line-height: 1; min-width: 48px; }
  footer h2 { font-family: Georgia, serif; font-weight: 400; font-size: 20px; color: var(--oro);
              margin: 0 0 3px; }
  footer p { margin: 0; font-size: 14px; opacity: .86; max-width: 92ch; }
  .actor { margin-left: auto; white-space: nowrap; font-size: 11px; letter-spacing: .12em;
           text-transform: uppercase; border: 1px solid rgba(227,195,125,.5); color: var(--oro-tenue);
           border-radius: 999px; padding: 5px 12px; }
  .actor.panel { border-color: rgba(0,121,179,.85); color: #6fc4f0; }
  .actor.sitio { border-color: rgba(255,255,255,.3); color: rgba(255,246,235,.8); }

  /* ─── Índice ──────────────────────────────────────────────────────────── */
  /* Opaco de verdad: con el velo translucido las tarjetas de la captura de
     atras se leen entre los titulos del indice y no se entiende nada. */
  #indice { position: fixed; inset: 0; z-index: 20; background: #03050e;
            padding: 56px 40px 40px; overflow: auto; }
  #indice[hidden] { display: none; }
  #indice .grilla { max-width: 1180px; margin: 0 auto; columns: 3; column-gap: 40px; }
  #indice section { break-inside: avoid; margin: 0 0 26px; }
  #indice h3 { font-family: Georgia, serif; font-weight: 400; font-size: 15px; color: var(--oro);
               letter-spacing: .04em; margin: 0 0 8px; padding-bottom: 6px;
               border-bottom: 1px solid rgba(227,195,125,.25); }
  #indice ol { list-style: none; margin: 0; padding: 0; }
  #indice ol button { display: block; width: 100%; text-align: left; padding: 4px 0;
                      font-size: 13.5px; opacity: .82; }
  #indice ol button:hover { opacity: 1; color: var(--oro); }
  #indice .num { color: var(--oro-hondo); font-variant-numeric: tabular-nums; margin-right: 8px; }
  /* Absoluto contra el propio overlay (que ya es fixed) y no fixed suelto:
     asi queda pegado a su esquina pase lo que pase con el scroll del indice. */
  #indice .cerrar { position: absolute; top: 20px; right: 28px; font-size: 12px;
                    letter-spacing: .12em; text-transform: uppercase; color: var(--oro-tenue); }

  @media (max-width: 900px) {
    #lienzo { padding: 12px 12px 0; }
    .flecha { display: none; }
    footer { flex-wrap: wrap; gap: 12px; }
    footer .numero { font-size: 22px; min-width: 34px; }
    #indice .grilla { columns: 1; }
  }
</style>
</head>
<body>

<div id="portada">
  <div class="caja">
    <p class="sello">Cosmic Eagle Journey · ${fecha}</p>
    <h1>El recorrido completo, pantalla por pantalla</h1>
    <p>
      ${pasos.length} pantallas tomadas de forma automática sobre el sitio andando, no maquetas.
      Primero el recorrido público —la home, Nosotros, Experiencias, los contenidos— y después
      el embudo entero: una persona se inscribe a una experiencia, Estela la revisa y aprueba
      desde el panel, la persona ve los medios de cobro y sube el comprobante, Estela registra
      el pago y recién ahí se abre el formulario de salud.
    </p>
    <p style="font-size:14px;opacity:.75">
      Se avanza con <span class="tecla">→</span> y <span class="tecla">←</span>,
      el índice se abre con <span class="tecla">i</span> y la imagen se ve en tamaño real
      haciéndole click.
    </p>
    <p class="nota">
      <strong>Lo que todavía no está:</strong> los correos automáticos están escritos y cableados
      pero no salen hasta verificar el dominio en Resend; el cobro con tarjeta abre el link de
      Encuadrado y la confirmación del pago la hace Estela mirando el comprobante, como en la
      tiquetera. El detalle de una experiencia y el espacio personal todavía tienen el diseño anterior.
    </p>
    <p class="nota" style="border-color:#e3c37d">
      <strong>Ojo al compartir este archivo:</strong> la pantalla «Cómo pagar» muestra los medios de
      cobro tal como están cargados hoy en el panel, con los datos bancarios reales —titular, IBAN,
      RUT—. No es un archivo para reenviar fuera del equipo.
    </p>
    <button class="empezar" id="empezar">Empezar el recorrido →</button>
  </div>
</div>

<div id="visor">
  <header>
    <span class="cap" id="h-capitulo"></span>
    <span class="sep">·</span>
    <span id="h-titulo"></span>
    <span class="cuenta"><b id="h-n">01</b> / ${String(pasos.length).padStart(2, "0")}</span>
    <button id="abrir-indice">Índice</button>
  </header>
  <div id="barra"><i id="barra-i"></i></div>

  <div id="lienzo">
    <button class="flecha" id="anterior" aria-label="Anterior">‹</button>
    <a id="link" href="#" target="_blank" rel="noreferrer"><img id="foto" alt=""></a>
    <button class="flecha" id="siguiente" aria-label="Siguiente">›</button>
  </div>

  <footer>
    <span class="numero" id="f-n">01</span>
    <div>
      <h2 id="f-titulo"></h2>
      <p id="f-detalle"></p>
    </div>
    <span class="actor" id="f-actor"></span>
  </footer>
</div>

<div id="indice" hidden>
  <button class="cerrar" id="cerrar-indice">Cerrar ✕</button>
  <div class="grilla">${listaIndice}</div>
</div>

<script>
const PASOS = ${datos};
const $ = (id) => document.getElementById(id);
let i = 0;

function pintar(n, empujarHash = true) {
  i = Math.max(0, Math.min(PASOS.length - 1, n));
  const p = PASOS[i];
  const dosDigitos = String(i + 1).padStart(2, "0");

  $("h-capitulo").textContent = p.c;
  $("h-titulo").textContent = p.t;
  $("h-n").textContent = dosDigitos;
  $("f-n").textContent = dosDigitos;
  $("f-titulo").textContent = p.t;
  $("f-detalle").textContent = p.d;

  const actor = $("f-actor");
  actor.textContent = p.ac;
  actor.className = "actor " + (p.ac.startsWith("Estela") ? "panel" : p.ac === "Sitio público" ? "sitio" : "");

  $("foto").src = p.a;
  $("foto").alt = p.t;
  $("link").href = p.a;
  $("barra-i").style.width = ((i + 1) / PASOS.length) * 100 + "%";
  $("anterior").disabled = i === 0;
  $("siguiente").disabled = i === PASOS.length - 1;

  // La siguiente se precarga: proyectando, el parpadeo al avanzar se nota.
  if (PASOS[i + 1]) new Image().src = PASOS[i + 1].a;
  if (empujarHash) history.replaceState(null, "", "#" + (i + 1));
}

const abrirIndice = (abierto) => { $("indice").hidden = !abierto; };

$("siguiente").onclick = () => pintar(i + 1);
$("anterior").onclick = () => pintar(i - 1);
$("abrir-indice").onclick = () => abrirIndice(true);
$("cerrar-indice").onclick = () => abrirIndice(false);
$("indice").addEventListener("click", (e) => {
  const b = e.target.closest("[data-ir]");
  if (!b) return;
  pintar(Number(b.dataset.ir));
  abrirIndice(false);
});

$("empezar").onclick = () => { $("portada").remove(); pintar(i); };

addEventListener("keydown", (e) => {
  if (e.key === "Escape") { abrirIndice(false); return; }
  if ($("portada") && (e.key === "Enter" || e.key === " " || e.key === "ArrowRight")) {
    e.preventDefault(); $("empezar").click(); return;
  }
  if ($("portada")) return;
  if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); pintar(i + 1); }
  if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); pintar(i - 1); }
  if (e.key === "Home") pintar(0);
  if (e.key === "End") pintar(PASOS.length - 1);
  if (e.key.toLowerCase() === "i") abrirIndice($("indice").hidden);
});

// Un hash en la URL entra directo a ese paso, sin portada: sirve para retomar
// el recorrido donde quedó o para mandarle a alguien una pantalla puntual.
const desdeHash = Number(location.hash.slice(1));
if (desdeHash >= 1 && desdeHash <= PASOS.length) { $("portada").remove(); pintar(desdeHash - 1); }
else pintar(0, false);
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(dir, "index.html"), html);
console.log(
  `index.html armado con ${pasos.length} pasos (${capitulos.length} capítulos) en ${dir}`
);
