import env from "@/config/env";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

const additionalFields = inferAdditionalFields({
  user: {
    role: {
      type: "string",
      required: false,
      input: false,
    },
    personalWorkspaceId: {
      type: "string",
      required: false,
      input: false,
    },
    isActive: {
      type: "boolean",
      required: false,
      input: false,
    },
  },
});

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  plugins: [additionalFields],
});
