import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { EmailTemplateProps } from "../types";

// Minimal — white, clean, lots of whitespace. Brand presence is subtle.
export function MinimalTemplate({
  brandName,
  brandColor,
  brandLogo,
  brandLink,
  personalizedMessage,
  formTitle,
  answers,
  respondentEmail,
}: EmailTemplateProps) {
  const brand = brandLink ? (
    <Link href={brandLink} style={{ color: "#6b7280", textDecoration: "none" }}>
      {brandName}
    </Link>
  ) : (
    <span>{brandName}</span>
  );

  return (
    <Html>
      <Head />
      <Preview>Your response to {formTitle} was received</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "48px auto", padding: "0 24px" }}>

          {brandLogo && (
            <Img src={brandLogo} alt={brandName} height={32} style={{ marginBottom: "40px" }} />
          )}

          <Heading style={{ fontSize: "22px", fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
            {formTitle}
          </Heading>
          <Text style={{ fontSize: "15px", color: "#6b7280", margin: "0 0 32px", lineHeight: "1.6" }}>
            {personalizedMessage}
          </Text>

          <Hr style={{ borderColor: "#e5e7eb", margin: "0 0 32px" }} />

          <Text style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", color: brandColor, textTransform: "uppercase", margin: "0 0 16px" }}>
            Your answers
          </Text>

          {answers.map((a, i) => (
            <Section key={i} style={{ marginBottom: "20px" }}>
              <Text style={{ fontSize: "12px", color: "#9ca3af", margin: "0 0 2px" }}>
                Question {i + 1}
              </Text>
              <Text style={{ fontSize: "15px", color: "#111827", margin: 0 }}>
                {String(a.value ?? "—")}
              </Text>
            </Section>
          ))}

          <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 24px" }} />

          <Text style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
            Sent by {brand}{respondentEmail ? ` · ${respondentEmail}` : ""}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
