import { z } from "zod";
import type { Question } from "./types";

/**
 * Hard ceilings, applied even when the author set no limit.
 * Without these, a single `long_text` answer can be as large as the body limit
 * (2 MB) and lands straight in a JSONB column.
 */
export const MAX_SHORT_TEXT = 500;
export const MAX_LONG_TEXT = 10_000;
export const MAX_ANSWERS_PER_RESPONSE = 500;

/**
 * Build the Zod schema for one question's answer.
 *
 * Fails CLOSED: adding a new QuestionType without handling it here is a
 * compile error, not a silent "accept any JSON". (The old implementation
 * returned z.unknown() by default, which accepted arbitrary values.)
 */
export function buildAnswerSchema(q: Question): z.ZodTypeAny {
  switch (q.type) {
    case "short_text": {
      const max = Math.min(q.config?.maxLength ?? MAX_SHORT_TEXT, MAX_SHORT_TEXT);
      return z.string().min(1).max(max);
    }

    case "long_text": {
      const max = Math.min(q.config?.maxLength ?? MAX_LONG_TEXT, MAX_LONG_TEXT);
      return z.string().min(1).max(max);
    }

    case "email":
      return z.email().max(320);

    case "number": {
      let s = z.coerce.number().refine(Number.isFinite, "Must be a number");
      if (q.config?.min !== undefined) s = s.min(q.config.min) as typeof s;
      if (q.config?.max !== undefined) s = s.max(q.config.max) as typeof s;
      return s;
    }

    case "radio":
    case "select": {
      const validIds = new Set((q.options ?? []).map((o) => o.id));
      return z.string().refine((v) => validIds.has(v), "Not a valid option");
    }

    case "checkbox": {
      const validIds = new Set((q.options ?? []).map((o) => o.id));
      let s = z
        .array(z.string().min(1))
        .max(validIds.size || 1)
        .refine((arr) => arr.every((v) => validIds.has(v)), "Contains an invalid option")
        .refine((arr) => new Set(arr).size === arr.length, "Duplicate options");

      // The author's min/max selection limits were previously ignored entirely.
      const min = q.config?.min;
      const max = q.config?.max;
      if (min !== undefined) {
        s = s.refine((arr) => arr.length >= min, `Select at least ${min}`) as typeof s;
      }
      if (max !== undefined) {
        s = s.refine((arr) => arr.length <= max, `Select at most ${max}`) as typeof s;
      }
      return s;
    }

    case "rating": {
      const scale = q.config?.scale ?? 5;
      // Coerced, to match `number`. The old version did not coerce, so a
      // JSON string "5" failed here but passed for a number question.
      return z.coerce.number().int().min(1).max(scale);
    }

    case "date": {
      // Rejects the junk `Date.parse` happily accepts (e.g. "1" → year 2001).
      return z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/, "Must be an ISO date")
        .refine((v) => !Number.isNaN(Date.parse(v)), "Not a real date");
    }

    case "phone":
      return z
        .string()
        .max(32)
        .refine(
          (v) => /^\+[1-9]\d{6,14}$/.test(v.trim().replace(/[\s\-().]/g, "")),
          "Must include a country code, e.g. +1 555 000 0000",
        );

    case "url":
      return z.url().max(2048);

    case "yes_no":
      return z.boolean();

    default: {
      // Exhaustiveness guard: a new QuestionType breaks the build here rather
      // than silently accepting unvalidated data in production.
      const _exhaustive: never = q.type;
      void _exhaustive;
      return z.never();
    }
  }
}
