import { Resend } from "resend";
import { IEmailProvider, InviteEmailParams } from "../email.provider.interface";
import { renderInvitationEmail } from "../templates/invitation/invitation.template.js";

export class ResendEmailProvider implements IEmailProvider {
  private resend: Resend;
  private frontendUrl: string;

  constructor(apiKey: string, frontendUrl: string) {
    this.resend = new Resend(apiKey);
    this.frontendUrl = frontendUrl;
  }

  async sendWorkspaceInvite(params: InviteEmailParams): Promise<void> {
    const inviteLink = `${this.frontendUrl}/invites/accept?token=${params.rawToken}`;

    const htmlContent = await renderInvitationEmail({
      inviteLink,
      inviterName: params.inviterName,
      workspaceName: params.workspaceName,
    });

    const { data, error } = await this.resend.emails.send({
      from: "Form Builder <onboarding@resend.dev>",
      to: params.toEmail,
      subject: `You've been invited to ${params.workspaceName}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend API Error:", error);
      throw new Error("Could not send the invitation email.");
    }

    console.log("Email sent successfully:", data);
  }
}
