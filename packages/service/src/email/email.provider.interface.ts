export interface InviteEmailParams {
  toEmail: string;
  workspaceName: string;
  inviterName: string;
  rawToken: string;
}

export interface IEmailProvider {
  sendWorkspaceInvite(params: InviteEmailParams): Promise<void>;
}
