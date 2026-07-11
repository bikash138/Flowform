export type RateLimitArea = "sign-in" | "session" | "form-submission";

const AREA_PREFIX: Record<RateLimitArea, string> = {
  "sign-in": "Too many sign-in attempts.",
  session: "Too many requests.",
  "form-submission": "Too many submissions.",
};

export function getRetryAfterSeconds(response: Response): number {
  const raw = Number(response.headers.get("Retry-After") ?? 0);
  return Number.isFinite(raw) && raw > 0 ? Math.ceil(raw) : 0;
}

export function formatRetryAfter(seconds: number): string {
  if (seconds <= 0) return "a few minutes";
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function rateLimitMessage(
  area: RateLimitArea,
  seconds: number,
): string {
  return `${AREA_PREFIX[area]} Try again in ${formatRetryAfter(seconds)}.`;
}
