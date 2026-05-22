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
} from "@react-email/components";
import type { EmailTemplateProps } from "../types";

// Split — top half is a full-width brandColor banner with the message,
// bottom half is clean white with a numbered answer list. Magazine-style.
export function SplitTemplate({
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
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Georgia, serif" }}>

        {/* Top — colored banner */}
        <Section style={{ backgroundColor: brandColor, padding: "56px 0 48px" }}>
          <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 40px" }}>
            {brandLogo && (
              <Img src={brandLogo} alt={brandName} height={30} style={{ marginBottom: "28px", filter: "brightness(0) invert(1)", opacity: 0.9 }} />
            )}
            <Text style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 12px", fontFamily: "Helvetica, Arial, sans-serif" }}>
              Response confirmed
            </Text>
            <Heading style={{ fontSize: "30px", fontWeight: 700, color: "#ffffff", margin: "0 0 16px", lineHeight: 1.25 }}>
              {formTitle}
            </Heading>
            <Text style={{ fontSize: "16px", color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: "1.7" }}>
              {personalizedMessage}
            </Text>
          </Container>
        </Section>

        {/* Bottom — answers */}
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 40px 48px" }}>
          <Text style={{ fontSize: "12px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 24px", fontFamily: "Helvetica, Arial, sans-serif" }}>
            Your responses
          </Text>

          {answers.map((a, i) => (
            <Section key={i} style={{ marginBottom: "20px", display: "flex" }}>
              <table width="100%" cellPadding={0} cellSpacing={0}>
                <tr>
                  <td style={{ width: "32px", verticalAlign: "top", paddingTop: "2px" }}>
                    <Text style={{ fontSize: "13px", fontWeight: 700, color: brandColor, margin: 0, fontFamily: "Helvetica, Arial, sans-serif" }}>
                      {i + 1}.
                    </Text>
                  </td>
                  <td>
                    <Text style={{ fontSize: "16px", color: "#1f2937", margin: 0, lineHeight: "1.6" }}>
                      {String(a.value ?? "—")}
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>
          ))}

          <Text style={{ fontSize: "12px", color: "#d1d5db", marginTop: "40px", fontFamily: "Helvetica, Arial, sans-serif" }}>
            {brandLink ? (
              <Link href={brandLink} style={{ color: "#9ca3af", textDecoration: "none" }}>{brandName}</Link>
            ) : (
              <span style={{ color: "#9ca3af" }}>{brandName}</span>
            )}
            {respondentEmail ? ` · ${respondentEmail}` : ""}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
