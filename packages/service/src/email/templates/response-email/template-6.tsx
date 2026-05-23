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

// Warm — centered layout, rounded pill badges for answers, soft background.
// Friendly and approachable, suited for customer-facing forms.
export function WarmTemplate({
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
      <Body style={{ backgroundColor: "#fafaf9", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Container style={{ maxWidth: "520px", margin: "56px auto", padding: "0 24px" }}>

          {/* Brand dot + name */}
          <Section style={{ textAlign: "center", marginBottom: "40px" }}>
            {brandLogo ? (
              <Img src={brandLogo} alt={brandName} height={40} style={{ margin: "0 auto" }} />
            ) : (
              <Text style={{ fontSize: "15px", fontWeight: 700, color: "#374151", margin: 0 }}>
                {brandLink ? (
                  <Link href={brandLink} style={{ color: "#374151", textDecoration: "none" }}>{brandName}</Link>
                ) : brandName}
              </Text>
            )}
          </Section>

          {/* Main message card */}
          <Section style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "40px 36px", marginBottom: "20px", border: "1px solid #e7e5e4" }}>
            <Text style={{ fontSize: "32px", textAlign: "center", margin: "0 0 16px" }}>
              🎉
            </Text>
            <Heading style={{ fontSize: "22px", fontWeight: 700, color: "#1c1917", textAlign: "center", margin: "0 0 12px" }}>
              {formTitle}
            </Heading>
            <Text style={{ fontSize: "15px", color: "#57534e", textAlign: "center", lineHeight: "1.7", margin: 0 }}>
              {personalizedMessage}
            </Text>
          </Section>

          {/* Answers as pill rows */}
          <Section style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "28px 36px", border: "1px solid #e7e5e4" }}>
            <Text style={{ fontSize: "11px", fontWeight: 700, color: "#a8a29e", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>
              What you submitted
            </Text>

            {answers.map((a, i) => (
              <Section key={i} style={{ marginBottom: "12px" }}>
                <table cellPadding={0} cellSpacing={0}>
                  <tr>
                    <td>
                      <Text
                        style={{
                          display: "inline-block",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: brandColor,
                          backgroundColor: `${brandColor}18`,
                          borderRadius: "999px",
                          padding: "2px 10px",
                          margin: "0 8px 0 0",
                        }}
                      >
                        {i + 1}
                      </Text>
                    </td>
                    <td>
                      <Text style={{ fontSize: "14px", color: "#292524", margin: 0, lineHeight: "1.5" }}>
                        {String(a.value ?? "—")}
                      </Text>
                    </td>
                  </tr>
                </table>
              </Section>
            ))}
          </Section>

          {/* Footer */}
          <Text style={{ fontSize: "12px", color: "#a8a29e", textAlign: "center", marginTop: "32px" }}>
            {brandLink ? (
              <Link href={brandLink} style={{ color: "#a8a29e", textDecoration: "none" }}>{brandName}</Link>
            ) : (
              <span>{brandName}</span>
            )}
            {respondentEmail ? ` · ${respondentEmail}` : ""}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
