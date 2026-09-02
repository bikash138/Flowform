import type { FormContent, LogicRule, Question } from "./types";

/** Rules that decide whether a question is on screen. */
const VISIBILITY_ACTIONS = new Set(["SHOW", "HIDE"]);

/**
 * Every rule, bucketed by the question it targets.
 *
 * Built ONCE per walk, then every lookup is O(1). This is the index you wanted
 * to store on the question as a `logicId` field — except it is DERIVED from the
 * rule list rather than duplicated alongside it, so it can never go stale.
 *
 * The `logic` array is the truth. Everything else is a view of it.
 */
export function rulesByTarget(logic: LogicRule[]): Map<string, LogicRule[]> {
  const map = new Map<string, LogicRule[]>();
  for (const rule of logic) {
    if (rule.action === "JUMP") continue; // JUMP targets a page, not a question
    const list = map.get(rule.targetId);
    if (list) list.push(rule);
    else map.set(rule.targetId, [rule]);
  }
  return map;
}

/** JUMP rules bucketed by the page their TRIGGER question lives on. */
export function jumpsByPage(content: FormContent): Map<string, LogicRule[]> {
  const questionPage = pageOfQuestion(content);
  const map = new Map<string, LogicRule[]>();

  for (const rule of content.logic ?? []) {
    if (rule.action !== "JUMP") continue;
    const pageId = questionPage.get(rule.triggerId);
    if (!pageId) continue; // dangling trigger; validate() reports it

    const list = map.get(pageId);
    if (list) list.push(rule);
    else map.set(pageId, [rule]);
  }
  return map;
}

export function pageOfQuestion(content: FormContent): Map<string, string> {
  const map = new Map<string, string>();
  for (const page of content.pages ?? []) {
    for (const q of page.questions ?? []) map.set(q.id, page.id);
  }
  return map;
}

export function allQuestions(content: FormContent): Map<string, Question> {
  const map = new Map<string, Question>();
  for (const page of content.pages ?? []) {
    for (const q of page.questions ?? []) map.set(q.id, q);
  }
  return map;
}

/**
 * parentQuestionId -> the questions it reveals.
 *
 * This is what the editor canvas needs to draw the indent. Note a parent can
 * have MANY children from MANY rules — "Which pet?" reveals a different child
 * per option (dog → breed, cat → indoor, fish → tank size) — which is exactly
 * why a single `logicId` field on the question could never have worked.
 */
export function childrenOf(content: FormContent): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const rule of content.logic ?? []) {
    if (rule.action !== "SHOW") continue;

    const list = map.get(rule.triggerId);
    if (list) {
      if (!list.includes(rule.targetId)) list.push(rule.targetId);
    } else {
      map.set(rule.triggerId, [rule.targetId]);
    }
  }
  return map;
}

/**
 * Questions that are HIDDEN BY DEFAULT — i.e. the target of a SHOW rule.
 *
 * These are the ones a renderer should indent and slide in: they are genuine
 * follow-ups, revealed by an answer above them.
 *
 * A HIDE-controlled question is deliberately NOT in this set. It is visible by
 * default and merely suppressed for one group, so it is a normal question with
 * an exception — not a follow-up. Indenting it would misrepresent it.
 */
export function conditionallyRevealed(content: FormContent): Set<string> {
  const set = new Set<string>();
  for (const rule of content.logic ?? []) {
    if (rule.action === "SHOW") set.add(rule.targetId);
  }
  return set;
}

/**
 * questionId -> the SHOW or HIDE rule controlling it, if any.
 *
 * The editor canvas needs the rule itself (not just the parent id) so it can say
 * "Shown when X" vs "Hidden when X" — those are opposite meanings and must not
 * be collapsed into one badge.
 */
export function visibilityRuleOf(content: FormContent): Map<string, LogicRule> {
  const map = new Map<string, LogicRule>();
  for (const rule of content.logic ?? []) {
    if (VISIBILITY_ACTIONS.has(rule.action)) map.set(rule.targetId, rule);
  }
  return map;
}

/** The questions that control whether this one appears. Usually zero or one. */
export function parentsOf(content: FormContent): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const rule of content.logic ?? []) {
    if (!VISIBILITY_ACTIONS.has(rule.action)) continue;

    const list = map.get(rule.targetId);
    if (list) {
      if (!list.includes(rule.triggerId)) list.push(rule.triggerId);
    } else {
      map.set(rule.targetId, [rule.triggerId]);
    }
  }
  return map;
}

/**
 * How deep is each question in the reveal chain?
 *
 *   0  always on screen
 *   1  revealed by an always-on-screen question   ("What's its name?")
 *   2  revealed by a question that is itself revealed  ("Which dog breed?")
 *
 * Depth is EMERGENT — it is not stored, not configured, and not limited by the
 * engine. It is simply what happens when conditions chain. The editor uses this
 * to indent the canvas, and to warn when a form is getting hard to follow.
 */
export function depthOf(content: FormContent): Map<string, number> {
  const parents = parentsOf(content);
  const depths = new Map<string, number>();
  const inProgress = new Set<string>();

  const compute = (questionId: string): number => {
    const cached = depths.get(questionId);
    if (cached !== undefined) return cached;

    // validate() guarantees triggers precede targets, so cycles are impossible.
    // Guard anyway: a malformed draft must not hang the editor.
    if (inProgress.has(questionId)) return 0;
    inProgress.add(questionId);

    const myParents = parents.get(questionId) ?? [];
    const depth =
      myParents.length === 0 ? 0 : 1 + Math.max(...myParents.map((p) => compute(p)));

    inProgress.delete(questionId);
    depths.set(questionId, depth);
    return depth;
  };

  for (const id of allQuestions(content).keys()) compute(id);
  return depths;
}
