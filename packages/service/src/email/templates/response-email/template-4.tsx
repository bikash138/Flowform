import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";
import type { EmailTemplateProps } from "./types";

// Dark — charcoal background, light text, brandColor accent pops. Modern/tech feel.
export function DarkTemplate({
  brandName,
  brandColor,
  brandLogo,
  brandLink,
  personalizedMessage,
  formTitle,
  answers,
  respondentEmail,
}: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Your response to {formTitle} was received</Preview>
      <Body style={{ backgroundColor: "#0f0f0f", fontFamily: "'Courier New', monospace" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 32px" }}>

          {/* Accent line + brand */}
          <Section style={{ borderBottom: `2px solid ${brandColor}`, paddingBottom: "24px", marginBottom: "32px" }}>
            <table width="100%" cellPadding={0} cellSpacing={0}>
              <tr>
                <td>
                  <Text style={{ fontSize: "11px", color: brandColor, margin: 0, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    Confirmation
                  </Text>
                </td>
                <td style={{ textAlign: "right" }}>
                  {brandLogo ? (
                    <Img src={brandLogo} alt={brandName} height={24} style={{ filter: "brightness(0) invert(1)" }} />
                  ) : (
                    <Text style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                      {brandLink ? <Link href={brandLink} style={{ color: "#6b7280", textDecoration: "none" }}>{brandName}</Link> : brandName}
                    </Text>
                  )}
                </td>
              </tr>
            </table>
          </Section>

          <Heading style={{ fontSize: "26px", fontWeight: 700, color: "#ffffff", margin: "0 0 16px", lineHeight: 1.2 }}>
            {formTitle}
          </Heading>

          <Text style={{ fontSize: "14px", color: "#9ca3af", lineHeight: "1.8", margin: "0 0 40px" }}>
            {personalizedMessage}
          </Text>

          {/* Answers */}
          {answers.map((a, i) => (
            <Section key={i} style={{ marginBottom: "24px" }}>
              <Text style={{ fontSize: "10px", color: brandColor, margin: "0 0 6px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                /{String(i + 1).padStart(2, "0")}
              </Text>
              <Text style={{ fontSize: "15px", color: "#e5e7eb", margin: 0, lineHeight: "1.6", paddingLeft: "12px", borderLeft: `1px solid #2d2d2d` }}>
                {String(a.value ?? "—")}
              </Text>
            </Section>
          ))}

          {/* Footer */}
          <Section style={{ borderTop: "1px solid #1f1f1f", paddingTop: "24px", marginTop: "16px" }}>
            <Text style={{ fontSize: "11px", color: "#4b5563", margin: 0 }}>
              {respondentEmail ?? ""}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
