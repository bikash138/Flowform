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

// Bold — full-width brandColor header, white content area, answer rows alternate shading.
export function BoldTemplate({
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
      <Body style={{ backgroundColor: "#f3f4f6", fontFamily: "Helvetica, Arial, sans-serif", margin: 0 }}>

        {/* Header */}
        <Section style={{ backgroundColor: brandColor, padding: "40px 0" }}>
          <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 32px" }}>
            {brandLogo ? (
              <Img src={brandLogo} alt={brandName} height={36} style={{ marginBottom: "20px", filter: "brightness(0) invert(1)" }} />
            ) : (
              <Text style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", margin: "0 0 20px" }}>
                {brandName}
              </Text>
            )}
            <Heading style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", margin: "0 0 12px", lineHeight: 1.2 }}>
              Response received.
            </Heading>
            <Text style={{ fontSize: "15px", color: "rgba(255,255,255,0.8)", margin: 0 }}>
              {formTitle}
            </Text>
          </Container>
        </Section>

        {/* Body */}
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>
          <Section style={{ backgroundColor: "#ffffff", padding: "32px" }}>
            <Text style={{ fontSize: "15px", color: "#374151", lineHeight: "1.7", margin: "0 0 32px" }}>
              {personalizedMessage}
            </Text>

            {answers.map((a, i) => (
              <Section
                key={i}
                style={{
                  backgroundColor: i % 2 === 0 ? "#f9fafb" : "#ffffff",
                  padding: "14px 16px",
                  borderLeft: `3px solid ${brandColor}`,
                  marginBottom: "8px",
                }}
              >
                <Text style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Q{i + 1}
                </Text>
                <Text style={{ fontSize: "15px", color: "#111827", margin: 0, fontWeight: 500 }}>
                  {String(a.value ?? "—")}
                </Text>
              </Section>
            ))}
          </Section>

          {/* Footer */}
          <Section style={{ padding: "20px 32px" }}>
            <Text style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
              {brandLink ? (
                <Link href={brandLink} style={{ color: "#9ca3af" }}>{brandName}</Link>
              ) : brandName}
              {respondentEmail ? ` · ${respondentEmail}` : ""}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
