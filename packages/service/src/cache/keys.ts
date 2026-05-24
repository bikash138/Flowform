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
    public: (endpoint: string, ip: string, formId: string) =>
      `rl:${endpoint}:${ip}:${formId}`,
  },
  membership: {
    role: (workspaceId: string, userId: string) =>
      `membership:${workspaceId}:${userId}`,
  },
  public: {
    dedup: (formId: string, anonId: string) => `dedup:${formId}:${anonId}`,
    snapshot: (formId: string, version: number) => `snapshot:${formId}:${version}`,
    submissionCount: (formId: string) => `sub_count:${formId}`,
  },
  analytics: {
    questionStats: (formId: string, version: number) => `qstats:${formId}:${version}`,
  },
} as const;
