import { depthOf } from "./graph";
import type {
  Diagnostic,
  FormContent,
  LogicRule,
  PageWithNext,
  Question,
} from "./types";

const CHOICE_TYPES = new Set(["radio", "select", "checkbox"]);
const VALUE_OPS = new Set(["equals", "not_equals", "contains", "not_contains", "is_one_of"]);

/**
 * Which questions may drive a rule by their VALUE.
 *
 * The principle: a trigger's answers must be enumerable, so the author can pick
 * the value from a dropdown instead of typing a string and hoping it matches.
 * Free-text triggers ("show X when the name contains 'foo'") are fragile and
 * make forms that break silently — so they are not allowed.
 *
 * This is a slightly wider set than "choice questions only": `rating` and
 * `number` are in, because "rate us 1–2 → tell us what went wrong" is the single
 * most common conditional in existence, and excluding it would be perverse.
 */
const TRIGGERABLE_BY_VALUE = new Set([
  "yes_no",
  "radio",
  "select",
  "checkbox",
  "rating",
  "number",
  "date",
]);

/**
 * "Did they fill this in at all?" is a safe question to ask of ANY type,
 * including free text — so these two operators are exempt from the rule above.
 */
const EMPTINESS_OPS = new Set(["is_empty", "is_not_empty"]);

/** Beyond this, a form is technically fine but genuinely hard to follow. */
const DEEP_NESTING_WARNING_AT = 3;

/** Every page a page can hand off to: conditional jumps, defaultNext, and fall-through. */
function outgoingEdges(page: PageWithNext, pages: PageWithNext[], logic: LogicRule[]): string[] {
  const questionIds = new Set((page.questions ?? []).map((q) => q.id));
  const edges: string[] = [];

  for (const rule of logic) {
    if (rule.action === "JUMP" && questionIds.has(rule.triggerId)) edges.push(rule.targetId);
  }
  if (page.defaultNext) edges.push(page.defaultNext);
  else {
    const idx = pages.findIndex((p) => p.id === page.id);
    const next = pages[idx + 1];
    if (next) edges.push(next.id);
  }

  return edges;
}

/**
 * Check a form for structural problems, BEFORE it reaches a respondent.
 *
 * This is the publish gate. Every error here is an author mistake that would
 * otherwise show up as a broken form at 11pm for a real person — a required
 * question they can never answer, or a page that loops forever.
 *
 * Errors block publish. Warnings do not.
 */
export function validate(content: FormContent): Diagnostic[] {
  const out: Diagnostic[] = [];
  const pages = (content.pages ?? []) as PageWithNext[];
  const logic = content.logic ?? [];

  if (pages.length === 0) {
    out.push({
      severity: "error",
      code: "NO_PAGES",
      message: "The form has no pages.",
      suggestion: "Add at least one page with one question.",
    });
    return out;
  }

  // ── Build lookup tables + global document order ────────────────────────────
  const pageIds = new Set<string>();
  const questionMap = new Map<string, Question>();
  const questionPage = new Map<string, string>();
  /** Global reading position: pages in order, questions in order within a page. */
  const position = new Map<string, number>();
  let cursor = 0;

  for (const page of pages) {
    if (pageIds.has(page.id)) {
      out.push({
        severity: "error",
        code: "DUPLICATE_PAGE_ID",
        message: `Two pages share the id "${page.id}".`,
        pageId: page.id,
        suggestion: "Give each page a unique id.",
      });
    }
    pageIds.add(page.id);

    const questions = [...(page.questions ?? [])].sort((a, b) => a.order - b.order);

    if (questions.length === 0) {
      out.push({
        severity: "warning",
        code: "EMPTY_PAGE",
        message: `Page "${page.id}" has no questions.`,
        pageId: page.id,
        suggestion: "Add a question, or delete the page.",
      });
    }

    for (const q of questions) {
      if (questionMap.has(q.id)) {
        out.push({
          severity: "error",
          code: "DUPLICATE_QUESTION_ID",
          message: `Two questions share the id "${q.id}".`,
          questionId: q.id,
          suggestion: "Give each question a unique id.",
        });
      }
      questionMap.set(q.id, q);
      questionPage.set(q.id, page.id);
      position.set(q.id, cursor++);
    }
  }

  // ── Rule-by-rule checks ────────────────────────────────────────────────────
  for (const rule of logic) {
    const trigger = questionMap.get(rule.triggerId);

    if (!trigger) {
      out.push({
        severity: "error",
        code: "DANGLING_TRIGGER",
        message: `Rule "${rule.id}" is triggered by question "${rule.triggerId}", which does not exist.`,
        ruleId: rule.id,
        suggestion: "The trigger question was probably deleted. Delete this rule, or point it at an existing question.",
      });
      continue;
    }

    // A rule whose value names an option id that has since been deleted will
    // never match — silently. That is the worst kind of broken.
    if (CHOICE_TYPES.has(trigger.type) && VALUE_OPS.has(rule.condition as string)) {
      const optionIds = new Set((trigger.options ?? []).map((o) => o.id));
      const wanted = Array.isArray(rule.value) ? rule.value : [rule.value];
      for (const v of wanted) {
        if (typeof v === "string" && !optionIds.has(v)) {
          out.push({
            severity: "error",
            code: "DELETED_OPTION_REF",
            message: `Rule "${rule.id}" checks for option "${v}", which no longer exists on "${trigger.label}".`,
            ruleId: rule.id,
            questionId: trigger.id,
            suggestion: `Point the rule at one of: ${[...optionIds].join(", ") || "(no options)"}.`,
          });
        }
      }
    }

    if (rule.action === "JUMP") {
      if (rule.targetId !== "END" && !pageIds.has(rule.targetId)) {
        out.push({
          severity: "error",
          code: "DANGLING_TARGET_PAGE",
          message: `Rule "${rule.id}" jumps to page "${rule.targetId}", which does not exist.`,
          ruleId: rule.id,
          suggestion: 'Point the jump at an existing page, or at "END" to finish the form.',
        });
      }
      continue;
    }

    // SHOW / HIDE / REQUIRE target a question.
    const target = questionMap.get(rule.targetId);
    if (!target) {
      out.push({
        severity: "error",
        code: "DANGLING_TARGET_QUESTION",
        message: `Rule "${rule.id}" ${rule.action}s question "${rule.targetId}", which does not exist.`,
        ruleId: rule.id,
        suggestion: "The target question was probably deleted. Delete this rule.",
      });
      continue;
    }

    if (rule.triggerId === rule.targetId) {
      out.push({
        severity: "error",
        code: "SELF_REFERENCING_RULE",
        message: `Rule "${rule.id}" uses "${target.label}" to control itself.`,
        ruleId: rule.id,
        questionId: target.id,
        suggestion: "A question cannot show or hide itself. Trigger it from an earlier question.",
      });
      continue;
    }

    // THE INVARIANT. A trigger that comes after its target is unanswerable: at
    // the moment we must decide whether to show the target, no answer exists.
    // Enforcing this is what lets resolve() work in one ordered pass, with no
    // topological sort and no cycles.
    const tPos = position.get(rule.triggerId)!;
    const gPos = position.get(rule.targetId)!;
    if (tPos >= gPos) {
      out.push({
        severity: "error",
        code: "TRIGGER_AFTER_TARGET",
        message: `Rule "${rule.id}" ${rule.action}s "${target.label}" based on "${trigger.label}" — but "${trigger.label}" comes later in the form, so it has no answer yet.`,
        ruleId: rule.id,
        questionId: target.id,
        suggestion: `Move "${trigger.label}" before "${target.label}", or trigger the rule from a question that comes earlier.`,
      });
    }

    // NOTE: a rule crossing a page boundary is NOT flagged.
    //
    // There used to be a CHILD_ON_OTHER_PAGE warning here, on the theory that a
    // reveal is a same-screen interaction and a cross-page one meant the author
    // wanted a JUMP. That theory is wrong, and it penalised a completely ordinary
    // pattern: a conference form asks "ticket type?" on page 1 and hides "Company
    // name" on page 2 for students. A JUMP cannot express that — page 2 also
    // holds questions students DO answer, so the page cannot be skipped.
    //
    // The only constraint that matters is TRIGGER_AFTER_TARGET, above: the
    // trigger must come earlier in DOCUMENT order. Which page it sits on is
    // irrelevant.

    // A REQUIRE rule on a question that is ALREADY unconditionally required can
    // never change the outcome — isRequired() is `q.required || rule fires`, so
    // the left side already short-circuits. The author almost certainly meant to
    // leave the question optional and let the rule decide.
    if (rule.action === "REQUIRE" && target.required) {
      out.push({
        severity: "warning",
        code: "REDUNDANT_REQUIRE_RULE",
        message: `Rule "${rule.id}" makes "${target.label}" required, but it is already required for everyone — so the rule can never change anything.`,
        ruleId: rule.id,
        questionId: target.id,
        suggestion: `Set "${target.label}" to optional so the rule decides, or delete the rule.`,
      });
    }
  }

  // ── Trigger types + nesting depth ──────────────────────────────────────────
  for (const rule of logic) {
    const trigger = questionMap.get(rule.triggerId);
    if (!trigger) continue; // already reported as DANGLING_TRIGGER

    if (EMPTINESS_OPS.has(rule.condition as string)) continue; // safe on any type

    if (!TRIGGERABLE_BY_VALUE.has(trigger.type)) {
      out.push({
        severity: "error",
        code: "INVALID_TRIGGER_TYPE",
        message: `Rule "${rule.id}" branches on the value of "${trigger.label}", but a ${trigger.type} answer is free text — matching it is unreliable.`,
        ruleId: rule.id,
        questionId: trigger.id,
        suggestion: `Trigger the rule from a yes/no, choice, rating or number question. To branch on "did they fill it in", use is_empty / is_not_empty instead.`,
      });
    }
  }

  const depths = depthOf(content);
  for (const [questionId, depth] of depths) {
    if (depth < DEEP_NESTING_WARNING_AT) continue;

    const q = questionMap.get(questionId);
    out.push({
      severity: "warning",
      code: "DEEP_NESTING",
      message: `"${q?.label ?? questionId}" is ${depth} conditions deep. Forms this nested are hard to fill in and hard to edit.`,
      questionId,
      suggestion: "Consider moving this branch onto its own page and reaching it with a JUMP.",
    });
  }

  // ── Page graph: cycles + reachability ──────────────────────────────────────
  const WHITE = 0, GREY = 1, BLACK = 2;
  const colour = new Map<string, number>(pages.map((p) => [p.id, WHITE]));
  const reachable = new Set<string>();
  const pageById = new Map(pages.map((p) => [p.id, p]));
  const reportedCycle = new Set<string>();

  const walk = (pageId: string): void => {
    if (pageId === "END") return;
    const page = pageById.get(pageId);
    if (!page) return; // dangling target, already reported

    if (colour.get(pageId) === GREY && !reportedCycle.has(pageId)) {
      reportedCycle.add(pageId);
      out.push({
        severity: "error",
        code: "JUMP_CYCLE",
        message: `The jumps form a loop that returns to page "${pageId}". A respondent could never finish the form.`,
        pageId,
        suggestion: "Remove or repoint the backward jump so every path eventually reaches the end.",
      });
      return;
    }
    if (colour.get(pageId) !== WHITE) return;

    colour.set(pageId, GREY);
    reachable.add(pageId);
    for (const next of outgoingEdges(page, pages, logic)) walk(next);
    colour.set(pageId, BLACK);
  };

  walk(pages[0]!.id);

  for (const page of pages) {
    if (reachable.has(page.id)) continue;

    out.push({
      severity: "warning",
      code: "UNREACHABLE_PAGE",
      message: `Page "${page.id}" cannot be reached by any path through the form.`,
      pageId: page.id,
      suggestion: "Add a jump that leads here, or delete the page.",
    });

    // A required question stranded on an unreachable page is strictly worse
    // than an unreachable page: it is data the author believes they collect.
    for (const q of page.questions ?? []) {
      if (!q.required) continue;
      out.push({
        severity: "error",
        code: "DEAD_REQUIRED_QUESTION",
        message: `"${q.label}" is required but sits on unreachable page "${page.id}" — nobody can ever answer it.`,
        pageId: page.id,
        questionId: q.id,
        suggestion: "Make the page reachable, or make the question optional, or delete it.",
      });
    }
  }

  return out;
}

/** Convenience for the publish gate: errors block, warnings do not. */
export function canPublish(content: FormContent): boolean {
  return !validate(content).some((d) => d.severity === "error");
}
