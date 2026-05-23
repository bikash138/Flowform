import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
  render,
} from "react-email";

export type InvitationTemplateProps = {
  inviteLink: string;
  inviterName: string;
  workspaceName: string;
};

function InvitationEmail({ inviteLink, inviterName, workspaceName }: InvitationTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} invited you to join {workspaceName}
      </Preview>
      <Body
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#333",
        }}
      >
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", lineHeight: "1.5" }}
        >
          <Heading
            style={{ color: "#111", fontSize: "24px", margin: "0 0 32px", textAlign: "center" }}
          >
            You've been invited!
          </Heading>

          <Text style={{ fontSize: "16px" }}>Hello,</Text>
          <Text style={{ fontSize: "16px" }}>
            <strong>{inviterName}</strong> has invited you to collaborate in their workspace:{" "}
            <strong>{workspaceName}</strong>.
          </Text>
          <Text style={{ fontSize: "16px" }}>
            Click the button below to accept the invitation and securely join the team.
          </Text>

          <div style={{ textAlign: "center", margin: "32px 0" }}>
            <Button
              href={inviteLink}
              style={{
                padding: "12px 24px",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                borderRadius: "6px",
                fontWeight: "500",
                fontSize: "16px",
              }}
            >
              Accept Invitation
            </Button>
          </div>

          <Hr style={{ borderColor: "#eaeaea", margin: "32px 0" }} />

          <Text style={{ fontSize: "12px", color: "#666", margin: "0" }}>
            If the button doesn't work, copy and paste this link into your browser:
            <br />
            <Link href={inviteLink} style={{ color: "#2563eb", wordBreak: "break-all" }}>
              {inviteLink}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderInvitationEmail(props: InvitationTemplateProps): Promise<string> {
  return render(<InvitationEmail {...props} />);
}
