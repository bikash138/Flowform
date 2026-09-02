import { describe, expect, it } from "vitest";
import { resolve } from "../resolve";
import { validate } from "../validate";
import { validateAnswers } from "../validate-answers";
import { form, opts, page, q, rule } from "./fixtures";
import type { AnswerEntry } from "@flowform/database/models";

const entry = (
  questionId: string,
  type: AnswerEntry["type"],
  value: AnswerEntry["value"],
): AnswerEntry => ({ questionId, type, value });

/* ═══════════════════════════════════════════════════════════════════════════
   HIDE — "ask everyone EXCEPT one group"
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 *   Q: What's your role?   Student · Employee · Founder · Freelancer · Retired
 *   Q: Company name        ← ask everyone EXCEPT students
 *
 * One HIDE rule names the exception. Doing this with SHOW would take four rules,
 * and adding a sixth role later would silently hide the question from it.
 */
const ROLE_FORM = form(
  [
    page("p1", 0, [
      q("q_role", "radio", 0, {
        required: true,
        options: opts("student", "employee", "founder", "freelancer", "retired"),
      }),
      q("q_company", "short_text", 1, { required: true }),
    ]),
  ],
  [rule("hr1", "q_role", "equals", "student", "HIDE", "q_company")],
);

describe("HIDE — visible by default, suppressed on match", () => {
  it("hides the question for the one group named", () => {
    const r = resolve(ROLE_FORM, { q_role: "student" });
    expect(r.visibleQuestionIds.has("q_company")).toBe(false);
  });

  it("shows it for every OTHER group, with no rule per group", () => {
    for (const role of ["employee", "founder", "freelancer", "retired"]) {
      const r = resolve(ROLE_FORM, { q_role: role });
      expect(r.visibleQuestionIds.has("q_company")).toBe(true);
    }
  });

  it("shows it for a role added LATER — this is why HIDE beats four SHOW rules", () => {
    // A sixth option appears. With SHOW rules the author would have had to add a
    // fifth rule; forgetting would silently hide the question. With HIDE the new
    // role inherits the default (visible) automatically.
    const withNewRole = form(
      [
        page("p1", 0, [
          q("q_role", "radio", 0, {
            required: true,
            options: opts("student", "employee", "founder", "freelancer", "retired", "contractor"),
          }),
          q("q_company", "short_text", 1, { required: true }),
        ]),
      ],
      [rule("hr1", "q_role", "equals", "student", "HIDE", "q_company")],
    );

    expect(resolve(withNewRole, { q_role: "contractor" }).visibleQuestionIds.has("q_company")).toBe(true);
  });

  it("is visible before anything is answered (opt-OUT, unlike SHOW)", () => {
    // The trigger is empty, so the HIDE cannot fire — and there is no SHOW rule
    // to keep it hidden. Contrast with a SHOW-gated question, which starts hidden.
    expect(resolve(ROLE_FORM, {}).visibleQuestionIds.has("q_company")).toBe(true);
  });

  it("a hidden question is never required, even though required: true", () => {
    const r = resolve(ROLE_FORM, { q_role: "student" });
    expect(ROLE_FORM.pages[0]!.questions[1]!.required).toBe(true);
    expect(r.requiredQuestionIds.has("q_company")).toBe(false);
  });

  it("the server accepts a student who never saw the company field", () => {
    expect(
      validateAnswers(ROLE_FORM, [entry("q_role", "radio", "student")]),
    ).toEqual({ ok: true });
  });

  it("the server still demands it from an employee", () => {
    const result = validateAnswers(ROLE_FORM, [entry("q_role", "radio", "employee")]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.q_company).toMatch(/required/i);
  });

  it("HIDE beats SHOW when both fire", () => {
    const f = form(
      [page("p1", 0, [q("gate", "yes_no", 0), q("target", "short_text", 1)])],
      [
        rule("s", "gate", "equals", true, "SHOW", "target"),
        rule("h", "gate", "equals", true, "HIDE", "target"),
      ],
    );
    expect(resolve(f, { gate: true }).visibleQuestionIds.has("target")).toBe(false);
  });

  it("validates clean", () => {
    expect(validate(ROLE_FORM)).toEqual([]);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   CONDITIONAL REQUIRE — "visible to everyone, mandatory for some"
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 *   Q: Are you a student or a professional?   [Student] [Professional]
 *   Q: Years of experience   { required: false }   ← NO SHOW rule. Everyone sees it.
 *
 *   student      → optional (but still on screen — a student CAN answer)
 *   professional → MANDATORY
 *
 * SHOW cannot express this: visibility is identical for both groups. Only the
 * REQUIREMENT differs. Note the REQUIRE rule stands ALONE — there is no SHOW
 * rule for it to hang off.
 */
const EXPERIENCE_FORM = form(
  [
    page("p1", 0, [
      q("q_role", "radio", 0, { required: true, options: opts("student", "pro") }),
      q("q_experience", "number", 1, { required: false }), // optional by default
    ]),
  ],
  [rule("rr1", "q_role", "equals", "pro", "REQUIRE", "q_experience")],
);

describe("REQUIRE — visible to everyone, mandatory for some", () => {
  it("the field is visible to BOTH groups", () => {
    expect(resolve(EXPERIENCE_FORM, { q_role: "student" }).visibleQuestionIds.has("q_experience")).toBe(true);
    expect(resolve(EXPERIENCE_FORM, { q_role: "pro" }).visibleQuestionIds.has("q_experience")).toBe(true);
  });

  it("is OPTIONAL for a student — who can still answer it if they want", () => {
    const r = resolve(EXPERIENCE_FORM, { q_role: "student" });
    expect(r.requiredQuestionIds.has("q_experience")).toBe(false);
  });

  it("is MANDATORY for a professional", () => {
    const r = resolve(EXPERIENCE_FORM, { q_role: "pro" });
    expect(r.requiredQuestionIds.has("q_experience")).toBe(true);
  });

  it("the server lets a student submit without it", () => {
    expect(
      validateAnswers(EXPERIENCE_FORM, [entry("q_role", "radio", "student")]),
    ).toEqual({ ok: true });
  });

  it("the server lets a student submit WITH it — it is optional, not forbidden", () => {
    expect(
      validateAnswers(EXPERIENCE_FORM, [
        entry("q_role", "radio", "student"),
        entry("q_experience", "number", 2),
      ]),
    ).toEqual({ ok: true });
  });

  it("the server blocks a professional who leaves it blank", () => {
    const result = validateAnswers(EXPERIENCE_FORM, [entry("q_role", "radio", "pro")]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.q_experience).toMatch(/required/i);
  });

  it("a REQUIRE trigger may live on an EARLIER PAGE — requirement is not a same-screen concern", () => {
    const f = form(
      [
        page("p1", 0, [q("q_role", "radio", 0, { required: true, options: opts("student", "pro") })]),
        page("p2", 1, [q("q_experience", "number", 0, { required: false })]),
      ],
      [rule("rr1", "q_role", "equals", "pro", "REQUIRE", "q_experience")],
    );

    expect(resolve(f, { q_role: "pro" }).requiredQuestionIds.has("q_experience")).toBe(true);
    expect(resolve(f, { q_role: "student" }).requiredQuestionIds.has("q_experience")).toBe(false);

    // Crossing a page boundary is not a problem for ANY rule type. The only
    // constraint is that the trigger comes earlier in document order.
    expect(validate(f)).toEqual([]);
  });

  it("validates clean", () => {
    expect(validate(EXPERIENCE_FORM)).toEqual([]);
  });
});

describe("REQUIRE vs the plain `required` boolean", () => {
  it("a SHOW-gated question needs only the boolean — the walk gates it", () => {
    // "Why so low?" is revealed by a low rating and required whenever it appears.
    // No REQUIRE rule: a hidden question is never required, so the boolean is safe.
    const f = form(
      [
        page("p1", 0, [
          q("q_rating", "rating", 0, { required: true, config: { scale: 5 } }),
          q("q_why", "long_text", 1, { required: true }), // ← plain boolean
        ]),
      ],
      [rule("s1", "q_rating", "less_than", 3, "SHOW", "q_why")],
    );

    const happy = resolve(f, { q_rating: 5 });
    expect(happy.visibleQuestionIds.has("q_why")).toBe(false);
    expect(happy.requiredQuestionIds.has("q_why")).toBe(false); // hidden ⇒ never required

    const sad = resolve(f, { q_rating: 1 });
    expect(sad.visibleQuestionIds.has("q_why")).toBe(true);
    expect(sad.requiredQuestionIds.has("q_why")).toBe(true);

    expect(validate(f)).toEqual([]);
    expect(validateAnswers(f, [entry("q_rating", "rating", 5)])).toEqual({ ok: true });
  });

  it("warns when a REQUIRE rule sits on an already-required question", () => {
    // required: true short-circuits the OR, so the rule can never change anything.
    const f = form(
      [
        page("p1", 0, [
          q("q_role", "radio", 0, { options: opts("student", "pro") }),
          q("q_experience", "number", 1, { required: true }), // ← already required
        ]),
      ],
      [rule("rr1", "q_role", "equals", "pro", "REQUIRE", "q_experience")],
    );

    const d = validate(f).find((x) => x.code === "REDUNDANT_REQUIRE_RULE");
    expect(d).toBeDefined();
    expect(d!.severity).toBe("warning");
    expect(d!.suggestion).toMatch(/optional/i);
  });
});
