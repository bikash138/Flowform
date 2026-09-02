import type {
  FormContent as DbFormContent,
  FormPage as DbFormPage,
  LogicRule as DbLogicRule,
  Question,
} from "@flowform/database/models";

export type { Question };
export type FormPage = DbFormPage;

export type AnswerValue = string | number | string[] | boolean | null;

/** questionId -> the respondent's answer. Missing key === unanswered. */
export type AnswerMap = Record<string, AnswerValue>;

/**
 * Superset of the database's LogicCondition.
 *
 * The extra operators already work at runtime (see conditions.ts) but are not
 * yet in the union in @flowform/database. Widening here means this package is
 * additive — nothing in the database package has to change for it to compile,
 * and nothing here breaks when those operators are eventually added there.
 *
 * `is_not_empty` in particular is needed for the very common "only ask the
 * follow-up if they actually filled this in" pattern.
 */
export type Condition =
  | DbLogicRule["condition"]
  | "not_contains"
  | "is_empty"
  | "is_not_empty"
  | "is_one_of";

export type LogicRule = Omit<DbLogicRule, "condition"> & { condition: Condition };

/**
 * Where a page hands off to when no conditional JUMP fires.
 * Absent === "the next page in document order".
 *
 * NOTE: `defaultNext` is not yet on FormPage in @flowform/database. It is
 * optional here so a database FormPage is still assignable. Without it,
 * branches can diverge but can never rejoin a shared tail.
 */
export type PageNext = string | "END";
export type PageWithNext = DbFormPage & { defaultNext?: PageNext };

/**
 * The form document as this package sees it: structurally the database's
 * FormContent, with the two forward-compatible widenings above. A DB
 * FormContent is assignable to this; the reverse is deliberately not true.
 */
export type FormContent = Omit<DbFormContent, "pages" | "logic"> & {
  pages: PageWithNext[];
  logic: LogicRule[];
};

/**
 * The result of walking the form the way a specific respondent walked it.
 * This is the single source of truth for "what was this person actually asked?"
 * — used by the renderer to paint, and by the server to validate.
 */
export type Resolved = {
  /** Page ids in the order they were traversed. */
  path: string[];
  /** Questions the respondent could actually see and answer. */
  visibleQuestionIds: Set<string>;
  /** Subset of the above that must be answered (base `required` + REQUIRE rules). */
  requiredQuestionIds: Set<string>;
  /**
   * Answers restricted to visible questions. A hidden question's answer is
   * deliberately excluded so it cannot drive any rule — this is what makes
   * cascading reveals collapse correctly.
   */
  effectiveAnswers: AnswerMap;
  /** True if a JUMP cycle was hit and the walk was cut short to avoid looping. */
  truncated: boolean;
};

export type DiagnosticSeverity = "error" | "warning";

export type DiagnosticCode =
  | "DUPLICATE_PAGE_ID"
  | "DUPLICATE_QUESTION_ID"
  | "DANGLING_TRIGGER"
  | "DANGLING_TARGET_QUESTION"
  | "DANGLING_TARGET_PAGE"
  | "TRIGGER_AFTER_TARGET"
  | "SELF_REFERENCING_RULE"
  | "DELETED_OPTION_REF"
  | "INVALID_TRIGGER_TYPE"
  | "REDUNDANT_REQUIRE_RULE"
  | "DEEP_NESTING"
  | "JUMP_CYCLE"
  | "UNREACHABLE_PAGE"
  | "DEAD_REQUIRED_QUESTION"
  | "EMPTY_PAGE"
  | "NO_PAGES";

/**
 * A machine-readable problem with a form. `suggestion` is what makes this
 * usable by an AI agent: it turns "invalid form" into a fixable instruction.
 */
export type Diagnostic = {
  severity: DiagnosticSeverity;
  code: DiagnosticCode;
  message: string;
  suggestion?: string;
  ruleId?: string;
  pageId?: string;
  questionId?: string;
};

/** Result of validating a set of submitted answers against a form. */
export type AnswerValidation =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };
