"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Dibuja un HTML subido por la organizacion (29/10).
 *
 * `sandbox` **sin `allow-same-origin`**: el documento corre con un origen
 * opaco, asi su script no lee cookies, no toca la sesion de Supabase ni llama
 * al panel con las credenciales de quien mira. Si alguna vez se agrega
 * `allow-same-origin`, el aislamiento desaparece: no hacerlo.
 *
 * Desde afuera no se puede medir el alto de un iframe de otro origen, asi que
 * se le inyecta un script chico que avisa su altura por `postMessage`. El
 * iframe viene en el HTML del servidor y puede cargar **antes de que React
 * hidrate**: el aviso se perderia, asi que el padre se la pide al montar.
 */
const RESIZER = `<script>(function(){function s(){parent.postMessage({ceHeight:document.documentElement.scrollHeight},"*")}addEventListener("load",s);addEventListener("message",function(e){if(e.data==="ceAsk")s()});new ResizeObserver(s).observe(document.documentElement);s()})()</script>`;

export function HtmlFrame({
  html,
  title,
  className = "",
  fill = false,
}: {
  html: string;
  title: string;
  className?: string;
  /**
   * El iframe ocupa la pantalla y el documento scrollea por dentro, sin
   * medirlo. Para HTML que usa unidades `vh` (portada `min-height:100vh`):
   * con el alto atado al contenido, `100vh` pasa a ser el alto del iframe y
   * el documento crece sin fin (05/11, /material/the-cosmic-game).
   */
  fill?: boolean;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  const srcDoc = useMemo(() => {
    const idx = html.toLowerCase().lastIndexOf("</body>");
    return idx === -1 ? html + RESIZER : html.slice(0, idx) + RESIZER + html.slice(idx);
  }, [html]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== ref.current?.contentWindow) return;
      const h = (event.data as { ceHeight?: unknown } | null)?.ceHeight;
      if (typeof h === "number" && h > 0) setHeight(Math.ceil(h));
    }
    window.addEventListener("message", onMessage);
    ref.current?.contentWindow?.postMessage("ceAsk", "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      loading="lazy"
      onLoad={(event) => event.currentTarget.contentWindow?.postMessage("ceAsk", "*")}
      style={fill ? undefined : { height: height ?? undefined }}
      className={`block w-full border-0 bg-white ${
        fill ? "h-dvh" : height ? "" : "min-h-[70vh]"
      } ${className}`}
    />
  );
}
