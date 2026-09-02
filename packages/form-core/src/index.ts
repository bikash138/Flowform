// The form kernel: pure, headless, no React and no database.
//
// One implementation of "how a form behaves", imported by everyone who needs
// to know — the editor, the renderer, the server, and (later) the AI agent.

export { resolve, nextPageAfter } from "./resolve";
export { validate, canPublish } from "./validate";

// Derived views of the logic graph. The editor canvas uses these to draw the
// indent and to reason about parents/children — WITHOUT any of it being stored
// on the question, so there is no second copy to keep in sync.
export {
  childrenOf,
  parentsOf,
  depthOf,
  conditionallyRevealed,
  visibilityRuleOf,
  pageOfQuestion,
  allQuestions,
  rulesByTarget,
  jumpsByPage,
} from "./graph";
export { validateAnswers } from "./validate-answers";
export { simulate, type SimulationResult } from "./simulate";
export { matches, isEmpty } from "./conditions";
export {
  buildAnswerSchema,
  MAX_SHORT_TEXT,
  MAX_LONG_TEXT,
  MAX_ANSWERS_PER_RESPONSE,
} from "./answer-schema";

export type {
  AnswerMap,
  AnswerValidation,
  AnswerValue,
  Diagnostic,
  DiagnosticCode,
  DiagnosticSeverity,
  FormContent,
  FormPage,
  LogicRule,
  PageNext,
  PageWithNext,
  Question,
  Resolved,
} from "./types";
