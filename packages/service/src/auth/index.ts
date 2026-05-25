import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { toNodeHandler } from "better-auth/node";
import { getDb } from "@flowform/database/connection";
import { user, session, account, verification } from "@flowform/database/models";
import { env } from "@flowform/env";
import { createLogger } from "@flowform/logger";
import { WorkspaceCoreService } from "../workspace";

const log = createLogger("auth-service");

let authInstance: ReturnType<typeof createAuth> | null = null;

function createAuth() {
  const secret = env.auth.secret;
  const baseURL = env.auth.baseURL;
  const frontendUrl = env.http.frontendUrl || "http://localhost:3000";

  const socialProviders: any = {};
  if (env.auth.providers?.google) {
    socialProviders.google = env.auth.providers.google;
  }
  if (env.auth.providers?.github) {
    socialProviders.github = env.auth.providers.github;
  }

  return betterAuth({
    appName: "Flowform",
    secret,
    baseURL,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
    socialProviders,
    user: {
      additionalFields: {
        role: {
          type: ["user", "admin"],
          required: false,
          defaultValue: "user",
          input: false,
        },
        isActive: {
          type: "boolean",
          required: false,
          defaultValue: true,
          input: false,
        },
        personalWorkspaceId: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-in/email") return;
        const email = (ctx.body as { email?: string } | undefined)?.email;
        if (email == null || email === "") return;
        const found = await ctx.context.internalAdapter.findUserByEmail(email);
        const foundUser = found?.user as { isActive?: boolean } | undefined;
        if (foundUser != null && foundUser.isActive === false) {
          throw APIError.from("FORBIDDEN", {
            message: "Account deactivated",
            code: "ACCOUNT_DEACTIVATED",
          });
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (
          ctx.path === "/sign-up/email" ||
          ctx.path === "/callback/google" ||
          ctx.path === "/callback/github"
        ) {
          const result = ctx.context.returned as
            | {
                user: {
                  id: string;
                  email: string;
                  name: string;
                  personalWorkspaceId: string;
                };
              }
            | undefined;

          if (result?.user && !result.user.personalWorkspaceId) {
            const workspaceService = new WorkspaceCoreService();
            const workspace = await workspaceService.createPersonalWorkspace(
              result.user.id,
              result.user.name,
            );

            log.info(
              { userId: result.user.id, workspaceId: workspace.id },
              "Auto-provisioned personal workspace",
            );

            await ctx.context.internalAdapter.updateUser(result.user.id, {
              personalWorkspaceId: workspace.id,
            });

            result.user.personalWorkspaceId = workspace.id;
          }
        }
      }),
    },
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: [frontendUrl],
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
  });
}

export function getAuth() {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
}

export const authHandler = () => toNodeHandler(getAuth());

export type Auth = ReturnType<typeof createAuth>;
export type User = Auth["$Infer"]["Session"]["user"];
export type Session = Auth["$Infer"]["Session"]["session"];
