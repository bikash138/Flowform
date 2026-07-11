import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { toNodeHandler } from "better-auth/node";
import { eq } from "drizzle-orm";
import { getDb } from "@flowform/database/connection";
import {
  user,
  session,
  account,
  verification,
} from "@flowform/database/models";
import { env } from "@flowform/env";
import { createLogger } from "@flowform/logger";
import { WorkspaceCoreService } from "../workspace";

const log = createLogger("auth-service");

let authInstance: ReturnType<typeof createAuth> | null = null;

async function guardAndProvision(userId: string): Promise<void> {
  const db = getDb();

  const [record] = await db
    .select({
      name: user.name,
      isActive: user.isActive,
      personalWorkspaceId: user.personalWorkspaceId,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!record) {
    throw APIError.from("UNAUTHORIZED", {
      message: "Account not found",
      code: "USER_NOT_FOUND",
    });
  }

  if (!record.isActive) {
    throw APIError.from("FORBIDDEN", {
      message: "Account deactivated",
      code: "ACCOUNT_DEACTIVATED",
    });
  }

  if (record.personalWorkspaceId) return;

  const workspace = await new WorkspaceCoreService().createPersonalWorkspace(
    userId,
    record.name ?? "",
  );

  await db
    .update(user)
    .set({ personalWorkspaceId: workspace.id })
    .where(eq(user.id, userId));

  log.info(
    { userId, workspaceId: workspace.id },
    "Auto-provisioned personal workspace",
  );
}

function createAuth() {
  return betterAuth({
    appName: "Flowform",
    secret: env.auth.secret,
    baseURL: env.auth.baseURL,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: false,
    },
    socialProviders: {
      google: env.auth.providers.google,
    },
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
    databaseHooks: {
      session: {
        create: {
          before: async (newSession) => {
            await guardAndProvision(newSession.userId);
          },
        },
      },
    },
    trustedOrigins: [env.http.frontendUrl],
    advanced: {
      useSecureCookies: env.node.env === "production",
      defaultCookieAttributes: {
        ...(env.node.env === "production"
          ? { domain: env.auth.cookieDomain }
          : {}),
        secure: env.node.env === "production",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      },
    },
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
