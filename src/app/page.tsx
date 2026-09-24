import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { ImmersiveHero } from "@/components/ui/ImmersiveHero";
import { ScrollStory } from "@/components/ui/ScrollStory";
import { MediaStatement } from "@/components/ui/MediaStatement";
import { CreamSection, GOLD } from "@/components/ui/CreamSection";
import { CtaLink } from "@/components/ui/CtaLink";
import { Reveal, RevealItem, RevealLine } from "@/components/ui/Reveal";
import { TitleRule } from "@/components/ui/TitleRule";
import { getSiteContent, isEnabled } from "@/lib/site-content";

/**
 * Home según el rediseño de Julia (`HOMEPAGE.html`, ver
 * docs/REDISENO_JULIA_HTML.md §2), simplificada por pedido de la
 * organización (23/09, `docs/entregas/2026-09-23-feedback-org/`): el home
 * público deja de mostrar la cartelera, el panel Sesiones/Viajes y los
 * testimonios — esa profundidad queda en /viajes. Ver
 * `docs/ARQUITECTURA_ACCESO_PUBLICO.md`.
 *
 * Recorrido: hero → frase manifiesto → relato que se destila con el scroll →
 * frase sobre imagen → Nuestro propósito → Contenidos → cierre.
 *
 * Las keys de los slots se conservan aunque la sección cambie, para no perder lo
 * que la clienta ya subió: `home.frase.*` pasa a ser la frase manifiesto grande
 * y `home.promesas.image` el fondo de la frase atmosférica.
 */
export default async function Home() {
  const content = await getSiteContent();

  return (
    <>
      <Header />
      {/* `snap-bands` NO es una utilidad de Tailwind: es la marca que hace que
          en MOBILE cada hijo directo del `main` sea una banda con su punto de
          enganche del scroll, y que el scroll se enganche a ellas (la regla
          vive en globals.css, buscar "snap-bands"). Es el pedido de Sofia del
          16/09: en el telefono una pantalla tiene que mostrar UN fondo, no la
          cola del azul + el azul del panel + el arranque del dorado.

          Va sobre el `main` y no sobre `html` para que sea de ESTA pagina: el
          resto del sitio no cambia de comportamiento. */}
      <main className="snap-bands pt-[var(--navbar-h)]">
        {/* **Sin indicador de scroll** (pedido de Ignacio, 16/09): el hero se
            queda con la imagen sola, sin el "Descubrir" con la flechita. Es el
            mismo criterio con el que el 15/09 se le saco el indicador a la
            frase atmosferica. El `id="manifiesto"` de la seccion de abajo NO se
            borra: lo usa el recorrido de capturas. */}
        <ImmersiveHero
          image={content("home.hero.image")}
          imageAlt="Figura de partículas mirando hacia el cosmos"
          height="full"
          // Pedido de la organización, 23/09: "mucho más lento... la sensación
          // general debe ser lenta, profunda, elegante y contemplativa". A la
          // mitad de velocidad, sin recortar el clip.
          videoRate={0.5}
        />

        {/* Frase manifiesto: pantalla completa, tipografía grande, sin imagen.
            El degradé termina en el mismo tono con el que arranca el relato para
            que el pasaje entre las dos pantallas sea continuo. */}
        <Reveal
          as="section"
          id="manifiesto"
          amount={0.3}
          stagger={0.15}
          // Pedido de la organización, 23/09: "queda demasiado espacio azul
          // entre el título principal y el texto que viene debajo" — bajamos
          // el padding de 24 a 12, pero con `items-center` la frase sigue
          // centrada en su propia pantalla y la mitad de abajo queda vacía
          // igual. Ignacio insiste el 24/09 ("sigo viendo mucha distancia"):
          // `items-end` acerca la frase al borde de ABAJO en vez de sólo
          // recortar el padding, que es lo que realmente conecta con el
          // relato. El resto de la pantalla, arriba, se queda con el aire que
          // tenía — la frase entra igual de "pantalla completa", sólo que
          // apoyada contra el piso en vez de flotando en el medio.
          //
          // Ese `min-h-[100svh]` + `items-end` en un telefono alto deja el
          // hueco vacio ARRIBA en vez de abajo (reporte de Ignacio, 24/09,
          // captura mobile: "todo el espacio que sobra"). En mobile la
          // seccion no necesita ocupar la pantalla entera — eso era para que
          // la frase "entrara pantalla completa" en desktop — asi que ahi se
          // centra sobre su propio contenido con padding parejo, y el efecto
          // full-screen apoyado abajo queda solo de `md` para arriba.
          className="flex w-full items-center bg-[linear-gradient(to_bottom,#0079b3_0%,#05125a_65%,#011360_100%)] px-[6vw] py-20 md:min-h-[100svh] md:items-end md:pt-12 md:pb-24"
        >
          {/* Las dos lineas entran por separado, la segunda 0.15s despues:
              es el `transition-delay` que Julia le pone al `.line-reveal` que
              sigue. Van de 40px y en 1.6s, mas lento que el resto del sitio. */}
          {/* El ancho de la caja y el tope de la escala van juntos: la
              corrección del 03/09 pide que en escritorio la frase entre en DOS
              líneas (una por mitad), y con el `clamp` anterior (9vw, tope 5rem)
              cada mitad envolvía sola. La medida del texto crece con el
              viewport igual que la caja — por eso el tamaño es sobre todo `vw`
              y el tope está calculado contra los 80rem de la caja, no elegido a
              ojo: 4rem × ~34 caracteres queda debajo de 1280px. */}
          <div className="mx-auto w-full max-w-[80rem]">
            {/* Los colores van en este orden y no al reves: en el mockup
                (`.about-statement`) la PRIMERA linea es crema y la segunda
                dorada en italica. Estaban invertidos y es la correccion del
                02/09 de Julia. */}
            {/* El `1.04` del mockup esta calculado para un cuerpo de 80px; nosotros
                bajamos la escala a 64 para que cada mitad entre en UNA linea
                (correccion del 03/09), y el interlineado se encogio con ella:
                quedaban 2,5px de aire entre las dos frases, medidos. En
                escritorio cada mitad es una sola linea, asi que este valor no
                controla nada mas que el hueco entre las dos — de 2,5px a 13.
                Es una desviacion del mockup, avisada. */}
            {/* `text-h1` (token de globals.css, 24/09): es la frase que
                Sofia marcó como el h1 de la página al definir el sistema de
                escala. Mismo tamaño que tenía en duro, ahora nombrado. */}
            <h1 className="font-display text-h1 text-primary">
              <RevealItem as="span" className="inline-block" y={40} duration={1.6}>
                {content("home.frase.left")}
              </RevealItem>
              <br />
              <RevealItem as="span" className="inline-block" y={40} duration={1.6}>
                <em className="italic text-primary-container">
                  {content("home.frase.right")}
                </em>
              </RevealItem>
            </h1>
          </div>
        </Reveal>

        {/* El texto y las cuatro frases son los de la entrega del 04/09, que es
            la version definitiva de esta pantalla. Las frases resaltadas son
            FRASES y no palabras sueltas ("potencial evolutivo", no
            "potencial"): cada una viaja entera al centro, y sueltas no
            significan nada en la lista final. */}
        <ScrollStory
          id="relato"
          paragraphs={[
            "Los seres humanos estamos en constante evolución. A medida que expandimos nuestra conciencia, comenzamos a descubrir que somos mucho más que nuestra historia personal, nuestra mente o la realidad que percibimos a través de los sentidos.",
            "Nuestro trabajo explora este potencial evolutivo y la naturaleza multidimensional de la experiencia humana: nuestra capacidad de transformarnos, de acceder a niveles más profundos de inteligencia y de reconectar con la dimensión del alma.",
            "Desde esta perspectiva, la evolución humana pasa a ser parte de un campo de conciencia mucho más amplio, abriendo un camino hacia un conocimiento más profundo, la sabiduría cósmica y una comprensión expandida de quiénes y qué somos.",
          ]}
          keywords={[
            { text: "conciencia" },
            { text: "potencial evolutivo" },
            { text: "dimensión del alma" },
            { text: "un conocimiento más profundo" },
            { text: "sabiduría cósmica" },
          ]}
          // El calendario y la cartelera de home se sacaron (pedido de la
          // organización, 23/09: "sacar del home público sesiones, viajes,
          // calendario y testimonios"). El CTA pasa a llevar directo a
          // Experiencias.
          cta={{ label: "Explorar experiencias", href: "/viajes" }}
        />

        {/* Julia pidió imagen a pantalla completa con una frase encima. La key
            del slot es la de las cuatro promesas, que el rediseño elimina. */}
        <MediaStatement
          id="atmosferica"
          image={content("home.promesas.image")}
          imageAlt="Figura en meditación con un núcleo de luz dorada"
          text={content("home.atmos.text")}
          veil={0.35}
          overlay={isEnabled(content("home.promesas.overlay"))}
          height={900}
          // En mobile ocupa la pantalla entera; los 900px fijos del mockup
          // valen de `md` para arriba. Ver `mobileFull` en el componente.
          mobileFull
          // `text-h2`: acá es donde de verdad vive "Un camino hacia un
          // conocimiento más profundo" (slot `home.atmos.text`, pedido de
          // Ignacio 24/09 — que pese igual que el cierre "Cuando el alma
          // está lista..."). Antes era 22-28px, bastante más chico.
          textClassName="text-h2"
          // La frase va DORADA y no en el blanco cálido (pedido de Sofía,
          // 11/09). Es el token `primary-container`, el mismo oro que el resto
          // del sitio usa sobre fondo azul — no el `primary-fixed-dim` de
          // acento (regla del 28/08). El texto en sí lo carga ella desde
          // /admin/multimedia (slot `home.atmos.text`), acá sólo va el color.
          textColorClassName="text-primary-container"
          // Sin indicador de scroll: hasta el 15/09 el pie del banner llevaba
          // "Nuestro proposito" con su flechita, y Ignacio lo saco — la frase
          // se queda sola sobre la imagen. La seccion #proposito sigue abajo y
          // se llega por scroll; el ancla no se borra porque la usa el menu.
        />

        <Reveal
          as="section"
          id="proposito"
          amount={0.3}
          stagger={0}
          className="relative flex min-h-[100svh] w-full flex-col items-center justify-center bg-[linear-gradient(180deg,#0a1660_0%,#05125a_55%,#030b38_100%)] px-6 pb-[90px] pt-[100px] text-center md:pb-[120px] md:pt-[140px]"
        >
          {/* Umbral 0.3. El titulo y la linea van juntos en 1.6s; la linea
              crece de 0 a 70px en ese mismo tiempo (en la home SI crece, en
              /viajes es estatica). El cuerpo todavia entra como un bloque: el
              efecto real es palabra por palabra, agrupadas por renglon, y esta
              pendiente como paso aparte. */}
          <div className="mx-auto w-full max-w-3xl">
            <RevealItem y={30} duration={1.6}>
              {/* `text-h2`: mismo tamaño que tenía en duro (34px/56px),
                  ahora nombrado en el token de globals.css. */}
              <h2 className="font-display text-h2 font-bold tracking-[0.5px] text-primary-container">
                Nuestro propósito
              </h2>
            </RevealItem>
            {/* Filete fino que se desvanece en las puntas (pedido de Sofia,
                12/09): el oro solido de 70px se leia como un subrayado corto.
                Va mas larga y con degrade a transparente en los dos extremos,
                asi que el 1px de alto se percibe todavia mas delgado. El oro
                pleno queda en el centro. `RevealLine` la sigue haciendo crecer
                desde la izquierda, como todas las lineas del sitio. */}
            <RevealLine
              duration={1.6}
              className="mx-auto mt-4 h-px w-[120px] bg-[linear-gradient(to_right,transparent_0%,var(--color-primary-container)_50%,transparent_100%)] md:mt-5 md:w-[160px]"
            />
            {/* Texto reemplazado a pedido de la organización (23/09): tiene
                que declarar PARA QUÉ existe Cosmic Eagle Journey, no describir
                solamente lo que hace. Mismo copy que /nosotros. */}
            <RevealItem y={30} duration={0.9} delay={0.45}>
            {/* Pedido de Sofia (24/09): resaltar SOLO estas 4 palabras
                sueltas — evolución, transformar, conciencia, alma — y nada
                más. Antes se resaltaba la frase entera "impulsar la
                evolución... expandir su conciencia", que era mucho más que
                lo que pidió. */}
            <p className="mx-auto mt-[30px] max-w-[640px] text-[16px] leading-[1.8] tracking-[0.3px] text-[#d0c5b4] md:mt-[50px] md:text-[20px] md:leading-[1.9]">
              Nuestro propósito es impulsar la{" "}
              <span className="text-primary-container">evolución</span>{" "}
              humana, creando espacios que permitan a cada persona{" "}
              <span className="text-primary-container">transformar</span> su
              realidad, expandir su{" "}
              <span className="text-primary-container">conciencia</span> y
              profundizar la conexión con su{" "}
              <span className="text-primary-container">alma</span>.
            </p>
            </RevealItem>
            <RevealItem y={30} duration={0.9} delay={0.75}>
              <CtaLink
                href="/nosotros"
                className="mt-[50px] px-7 py-3.5 text-[14px] md:mt-20 md:px-10 md:py-4"
              >
                Ir más profundo
              </CtaLink>
            </RevealItem>
          </div>
        </Reveal>

        {/* El panel Sesiones/Viajes y los testimonios de "Voces de Luz" se
            sacaron del home público a pedido de la organización (23/09):
            siguen existiendo en /viajes, no en la puerta de entrada. Ver
            `docs/ARQUITECTURA_ACCESO_PUBLICO.md`. */}

        {/* Contenidos: la puerta a /contenidos. Título y copy actualizados
            (pedido de la organización, 23/09): pasa a llamarse "Contenidos" y
            el texto ya no describe metodologías, sino que invita a
            profundizar. La composición en dos columnas (texto izquierda /
            frase destacada derecha) que pide el doc queda para una pasada de
            diseño aparte — acá se resuelve sólo el copy y el título.

            Umbral 0.25 y un solo observador para texto e imagen: en el mockup
            entran juntos. Titulo, linea e imagen a 0ms; los tres parrafos a
            150/300/450 y el boton a 600. La imagen ademas escala desde 0.98. */}
        {/* En mobile la sección tiene que entrar en UNA pantalla, con el texto
            centrado en vertical (fix v3 de Julia, docs/entregas/2026-09-03-julia).
            En escritorio no cambia nada: sigue siendo el par texto/imagen. */}
        {/* El fondo de ESTA franja no es el crema del sitio: es la banda
            dorada (`GOLD`), el mismo degrade `#f9d78f → #b3964b` de la pildora y
            del cierre de la home. Lo eligio Sofia el 11/09 sobre un comparador
            de ocho fondos ("el crema no, que vaya mas hacia el golden"). Va por
            la prop `background` y NO por `className`: dos utilidades de fondo de
            la misma especificidad las resuelve el orden de la hoja generada.

            Fue la primera franja con este fondo y desde el 15/09 hay una
            segunda, la biblioteca de /contenidos, como prueba antes de decidir
            si el dorado reemplaza al crema en todo el sitio. El resto
            (/nosotros, /viajes, el detalle, /faqs y las legales) sigue con el
            crema.

            Sobre el dorado hay dos piezas que dejan de verse y por eso cambian
            con el: el filete pasa al oro oscuro (el claro da 1,00:1 sobre este
            fondo, o sea invisible) y el boton pasa a la pildora azul, porque la
            dorada se funde. */}
        {/* Pedido de Sofia (24/09): "que el slide contenidos ocupe el alto
            de la pantalla 1:1" — antes era pantalla completa solo en mobile
            (`max-md:`), ahora en cualquier ancho.
            `relative`: la imagen se pinea contra el borde REAL de la sección
            (ver más abajo), no contra la fila de texto. */}
        <CreamSection
          id="tecnologia"
          background={GOLD}
          full={false}
          className="relative flex min-h-[100svh] items-center"
          reveal={{ amount: 0.25, stagger: 0 }}
        >
          <div className="mx-auto flex w-full max-w-narrative flex-col items-center gap-12 md:flex-row md:gap-16">
            <div className="w-full md:flex-1">
              {/* El `w-fit` envuelve al titulo Y al filete: es lo que hace
                  que el filete mida el renglon mas largo del titulo —que aca
                  esta partido a mano con `<br>`— y no el ancho de la columna.
                  Envolver solo al filete no sirve: `w-full` dentro de `w-fit`
                  no tiene de donde sacar el ancho. */}
              <div className="w-fit">
                <RevealItem duration={0.8}>
                  {/* El quiebre en dos renglones es fijo, no un wrap por ancho:
                      es decisión de diseño de la v2 del fix. */}
                  {/* `text-h3`: Sofia aclaró (24/09) que este título NO puede
                      ser el mismo nivel que "Nuestro propósito" ("no es
                      simétrico"), así que queda un escalón debajo en el
                      sistema h1/h2/h3 en vez de igualar su tamaño. */}
                  <h2 className="mb-3.5 font-display text-h3 font-bold text-[#05125a] md:mb-3">
                    Contenidos
                  </h2>
                </RevealItem>
                {/* Oro oscuro y no el claro: sobre el fondo dorado el filete
                    claro da 1,00:1 y no se ve. */}
                <TitleRule tone="goldDark" grow className="mb-5 md:mb-6" />
              </div>
              {/* El cuerpo va AZUL, no negro. Hasta el 11/09 era negro puro en
                  mobile y gris #333 en escritorio, que era spec explícita de
                  Julia (fix v3 del 03/09); lo cambió Sofía, que lo veía negro.
                  Sobre la banda dorada el azul mide 5,95:1 en el punto más
                  oscuro del degradé contra los 4,44:1 del gris, que estaba
                  abajo del mínimo legible. Desde el 16/09 el azul es la regla
                  de TODO el cuerpo sobre fondo claro —no queda gris en el
                  sitio—, por pedido de Sofía: "texto negro no es parte del
                  manual". Conviene avisarle a Julia. */}
              {/* Subido junto con el título (24/09): "que todas las letras
                  sean relativamente un poquito más grandes para que quede
                  compensado con que el slide ahora es más alto". */}
              <div className="space-y-5 text-[clamp(15px,4vw,17px)] leading-[1.8] text-[#05125a] md:max-w-[480px] md:space-y-6 md:text-[18px]">
                <RevealItem duration={0.8} delay={0.15}>
                  <p>
                    Compartimos contenidos creados para acompañar cada etapa
                    del camino, integrar los aprendizajes y profundizar en el
                    propio proceso evolutivo.
                  </p>
                </RevealItem>
              </div>
              <RevealItem duration={0.8} delay={0.6}>
                {/* El MISMO boton que el "Ir mas profundo" de "Nuestro
                    proposito" (pedido de Ignacio, 11/09: coherencia de pagina):
                    la variante `outline` que eligio Sofia el 09/09, con su
                    mismo padding y cuerpo. Lo unico que cambia es el color, que
                    en `outline` lo pone quien lo usa y arrastra el contorno
                    (`border-current`): alla va dorado sobre azul, aca azul
                    sobre el fondo dorado. Antes era la pildora dorada, que
                    sobre este fondo se fundia. */}
                <CtaLink
                  href="/contenidos"
                  tone="dark"
                  className="mt-10 px-7 py-3.5 text-[15px] md:px-10 md:py-4"
                >
                  Ir más profundo
                </CtaLink>
              </RevealItem>
            </div>

            {/* En mobile la imagen se oculta ENTERA y queda solo el texto
                (`.tec-image` es `display:none` abajo de 768px en el mockup).
                Antes se apilaba arriba del texto. Acá sólo queda un espaciador
                del mismo ancho (`flex-1`, invisible) para que la columna de
                texto conserve su proporción de dos columnas: la imagen de
                verdad se mudó fuera de esta fila (ver más abajo). */}
            <div className="hidden w-full flex-1 md:block" aria-hidden="true" />
          </div>

          {/* Pedido de Sofía (reunión del 20/09): el corte recto de abajo de
              la imagen "no le convencía" — quería que apoyara contra el borde
              de ABAJO de la sección, para que coincida con el límite real de
              la franja dorada y no quede colgando en el medio.
              Vive FUERA de la fila de texto (a diferencia de antes) porque
              desde que la sección pasó a `min-h-[100svh]` con `items-center`
              (pedido de Sofía, 24/09: "que ocupe el alto de pantalla 1:1"), la
              fila entera queda centrada verticalmente con aire de sobra
              arriba y abajo — el viejo truco (`self-end` + `-mb-24` cancelando
              el `py-24` de `CreamSection`) anclaba contra el borde de la FILA,
              no de la SECCIÓN, y con la fila centrada la imagen quedaba
              flotando de nuevo. Por eso pasa a `absolute bottom-0` contra la
              sección (que ahora es `relative`), con su propio contenedor
              `max-w-narrative` para caer en la misma columna que ocupaba
              dentro de la fila (el padding horizontal de `CreamSection` es
              simétrico, así que centrar sobre el ancho completo de la sección
              da la misma posición que centrar sobre su columna con padding). */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto hidden w-full max-w-narrative md:flex md:gap-16">
            <div className="flex-1" aria-hidden="true" />
            <RevealItem
              className="w-full flex-1"
              y={0}
              duration={1}
              scaleFrom={0.98}
            >
              <div className="relative aspect-[4/4.4] w-full overflow-hidden rounded-xl">
                {/* `object-top` y no centrado, por lo mismo que el hero de la
                    home (20/08): la caja (4/4.4 = 0,909) es mas apaisada que la
                    figura (900x1195 = 0,753), asi que `cover` escala por el
                    ancho y le sobra alto. Centrado recorta 8,6% arriba y 8,6%
                    abajo, y la cabeza empieza al 9% de la imagen — se la comia
                    siempre. Anclada arriba, todo el recorte cae en el pie,
                    donde la figura ya se deshace en particulas. */}
                {/* `scale-x-[-1]`: pedido de Sofia (24/09), "la chica de
                    contenidos que mire para el otro lado, efecto espejo". No
                    afecta el recorte de `object-top`: el flip es puramente
                    horizontal. */}
                <Image
                  src={content("home.tecnologia.image")}
                  alt="Portal de luz"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="scale-x-[-1] object-cover object-top"
                />
              </div>
            </RevealItem>
          </div>
        </CreamSection>

        <MediaStatement
          image={content("home.cierre.image")}
          imageAlt="Amanecer sobre el horizonte"
          // Frase de cierre pedida por la organización, 23/09: "un cierre
          // limpio, simple y contemplativo, sin agregar más información
          // después".
          text="Cuando el alma está lista, el camino aparece."
          veil={0.3}
          overlay={isEnabled(content("home.cierre.overlay"))}
          // Pedido de Sofia (24/09): agrandar la frase y que ocupe 1 pantalla
          // completa. Antes era 600px fijos (`mobileFull` para tapar el
          // hueco solo en mobile); sin `height` el componente cae en su
          // default `min-h-[100svh]`, pantalla completa en cualquier ancho.
          textClassName="text-h2"
          // Dorada, no el blanco cálido por defecto — Sofía la marcó el 20/09
          // como la frase que quedó afuera de la coherencia que ya tiene
          // "Atmosférica" (pedido del 11/09, misma regla: `primary-container`
          // y no `primary-fixed-dim`, ver ese comentario más arriba).
          textColorClassName="text-primary-container"
        />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
