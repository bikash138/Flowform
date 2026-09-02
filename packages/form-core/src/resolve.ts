import { matches } from "./conditions";
import { jumpsByPage, rulesByTarget } from "./graph";
import type {
  AnswerMap,
  FormContent,
  LogicRule,
  PageNext,
  PageWithNext,
  Question,
  Resolved,
} from "./types";

/**
 * Is this question on screen?
 *
 * Default state: VISIBLE — unless it is the target of at least one SHOW rule,
 * which flips it to opt-in (hidden until some SHOW rule fires).
 * A matching HIDE rule always wins.
 *
 * `answers` here must be the EFFECTIVE answers (visible questions only), so a
 * hidden trigger cannot reveal anything. See conditions.ts.
 */
function isVisible(myRules: LogicRule[], answers: AnswerMap): boolean {
  let hasShowRule = false;
  let showFired = false;

  for (const rule of myRules) {
    if (rule.action === "SHOW") {
      hasShowRule = true;
      if (matches(rule, answers)) showFired = true;
    } else if (rule.action === "HIDE" && matches(rule, answers)) {
      return false; // HIDE always wins
    }
  }

  return hasShowRule ? showFired : true;
}

function isRequired(q: Question, myRules: LogicRule[], answers: AnswerMap): boolean {
  if (q.required) return true;
  return myRules.some((r) => r.action === "REQUIRE" && matches(r, answers));
}

/** Where do we go after `page`? Conditional JUMP > page.defaultNext > next in order. */
function nextPageId(
  page: PageWithNext,
  pages: PageWithNext[],
  myJumps: LogicRule[],
  effective: AnswerMap,
  visible: Set<string>,
): PageNext | undefined {
  // 1. First matching JUMP triggered by a question on THIS page.
  //    (A jump fires when you LEAVE the page holding its trigger.)
  for (const rule of myJumps) {
    // A hidden question cannot teleport anyone — its stale answer is dead.
    if (!visible.has(rule.triggerId)) continue;
    if (matches(rule, effective)) return rule.targetId as PageNext;
  }

  // 2. The page's unconditional next, if the author set one (lets branches rejoin).
  if (page.defaultNext) return page.defaultNext;

  // 3. Fall through to the next page in document order.
  const idx = pages.findIndex((p) => p.id === page.id);
  return pages[idx + 1]?.id;
}

const NO_RULES: LogicRule[] = [];

/**
 * Replay a respondent's journey through the form.
 *
 * This is THE function. Given a form and a set of answers, it walks the form
 * from page one — following jumps exactly as the respondent's browser did —
 * and reports which questions that person was actually asked.
 *
 * Both sides must call this:
 *   - the renderer, to decide what to paint
 *   - the server, to decide what to accept
 *
 * It is a pure function of (content, answers), which is why both sides always
 * agree. Never let a second implementation of this exist.
 *
 * NOTE ON NESTING: there is none. A "sub-question" is just a question with a
 * condition on it, and a "sub-sub-question" is a question whose condition points
 * at a question that itself has one. Depth is emergent and needs no support —
 * the cascade below handles it for free, at any depth.
 */
export function resolve(content: FormContent, answers: AnswerMap): Resolved {
  const pages = (content.pages ?? []) as PageWithNext[];
  const logic = content.logic ?? [];

  const path: string[] = [];
  const visibleQuestionIds = new Set<string>();
  const requiredQuestionIds = new Set<string>();
  const effectiveAnswers: AnswerMap = {};
  let truncated = false;

  if (pages.length === 0) {
    return { path, visibleQuestionIds, requiredQuestionIds, effectiveAnswers, truncated };
  }

  // Indexes, derived once. Every lookup below is then O(1) instead of a scan of
  // the whole rule array. Derived, never stored — so it cannot drift.
  const pageById = new Map(pages.map((p) => [p.id, p]));
  const byTarget = rulesByTarget(logic);
  const byPage = jumpsByPage(content);

  const seen = new Set<string>();
  let cursor: PageNext | undefined = pages[0]!.id;

  while (cursor && cursor !== "END") {
    if (seen.has(cursor)) {
      truncated = true; // JUMP cycle — bail out rather than loop forever
      break;
    }
    seen.add(cursor);

    const page = pageById.get(cursor);
    if (!page) break; // dangling jump target; validate() reports this

    // Questions are decided in document order, so by the time we reach any
    // question, every answer that could affect it has already been settled.
    // This is why no topological sort is needed — see validate()'s
    // TRIGGER_AFTER_TARGET check, which guarantees the invariant holds.
    const ordered = [...(page.questions ?? [])].sort((a, b) => a.order - b.order);

    let visibleOnThisPage = 0;

    for (const q of ordered) {
      const myRules = byTarget.get(q.id) ?? NO_RULES;

      if (!isVisible(myRules, effectiveAnswers)) continue;

      visibleOnThisPage++;
      visibleQuestionIds.add(q.id);

      // THE LOAD-BEARING LINE. Only a VISIBLE question's answer goes into the
      // bag that rules are evaluated against. So when a parent is hidden, its
      // answer vanishes, its children's rules find nothing, and they hide too —
      // and so do THEIR children, at any depth. The cascade is the nesting.
      effectiveAnswers[q.id] = answers[q.id] ?? null;

      if (isRequired(q, myRules, effectiveAnswers)) requiredQuestionIds.add(q.id);
    }

    // A page whose questions are all hidden must be walked THROUGH, not shown,
    // or the renderer paints a blank screen with a lone Next button. Its exits
    // are still evaluated below, so a defaultNext on it still applies.
    //
    // With children pinned to their parent's page this is rare (the parent is
    // always visible, so the page always has something on it) — but it is not
    // impossible, so the guard stays.
    if (visibleOnThisPage > 0) path.push(page.id);

    cursor = nextPageId(page, pages, byPage.get(page.id) ?? NO_RULES, effectiveAnswers, visibleQuestionIds);
  }

  return { path, visibleQuestionIds, requiredQuestionIds, effectiveAnswers, truncated };
}

/**
 * The single step the renderer needs on "Next": where does this page hand off to?
 * Returns null when the form is over (submit).
 */
export function nextPageAfter(
  content: FormContent,
  answers: AnswerMap,
  currentPageId: string,
): string | null {
  const { path } = resolve(content, answers);
  const idx = path.indexOf(currentPageId);

  // The current page is on the resolved path and has a successor.
  if (idx !== -1 && idx + 1 < path.length) return path[idx + 1]!;

  // Either the page ends the journey, or the answers moved the path out from
  // under us. Either way: nothing further to show.
  return null;
}
