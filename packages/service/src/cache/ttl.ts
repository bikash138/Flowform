export const TTL = {
  WORKSPACE_PLAN: 60 * 60,
  RESPONSE_LIMIT_USAGE: 60 * 60 * 24 * 35,
  MEMBERSHIP: 60 * 60,
  DEDUP: 30 * 24 * 60 * 60,  // 30 days
  SNAPSHOT: 60 * 60,          // 1 hour — invalidated on republish
  SUBMISSION_COUNT: 30,        // 30 seconds — stale-by-30s is fine for rate gates
  QUESTION_STATS: 5 * 60,      // 5 minutes — analytics tolerate slight staleness
} as const;
