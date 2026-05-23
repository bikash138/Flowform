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

// Card — each answer lives in its own elevated card. Structured, data-focused feel.
export function CardTemplate({
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
      <Body style={{ backgroundColor: "#f8fafc", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container style={{ maxWidth: "580px", margin: "48px auto", padding: "0 16px" }}>

          {/* Top bar */}
          <Section style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "28px 32px", marginBottom: "16px", borderTop: `4px solid ${brandColor}` }}>
            <table width="100%" cellPadding={0} cellSpacing={0}>
              <tr>
                <td>
                  <Heading style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    {formTitle}
                  </Heading>
                  <Text style={{ fontSize: "14px", color: "#64748b", margin: "6px 0 0" }}>
                    {personalizedMessage}
                  </Text>
                </td>
                <td style={{ textAlign: "right", verticalAlign: "top" }}>
                  {brandLogo ? (
                    <Img src={brandLogo} alt={brandName} height={28} />
                  ) : (
                    <Text style={{ fontSize: "13px", fontWeight: 600, color: brandColor, margin: 0 }}>
                      {brandName}
                    </Text>
                  )}
                </td>
              </tr>
            </table>
          </Section>

          {/* Answer cards */}
          {answers.map((a, i) => (
            <Section
              key={i}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                padding: "20px 24px",
                marginBottom: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <table width="100%" cellPadding={0} cellSpacing={0}>
                <tr>
                  <td>
                    <Text style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 6px", fontWeight: 500 }}>
                      Answer {i + 1}
                    </Text>
                    <Text style={{ fontSize: "15px", color: "#1e293b", margin: 0, lineHeight: "1.5" }}>
                      {String(a.value ?? "—")}
                    </Text>
                  </td>
                  <td style={{ textAlign: "right", verticalAlign: "middle" }}>
                    <Text style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>
                      {String(i + 1).padStart(2, "0")}
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>
          ))}

          {/* Footer */}
          <Text style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", marginTop: "24px" }}>
            {brandLink ? (
              <Link href={brandLink} style={{ color: brandColor, textDecoration: "none", fontWeight: 600 }}>
                {brandName}
              </Link>
            ) : (
              <span style={{ color: brandColor, fontWeight: 600 }}>{brandName}</span>
            )}
            {respondentEmail ? ` · ${respondentEmail}` : ""}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
