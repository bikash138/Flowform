import type { FormContent, LogicRule, Question } from "../types";
import type { PageWithNext } from "../types";

export function q(
  id: string,
  type: Question["type"],
  order: number,
  extra: Partial<Question> = {},
): Question {
  return { id, order, type, label: id, required: false, ...extra };
}

export function opts(...ids: string[]) {
  return ids.map((id, i) => ({ id, label: id, order: i }));
}

export function page(id: string, order: number, questions: Question[], defaultNext?: string): PageWithNext {
  return { id, order, questions, ...(defaultNext ? { defaultNext } : {}) };
}

export function form(pages: PageWithNext[], logic: LogicRule[] = []): FormContent {
  return {
    startPage: { heading: "Hi", buttonLabel: "Start" },
    pages,
    endPage: { heading: "Thanks", animation: "none" },
    logic,
  };
}

export function rule(
  id: string,
  triggerId: string,
  condition: LogicRule["condition"],
  value: unknown,
  action: LogicRule["action"],
  targetId: string,
): LogicRule {
  return { id, triggerId, condition, value, action, targetId };
}

/**
 * The worked example from the design discussion.
 *
 *   pg_intro     → q_customer (radio: yes/no)
 *   pg_experience→ q_plan, q_satisfaction, q_problem (hidden until rating < 3)
 *   pg_features  → q_features (checkbox), q_features_other (hidden until "other")
 *   pg_prospect  → q_current_tool, q_blocker
 *   pg_contact   → q_email, q_followup (hidden until email filled)
 *
 * Non-customers JUMP from pg_intro straight to pg_prospect.
 * Customers rejoin the tail via pg_features.defaultNext = pg_contact.
 */
export const FEEDBACK_FORM: FormContent = form(
  [
    page("pg_intro", 0, [q("q_customer", "radio", 0, { required: true, options: opts("opt_yes", "opt_no") })]),
    page("pg_experience", 1, [
      q("q_plan", "select", 0, { required: true, options: opts("opt_free", "opt_pro") }),
      q("q_satisfaction", "rating", 1, { required: true, config: { scale: 5 } }),
      q("q_problem", "long_text", 2),
    ]),
    page(
      "pg_features",
      2,
      [
        q("q_features", "checkbox", 0, { required: true, options: opts("opt_logic", "opt_analytics", "opt_other") }),
        q("q_features_other", "short_text", 1),
      ],
      "pg_contact", // customers skip the prospect branch
    ),
    page("pg_prospect", 3, [
      q("q_current_tool", "short_text", 0),
      q("q_blocker", "radio", 1, { required: true, options: opts("opt_price", "opt_missing") }),
    ]),
    page("pg_contact", 4, [q("q_email", "email", 0), q("q_followup", "yes_no", 1)]),
  ],
  [
    rule("lr_1", "q_customer", "equals", "opt_no", "JUMP", "pg_prospect"),
    rule("lr_2", "q_satisfaction", "less_than", 3, "SHOW", "q_problem"),
    rule("lr_3", "q_satisfaction", "less_than", 3, "REQUIRE", "q_problem"),
    rule("lr_4", "q_features", "contains", "opt_other", "SHOW", "q_features_other"),
    rule("lr_5", "q_features", "contains", "opt_other", "REQUIRE", "q_features_other"),
    rule("lr_7", "q_email", "is_not_empty", null, "SHOW", "q_followup"),
  ],
);
