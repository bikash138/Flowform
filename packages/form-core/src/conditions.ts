import type { AnswerMap, AnswerValue, LogicRule } from "./types";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT A RULE CAN DO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Four actions. They split into two independent questions about a question:
 *
 *   "Who even SEES it?"   → SHOW · HIDE
 *   "Who must ANSWER it?" → REQUIRE  (plus the plain `required` boolean)
 *   "Where do we GO next?"→ JUMP
 *
 *
 * ── SHOW vs HIDE — they are NOT opposites, they flip the DEFAULT ─────────────
 *
 * A question with no SHOW rule targeting it is VISIBLE by default.
 * The moment ANY SHOW rule targets it, it flips to HIDDEN by default — opt-in.
 * A matching HIDE rule always wins, whatever the SHOW rules said.
 *
 *   SHOW  = "appear ONLY when X"            → opt-in   (default: hidden)
 *   HIDE  = "appear ALWAYS, EXCEPT when X"  → opt-out  (default: visible)
 *
 * EXAMPLE — SHOW, because the question is for a specific group:
 *
 *   Q: "Do you have a pet?"  [Yes] [No]
 *   Q: "What's its name?"                        ← nobody without a pet should see this
 *
 *   { triggerId: "q_has_pet", condition: "equals", value: true,
 *     action: "SHOW", targetId: "q_pet_name" }
 *
 * EXAMPLE — HIDE, because the question is for everyone EXCEPT one group:
 *
 *   Q: "What's your role?"   [Student] [Employee] [Founder] [Freelancer] [Retired]
 *   Q: "Company name"                            ← ask everyone except students
 *
 *   { triggerId: "q_role", condition: "equals", value: "student",
 *     action: "HIDE", targetId: "q_company" }
 *
 *   Doing that one with SHOW would take FOUR rules (one per non-student role) —
 *   and the day someone adds a sixth role, the company question would silently
 *   vanish for it, because a missing SHOW rule is indistinguishable from an
 *   intentional hide. HIDE names the exception, so it survives new options.
 *
 *
 * ── REQUIRE vs the plain `required` boolean ─────────────────────────────────
 *
 * `q.required`  = "mandatory WHENEVER THIS QUESTION IS ON SCREEN"
 * REQUIRE rule  = "mandatory ONLY WHEN some condition fires"
 *
 * They are OR'd (see isRequired in resolve.ts), and — crucially — requirement is
 * only ever evaluated for questions the walk decided are VISIBLE. So a hidden
 * question is NEVER required, no matter what either says.
 *
 * That gating is why you rarely need REQUIRE:
 *
 * EXAMPLE — a SHOW-gated question. Use the plain boolean, NOT a REQUIRE rule:
 *
 *   Q: "How would you rate us?"  ★★★★★
 *   Q: "Why so low?"   { required: true }        ← SHOWn only when rating < 3
 *
 *   rating = 4  → hidden  → isRequired never even runs → not demanded ✅
 *   rating = 1  → visible → required: true            → demanded     ✅
 *
 *   Adding a REQUIRE rule here would be redundant: it would duplicate the SHOW
 *   rule's condition and have to be kept in lockstep with it forever.
 *
 * EXAMPLE — where REQUIRE genuinely earns its place:
 *
 *   The question is VISIBLE TO EVERYONE, but MANDATORY ONLY FOR SOME.
 *
 *   Q: "Are you a student or a professional?"  [Student] [Professional]
 *   Q: "Years of experience"   { required: false }   ← NO SHOW rule. Everyone sees it.
 *
 *   { triggerId: "q_role", condition: "equals", value: "pro",
 *     action: "REQUIRE", targetId: "q_experience" }
 *
 *   student      → rule doesn't fire → q.required (false) → OPTIONAL, but still
 *                                                            on screen, so a
 *                                                            student CAN answer  ✅
 *   professional → rule fires        → REQUIRED                                  ✅
 *
 *   SHOW cannot express this: visibility is identical for both groups. Only the
 *   REQUIREMENT differs. Note the REQUIRE rule stands ALONE — there is no SHOW
 *   rule for it to hang off, and its trigger is its own.
 *
 *
 * ── JUMP ────────────────────────────────────────────────────────────────────
 *
 * Targets a PAGE, not a question. Fires when leaving the page holding its
 * trigger — and only if that trigger is itself visible (see resolve.ts).
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function isEmpty(v: AnswerValue | undefined): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false; // 0 and false are real answers, not emptiness
}

function toNumber(v: AnswerValue): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Loose equality against a rule's stored `value` (which is typed `unknown`). */
function equals(answer: AnswerValue, expected: unknown): boolean {
  // Choice questions store the OPTION ID, and so must the rule's value.
  // A single-element array (a checkbox with one tick) equals that option id.
  if (Array.isArray(answer)) {
    return answer.length === 1 && answer[0] === expected;
  }
  if (typeof answer === "number" || typeof expected === "number") {
    const a = toNumber(answer);
    const b = typeof expected === "number" ? expected : toNumber(expected as AnswerValue);
    if (a !== null && b !== null) return a === b;
  }
  if (typeof answer === "boolean") {
    if (typeof expected === "boolean") return answer === expected;
    if (expected === "true" || expected === "false") return answer === (expected === "true");
  }
  return answer === expected;
}

function contains(answer: AnswerValue, expected: unknown): boolean {
  // checkbox → "is this option ticked?"
  if (Array.isArray(answer)) return answer.includes(String(expected));
  // text → substring, case-insensitive
  if (typeof answer === "string") {
    return answer.toLowerCase().includes(String(expected).toLowerCase());
  }
  return false;
}

/**
 * Does this rule's condition fire, given the answers so far?
 *
 * ── THE LOAD-BEARING RULE: AN EMPTY TRIGGER NEVER MATCHES ────────────────────
 *
 * `resolve()` only ever passes in answers for questions that are actually
 * VISIBLE. So a hidden question reads as empty here, none of its rules fire, and
 * anything it would have revealed stays hidden. That is how a cascade collapses
 * — at any depth — with no special-case code anywhere:
 *
 *   answers = { q_has_pet: false, q_which_pet: "dog", q_dog_breed: "Beagle" }
 *                                        ↑ stale             ↑ stale
 *
 *   q_has_pet   = false  → its SHOW rule for q_which_pet doesn't fire → hidden
 *   q_which_pet is hidden → its answer NEVER enters effectiveAnswers
 *   q_dog_breed's rule looks up q_which_pet → finds nothing → empty → hidden
 *
 *   Both stale answers evaporate. Neither is submitted.
 *
 * This is also why `not_equals` returns false on an empty trigger. If it didn't,
 * an *unanswered* question would satisfy "is not X" and start revealing things
 * before the respondent had touched anything — and a hidden trigger would keep
 * firing rules, which would break the cascade above.
 *
 * `is_empty` / `is_not_empty` are the deliberate exceptions: "did they fill this
 * in at all?" is a question you can safely ask of ANY answer, including a blank
 * one. That is what powers "only ask for a follow-up if they left an email".
 *
 * Unknown operators fail CLOSED — they never fire.
 */
export function matches(rule: LogicRule, answers: AnswerMap): boolean {
  const answer = answers[rule.triggerId] ?? null;
  const op = rule.condition as string;

  if (op === "is_empty") return isEmpty(answer);
  if (op === "is_not_empty") return !isEmpty(answer);

  if (isEmpty(answer)) return false;

  switch (op) {
    case "equals":
      return equals(answer, rule.value);

    case "not_equals":
      return !equals(answer, rule.value);

    case "contains":
      return contains(answer, rule.value);

    case "not_contains":
      return !contains(answer, rule.value);

    case "greater_than": {
      const a = toNumber(answer);
      const b = toNumber(rule.value as AnswerValue);
      return a !== null && b !== null && a > b;
    }

    case "less_than": {
      const a = toNumber(answer);
      const b = toNumber(rule.value as AnswerValue);
      return a !== null && b !== null && a < b;
    }

    case "is_one_of":
      return Array.isArray(rule.value) && rule.value.some((v) => equals(answer, v));

    default:
      return false; // unknown operator → never fires
  }
}
