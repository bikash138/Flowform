import { isEmpty } from "./conditions";
import { resolve } from "./resolve";
import type { AnswerMap, FormContent, Question } from "./types";

export type SimulationResult = {
  /** Pages walked, in order. */
  path: string[];
  /** Questions this person was actually asked. */
  asked: Array<{ id: string; label: string; required: boolean; answered: boolean }>;
  /** Questions that were never shown, given these answers. */
  skipped: string[];
  /** Required questions with no answer — this submission would be rejected. */
  missingRequired: string[];
  /** Answers supplied for questions that were never reachable — would be rejected. */
  unreachableAnswers: string[];
  /** True if a jump loop cut the walk short. */
  truncated: boolean;
};

/**
 * "Pretend someone answered like this. Where do they end up?"
 *
 * A thin wrapper over resolve(), but a genuinely useful one: it is how an
 * author (or, later, an AI agent) tests a branch WITHOUT filling the form in.
 * An agent that can simulate its own form can check its work before publishing
 * instead of hoping.
 */
export function simulate(content: FormContent, answers: AnswerMap): SimulationResult {
  const { path, visibleQuestionIds, requiredQuestionIds, truncated } = resolve(content, answers);

  const allQuestions = new Map<string, Question>();
  for (const page of content.pages ?? []) {
    for (const q of page.questions ?? []) allQuestions.set(q.id, q);
  }

  const asked: SimulationResult["asked"] = [];
  const missingRequired: string[] = [];

  for (const [id, q] of allQuestions) {
    if (!visibleQuestionIds.has(id)) continue;

    const answered = !isEmpty(answers[id]);
    asked.push({ id, label: q.label, required: requiredQuestionIds.has(id), answered });

    if (requiredQuestionIds.has(id) && !answered) missingRequired.push(id);
  }

  const skipped = [...allQuestions.keys()].filter((id) => !visibleQuestionIds.has(id));

  const unreachableAnswers = Object.keys(answers).filter(
    (id) => !isEmpty(answers[id]) && !visibleQuestionIds.has(id),
  );

  return { path, asked, skipped, missingRequired, unreachableAnswers, truncated };
}
