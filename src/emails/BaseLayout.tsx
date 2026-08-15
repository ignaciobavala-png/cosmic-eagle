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
 * Marco comun de todos los mails, con la paleta del sitio (Aetheric Mysticism).
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
export const c = {
  page: "#05060a", // el remate oscuro del degrade del sitio
  card: "#131410", // --color-surface
  border: "#4d4639", // --color-outline-variant
  gold: "#e3c37d", // --color-primary-fixed-dim: titulos y acentos
  goldSolid: "#f9d78f", // --color-primary-container: fondo del CTA
  onGold: "#131410", // texto sobre el CTA
  text: "#e5e2db", // --color-on-surface
  muted: "#a89f90", // texto secundario
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
                        <td style={{ padding: "32px 28px" }}>{children}</td>
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
                        fontFamily: "Georgia, 'Times New Roman', serif",
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
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {children}
    </Text>
  );
}

/** Parrafo. Uno por parrafo: un solo `<Text>` con saltos los colapsa. */
export function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 16px",
        color: c.text,
        fontSize: "16px",
        lineHeight: "26px",
        fontFamily: "Georgia, 'Times New Roman', serif",
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
      style={{ margin: "8px 0 4px", backgroundColor: c.goldSolid, borderRadius: "6px" }}
    >
      <tbody>
        <tr>
          <td
            align="center"
            style={{ backgroundColor: c.goldSolid, borderRadius: "6px" }}
          >
            <Link
              href={href}
              style={{
                display: "inline-block",
                padding: "12px 28px",
                color: c.onGold,
                backgroundColor: c.goldSolid,
                borderRadius: "6px",
                fontSize: "15px",
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "Georgia, 'Times New Roman', serif",
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
