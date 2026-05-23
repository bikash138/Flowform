export const CacheKeys = {
  billing: {
    workspacePlan: (workspaceId: string) =>
      `billing:workspace-plan:${workspaceId}`,
    responseLimitUsage: (workspaceId: string, yearMonth: string) =>
      `billing:response-limit-usage:${workspaceId}:${yearMonth}`,
  },
  rateLimit: {
    inviteSend: (workspaceId: string) =>
      `rate-limit:invite-send:${workspaceId}`,
    slugCheck: (workspaceId: string) =>
      `rate-limit:slug-check:${workspaceId}`,
  },
  membership: {
    role: (workspaceId: string, userId: string) =>
      `membership:${workspaceId}:${userId}`,
  },
} as const;
