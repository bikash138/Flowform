import { toast } from "sonner";
import {
  getRetryAfterSeconds,
  rateLimitMessage,
  type RateLimitArea,
} from "@/utils/rate-limit";

export function redirectToServerUnavailable(): void {
  window.location.href = "/server-unavailable";
}

export function handlePublicApiError(
  area: RateLimitArea,
  response?: Response | null,
): void {
  if (response?.status === 429) {
    toast.error(rateLimitMessage(area, getRetryAfterSeconds(response)));
    return;
  }

  redirectToServerUnavailable();
}
