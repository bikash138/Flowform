import { createLogger } from "@flowform/logger";
import { IEmailProvider, InviteEmailParams } from "./email.provider.interface.js";
import { ResendEmailProvider } from "./providers/resend.provider.js";
import { ConsoleEmailProvider } from "./providers/console.providers.js";
import { env } from "@flowform/env";

const log = createLogger("email-service");

let providerInstance: IEmailProvider | null = null;

function getProvider(): IEmailProvider {
  if (!providerInstance) {
    const resendApiKey = env.email.resend;
    const frontendUrl = env.http.frontendUrl ?? "http://localhost:3000";

    if (resendApiKey) {
      log.info("Initializing Resend Email Provider");
      providerInstance = new ResendEmailProvider(resendApiKey, frontendUrl);
    } else {
      log.warn("Falling back to Console Email Provider");
      providerInstance = new ConsoleEmailProvider(frontendUrl);
    }
  }
  return providerInstance;
}

export class EmailService {
  static async sendWorkspaceInvite(params: InviteEmailParams): Promise<void> {
    log.info({ to: params.toEmail }, "Sending workspace invite");
    await getProvider().sendWorkspaceInvite(params);
  }
}
