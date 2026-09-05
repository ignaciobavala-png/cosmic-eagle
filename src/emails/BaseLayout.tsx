import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";

/**
 * Marco comun de todos los mails, con la paleta del sitio.
 *
 * **La paleta se actualizo el 05/09/2026** al azul del rediseno de Julia. Hasta
 * ese dia los correos seguian en el sistema anterior (fondo casi negro `#05060a`
 * y tarjeta cafe oscura `#131410`), que es de donde tambien venia el embudo. Un
 * mail no puede importar Tailwind ni leer los tokens del `@theme` —los clientes
 * de correo no cargan hojas externas—, asi que la paleta va copiada a mano aca;
 * por eso cuando cambio el sistema visual, esta copia se quedo atras. **Si el
 * sitio vuelve a cambiar de paleta, este archivo hay que tocarlo a mano.**
 *
 * Tres reglas que no son cosmeticas y no hay que "limpiar":
 *
 * 1. **Todo va en tablas con `bgcolor`**, no solo `background-color` en CSS.
 *    Gmail app descarta fondos declarados por CSS en varios contextos y el mail
 *    aparece con el marco en blanco — justo el peor caso con una paleta oscura.
 * 2. **Las metas de `color-scheme` van si o si.** Sin ellas, iOS Mail y Gmail app
 *    aplican su transformacion automatica de modo oscuro y reescriben los colores
 *    a criterio propio.
 * 3. **Estilos inline, nunca `<style>` en el head.**
 */

// Paleta, en hex plano: en un mail no se puede confiar en alpha ni en variables.
//
// Los dos azules y el oro son los mismos de la pantalla de acceso y del embudo
// (`src/components/forms/styles.ts`). Los dos grises NO son hexes inventados:
// son el blanco translucido que usa el sitio, aplanado sobre el azul de la
// tarjeta, que es lo unico que un mail entiende.
export const c = {
  page: "#05125a", // el azul profundo del navbar y del embudo
  card: "#0a1f6e", // el segundo azul del degrade, para separar la tarjeta
  border: "#2c3e82", // el borde blanco al 14% del panel, aplanado sobre `card`
  // Sobre azul el oro va `primary-container` y no `primary-fixed-dim`: es la
  // regla del 28/08 (el #e3c37d de antes daba ~4:1 sobre estos fondos).
  gold: "#f9d78f", // --color-primary-container: titulos, links y acentos
  goldSolid: "#f9d78f", // fondo del CTA
  onGold: "#05125a", // texto sobre el CTA, igual que la pildora del sitio
  text: "#fff6eb", // --color-primary: el blanco calido del sistema
  muted: "#a9abbf", // el texto al 65%, aplanado sobre `card`
} as const;

/**
 * Las dos familias del sitio, con su cascada de respaldo.
 *
 * Se nombran igual que en la web aunque casi ningun cliente de correo las
 * tenga: el que las tenga instaladas las usa, y el resto cae en la fuente de
 * sistema de la misma familia. **No se pueden cargar por `@import` ni por
 * `<link>`** — es la regla 3 de arriba, nada de `<style>` en el head.
 *
 * Hasta el 05/09/2026 los mails eran Georgia de punta a punta, incluido el
 * cuerpo. En el sitio el cuerpo es Montserrat desde el 02/09; el serif quedo
 * donde corresponde, en los titulos.
 */
export const font = {

  display: "Domine, Georgia, 'Times New Roman', serif",
  body: "Montserrat, 'Helvetica Neue', Helvetica, Arial, sans-serif",
} as const;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cosmic-eagle.vercel.app";

export function BaseLayout({
  preview,
  children,
}: {
  /** Renglon que el cliente de correo muestra al lado del asunto. */
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="es">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: c.page }}>
        {/* Gmail app ignora el fondo del <body>: sin esta tabla el marco del
            mail queda blanco en el celular. */}
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          bgcolor={c.page}
          style={{ backgroundColor: c.page, width: "100%" }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: "32px 16px" }}>
                <Container style={{ maxWidth: "600px", margin: "0 auto" }}>
                  {/* El logo va como imagen con alt, pero nada importante vive
                      dentro de ella: Gmail bloquea imagenes de remitentes nuevos
                      y el mail tiene que seguir leyendose igual. */}
                  <Section style={{ textAlign: "center", paddingBottom: "24px" }}>
                    <Img
                      src={`${SITE_URL}/logo.png`}
                      alt="Cosmic Eagle Journey"
                      width="180"
                      style={{ margin: "0 auto", display: "block" }}
                    />
                  </Section>

                  <table
                    role="presentation"
                    width="100%"
                    cellPadding={0}
                    cellSpacing={0}
                    bgcolor={c.card}
                    style={{
                      backgroundColor: c.card,
                      border: `1px solid ${c.border}`,
                      borderRadius: "8px",
                      width: "100%",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ padding: "32px 28px" }}>
                          {children}
                          <Signature />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <Section style={{ padding: "24px 8px 0" }}>
                    <Text
                      style={{
                        margin: 0,
                        color: c.muted,
                        fontSize: "12px",
                        lineHeight: "18px",
                        textAlign: "center",
                        fontFamily: font.body,
                      }}
                    >
                      Cosmic Eagle Journey ·{" "}
                      <Link href={SITE_URL} style={{ color: c.gold }}>
                        cosmiceaglejourney.com
                      </Link>
                    </Text>
                  </Section>
                </Container>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}

/** Titulo del mail. */
export function Title({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 16px",
        color: c.gold,
        fontSize: "24px",
        lineHeight: "32px",
        fontWeight: 700,
        fontFamily: font.display,
      }}
    >
      {children}
    </Text>
  );
}

/** Parrafo. Uno por parrafo: un solo `<Text>` con saltos los colapsa. */
export function Paragraph({
  children,
  /**
   * Conserva los saltos de linea del contenido.
   *
   * Va en todo lo que la clienta carga como lista en un campo de texto (que
   * llevar, llegadas y salidas, los datos de una cuenta bancaria): sin esto el
   * HTML colapsa los saltos y "Ropa comoda / Una manta / Botella de agua" sale
   * como un renglon corrido. Gmail y Outlook respetan `pre-line`; el peor caso
   * es volver a ese renglon, no perder un dato.
   */
  preLine = false,
}: {
  children: React.ReactNode;
  preLine?: boolean;
}) {
  return (
    <Text
      style={{
        margin: "0 0 16px",
        color: c.text,
        fontSize: "16px",
        lineHeight: "26px",
        fontFamily: font.body,
        ...(preLine ? { whiteSpace: "pre-line" as const } : {}),
      }}
    >
      {children}
    </Text>
  );
}

/**
 * CTA. Es un `<a>` dentro de una tabla con `bgcolor`, y no el `<Button>` pelado
 * de react-email: ese es un `<a>` con el color solo en CSS, y varios clientes
 * moviles descartan fondos CSS sobre elementos inline — el boton sale con fondo
 * blanco, a veces si y a veces no. Tres capas del mismo color lo evitan.
 */
export function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  // El `bgcolor` va en la <table>: en los tipos de React existe en
  // TableHTMLAttributes pero no en TdHTMLAttributes, asi que en el <td> el
  // color va solo por CSS.
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      bgcolor={c.goldSolid}
      style={{ margin: "8px 0 20px", backgroundColor: c.goldSolid, borderRadius: "999px" }}
    >
      <tbody>
        <tr>
          <td
            align="center"
            style={{ backgroundColor: c.goldSolid, borderRadius: "999px" }}
          >
            <Link
              href={href}
              style={{
                display: "inline-block",
                // La pildora del sitio: redondeo completo, mayusculas y
                // tracking (`CtaLink variant="pill"`). El degrade dorado NO se
                // porta: Outlook descarta `linear-gradient` y el boton se
                // quedaria sin fondo, que es justo lo que las tres capas de
                // `bgcolor` estan evitando.
                padding: "14px 32px",
                color: c.onGold,
                backgroundColor: c.goldSolid,
                borderRadius: "999px",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                textDecoration: "none",
                fontFamily: font.display,
              }}
            >
              {children}
            </Link>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Firma de **todos** los correos, literal de la clienta (docs/COMUNICACIONES.md
 * §3). Va dentro del `BaseLayout` y no en cada template a proposito: es una
 * regla del documento —"firma de todos los correos"— y escribirla siete veces
 * garantiza que el octavo mail se olvide de ponerla.
 */
function Signature() {
  return (
    <Text
      style={{
        margin: "28px 0 0",
        color: c.muted,
        fontSize: "15px",
        lineHeight: "24px",
        fontFamily: font.body,
      }}
    >
      Con cariño,
      <br />
      Equipo Cosmic Eagle
      <br />
      <em>Un viaje hacia el Humano Luminoso.</em>
    </Text>
  );
}
