import type { AnswerEntry } from "@flowform/database/models";
import { MAX_ANSWERS_PER_RESPONSE, buildAnswerSchema } from "./answer-schema";
import { isEmpty } from "./conditions";
import { resolve } from "./resolve";
import type { AnswerMap, AnswerValidation, FormContent, Question } from "./types";

/**
 * Validate a submitted response against the published form.
 *
 * The order of the passes matters:
 *
 *   1. Shape first — so a garbage answer can never be used to steer the walk.
 *   2. Resolve — replay the respondent's journey from their own answers.
 *   3. Reachability — reject answers to questions they could not have been asked.
 *      (This is what stops a bot stuffing values into hidden branches.)
 *   4. Required + per-type schema — but ONLY over the questions they were asked.
 *
 * Step 4 is the fix for the live bug: the old validator required every
 * `required` question on every page, so any form using HIDE or JUMP became
 * impossible to submit.
 */
export function validateAnswers(
  content: FormContent,
  entries: AnswerEntry[],
): AnswerValidation {
  const errors: Record<string, string> = {};

  if (entries.length > MAX_ANSWERS_PER_RESPONSE) {
    return { ok: false, errors: { _form: "Too many answers submitted." } };
  }

  const questionMap = new Map<string, Question>();
  for (const page of content.pages ?? []) {
    for (const q of page.questions ?? []) questionMap.set(q.id, q);
  }

  // ── Pass 1: shape ──────────────────────────────────────────────────────────
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.questionId)) {
      errors[entry.questionId] = "Duplicate answer.";
      continue;
    }
    seen.add(entry.questionId);

    const q = questionMap.get(entry.questionId);
    if (!q) {
      errors[entry.questionId] = "Unknown question.";
    } else if (entry.type !== q.type) {
      errors[entry.questionId] = "Answer type does not match the question.";
    }
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const answers: AnswerMap = {};
  for (const entry of entries) answers[entry.questionId] = entry.value;

  // ── Pass 2: replay the journey ─────────────────────────────────────────────
  const { visibleQuestionIds, requiredQuestionIds } = resolve(content, answers);

  // ── Pass 3: reachability ───────────────────────────────────────────────────
  for (const entry of entries) {
    if (!visibleQuestionIds.has(entry.questionId)) {
      errors[entry.questionId] = "This question was not reachable with these answers.";
    }
  }

  // ── Pass 4: required + schema, over the reachable set only ─────────────────
  for (const questionId of visibleQuestionIds) {
    const q = questionMap.get(questionId);
    if (!q) continue;

    const value = answers[questionId] ?? null;

    if (isEmpty(value)) {
      if (requiredQuestionIds.has(questionId)) {
        errors[questionId] = "This field is required.";
      }
      continue; // optional + blank is fine
    }

    const parsed = buildAnswerSchema(q).safeParse(value);
    if (!parsed.success) {
      errors[questionId] = parsed.error.issues[0]?.message ?? "Invalid value.";
    }
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true };
}
