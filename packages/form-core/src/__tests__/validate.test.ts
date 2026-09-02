import { describe, expect, it } from "vitest";
import { canPublish, validate } from "../validate";
import { validateAnswers } from "../validate-answers";
import { FEEDBACK_FORM, form, opts, page, q, rule } from "./fixtures";
import type { AnswerEntry } from "@flowform/database/models";

const codes = (f: Parameters<typeof validate>[0]) => validate(f).map((d) => d.code);

describe("validate — the publish gate", () => {
  it("passes a well-formed form", () => {
    expect(validate(FEEDBACK_FORM)).toEqual([]);
    expect(canPublish(FEEDBACK_FORM)).toBe(true);
  });

  it("catches a trigger that comes after its target", () => {
    // The invariant that lets resolve() work in a single ordered pass.
    const f = form(
      [page("p1", 0, [q("target", "short_text", 0), q("trigger", "yes_no", 1)])],
      [rule("r1", "trigger", "equals", true, "SHOW", "target")],
    );

    expect(codes(f)).toContain("TRIGGER_AFTER_TARGET");
    expect(canPublish(f)).toBe(false);

    // The diagnostic must tell an agent (or a human) how to fix it.
    const d = validate(f).find((x) => x.code === "TRIGGER_AFTER_TARGET")!;
    expect(d.suggestion).toMatch(/Move/);
  });

  it("catches a rule pointing at a deleted question", () => {
    const f = form([page("p1", 0, [q("a", "yes_no", 0)])], [
      rule("r1", "ghost", "equals", true, "SHOW", "a"),
    ]);
    expect(codes(f)).toContain("DANGLING_TRIGGER");
  });

  it("catches a jump to a page that does not exist", () => {
    const f = form([page("p1", 0, [q("a", "yes_no", 0)])], [
      rule("r1", "a", "equals", true, "JUMP", "pg_gone"),
    ]);
    expect(codes(f)).toContain("DANGLING_TARGET_PAGE");
  });

  it("catches a rule checking for an option that was deleted", () => {
    // This one is nasty in production: the rule simply never fires, silently.
    const f = form(
      [page("p1", 0, [q("colour", "radio", 0, { options: opts("red", "blue") }), q("why", "short_text", 1)])],
      [rule("r1", "colour", "equals", "green", "SHOW", "why")],
    );

    const d = validate(f).find((x) => x.code === "DELETED_OPTION_REF");
    expect(d).toBeDefined();
    expect(d!.suggestion).toContain("red");
  });

  it("catches a jump loop", () => {
    const f = form(
      [page("p1", 0, [q("a", "yes_no", 0)]), page("p2", 1, [q("b", "yes_no", 0)])],
      [rule("r1", "b", "equals", true, "JUMP", "p1")],
    );
    expect(codes(f)).toContain("JUMP_CYCLE");
  });

  it("catches a question that can never show or hide itself", () => {
    const f = form([page("p1", 0, [q("a", "yes_no", 0)])], [
      rule("r1", "a", "equals", true, "SHOW", "a"),
    ]);
    expect(codes(f)).toContain("SELF_REFERENCING_RULE");
  });

  it("catches a required question stranded on an unreachable page", () => {
    const f = form([
      page("p1", 0, [q("a", "yes_no", 0)], "END"), // defaultNext jumps clean over p2
      page("p2", 1, [q("orphan", "short_text", 0, { required: true })]),
    ]);

    const c = codes(f);
    expect(c).toContain("UNREACHABLE_PAGE");
    expect(c).toContain("DEAD_REQUIRED_QUESTION");
    expect(canPublish(f)).toBe(false);
  });
});

describe("validateAnswers — the server-side check", () => {
  const entry = (questionId: string, type: AnswerEntry["type"], value: AnswerEntry["value"]): AnswerEntry => ({
    questionId,
    type,
    value,
  });

  it("accepts a prospect who legitimately skipped the whole customer branch", () => {
    // THE BUG FIX. q_plan is required:true, and is absent — and that is correct,
    // because this respondent jumped over it. The old validator rejected this.
    const result = validateAnswers(FEEDBACK_FORM, [
      entry("q_customer", "radio", "opt_no"),
      entry("q_current_tool", "short_text", "Google Forms"),
      entry("q_blocker", "radio", "opt_price"),
    ]);

    expect(result).toEqual({ ok: true });
  });

  it("accepts a full customer path", () => {
    const result = validateAnswers(FEEDBACK_FORM, [
      entry("q_customer", "radio", "opt_yes"),
      entry("q_plan", "select", "opt_pro"),
      entry("q_satisfaction", "rating", 2),
      entry("q_problem", "long_text", "Exports are slow."),
      entry("q_features", "checkbox", ["opt_logic", "opt_other"]),
      entry("q_features_other", "short_text", "Webhooks"),
      entry("q_email", "email", "a@corp.com"),
      entry("q_followup", "yes_no", true),
    ]);

    expect(result).toEqual({ ok: true });
  });

  it("rejects a conditionally-required question left blank", () => {
    const result = validateAnswers(FEEDBACK_FORM, [
      entry("q_customer", "radio", "opt_yes"),
      entry("q_plan", "select", "opt_pro"),
      entry("q_satisfaction", "rating", 1), // < 3, so q_problem became required
      entry("q_features", "checkbox", ["opt_logic"]),
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.q_problem).toMatch(/required/i);
  });

  it("rejects an answer stuffed into a branch the respondent never reached", () => {
    const result = validateAnswers(FEEDBACK_FORM, [
      entry("q_customer", "radio", "opt_no"), // jumps to the prospect branch
      entry("q_blocker", "radio", "opt_price"),
      entry("q_plan", "select", "opt_pro"), // ← never reachable
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.q_plan).toMatch(/not reachable/i);
  });

  it("rejects an option id that is not on the question", () => {
    const result = validateAnswers(FEEDBACK_FORM, [
      entry("q_customer", "radio", "opt_hacker"),
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.q_customer).toBeDefined();
  });

  it("rejects a type that does not match the question", () => {
    const result = validateAnswers(FEEDBACK_FORM, [
      entry("q_customer", "yes_no", true), // q_customer is a radio
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.q_customer).toMatch(/type/i);
  });

  it("returns errors keyed by question, so the UI can highlight the field", () => {
    const result = validateAnswers(FEEDBACK_FORM, [entry("q_customer", "radio", "opt_yes")]);

    expect(result.ok).toBe(false);
    // q_plan and q_satisfaction are both required on the page they landed on.
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["q_features", "q_plan", "q_satisfaction"]);
    }
  });
});
