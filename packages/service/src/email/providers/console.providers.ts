import { IEmailProvider, InviteEmailParams } from "../email.provider.interface";

export class ConsoleEmailProvider implements IEmailProvider {
  private frontendUrl: string;

  constructor(frontendUrl: string) {
    this.frontendUrl = frontendUrl;
  }

  async sendWorkspaceInvite(params: InviteEmailParams): Promise<void> {
    const inviteLink = `${this.frontendUrl}/invite/${params.rawToken}`;
    console.log("=========================================");
    console.log(`[EMAIL MOCK] To: ${params.toEmail}`);
    console.log(
      `[EMAIL MOCK] Mocking invite from ${params.inviterName} to ${params.workspaceName}`,
    );
    console.log(`[EMAIL MOCK] Link: ${inviteLink}`);
    console.log("=========================================");
  }
}
