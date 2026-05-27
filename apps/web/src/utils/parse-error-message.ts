/**
 * tRPC forwards Zod validation errors as a JSON-stringified array of ZodIssue
 * objects in `error.message`, e.g.:
 *   '[{"code":"too_big","path":["title"],"message":"Too big: …"}]'
 *
 * This helper unwraps that so toasts always show a plain, readable string.
 */
export function parseErrorMessage(
  error: { message?: string | null } | null | undefined,
  fallback: string,
): string {
  const raw = error?.message;
  if (!raw) return fallback;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const messages = parsed
        .map((issue: unknown) =>
          typeof issue === "object" &&
          issue !== null &&
          "message" in issue &&
          typeof (issue as { message: unknown }).message === "string"
            ? (issue as { message: string }).message
            : null,
        )
        .filter(Boolean) as string[];

      if (messages.length > 0) return messages.join(". ");
    }
  } catch {
    // Not JSON — fall through and return as-is
  }

  return raw || fallback;
}
