import { describe, expect, it } from "vitest";
import { nextPageAfter, resolve } from "../resolve";
import { simulate } from "../simulate";
import { FEEDBACK_FORM, form, opts, page, q, rule } from "./fixtures";

const ids = (s: Set<string>) => [...s].sort();

describe("resolve — the walk", () => {
  it("walks straight through a form with no logic", () => {
    const f = form([page("p1", 0, [q("a", "short_text", 0)]), page("p2", 1, [q("b", "short_text", 0)])]);
    const r = resolve(f, {});

    expect(r.path).toEqual(["p1", "p2"]);
    expect(ids(r.visibleQuestionIds)).toEqual(["a", "b"]);
  });

  it("JUMP skips the pages in between", () => {
    const r = resolve(FEEDBACK_FORM, { q_customer: "opt_no" });

    expect(r.path).toEqual(["pg_intro", "pg_prospect", "pg_contact"]);
    // The entire customer branch was never asked...
    expect(r.visibleQuestionIds.has("q_plan")).toBe(false);
    expect(r.visibleQuestionIds.has("q_satisfaction")).toBe(false);
    // ...and crucially, q_plan is `required: true` yet is NOT required here.
    // This is the exact case the old server-side validator got wrong.
    expect(r.requiredQuestionIds.has("q_plan")).toBe(false);
  });

  it("defaultNext lets a branch rejoin the shared tail", () => {
    const r = resolve(FEEDBACK_FORM, { q_customer: "opt_yes", q_satisfaction: 5 });

    // pg_features.defaultNext = pg_contact, so the prospect page is skipped.
    expect(r.path).toEqual(["pg_intro", "pg_experience", "pg_features", "pg_contact"]);
    expect(r.visibleQuestionIds.has("q_blocker")).toBe(false);
  });

  it("SHOW keeps a question hidden until its rule fires", () => {
    const happy = resolve(FEEDBACK_FORM, { q_customer: "opt_yes", q_satisfaction: 5 });
    expect(happy.visibleQuestionIds.has("q_problem")).toBe(false);

    const unhappy = resolve(FEEDBACK_FORM, { q_customer: "opt_yes", q_satisfaction: 2 });
    expect(unhappy.visibleQuestionIds.has("q_problem")).toBe(true);
  });

  it("REQUIRE promotes an optional question when its rule fires", () => {
    const unhappy = resolve(FEEDBACK_FORM, { q_customer: "opt_yes", q_satisfaction: 2 });

    // q_problem is `required: false` in the document...
    expect(FEEDBACK_FORM.pages[1]!.questions[2]!.required).toBe(false);
    // ...but the REQUIRE rule fired, so it is mandatory for THIS respondent.
    expect(unhappy.requiredQuestionIds.has("q_problem")).toBe(true);
  });

  it("`contains` on a checkbox means 'this option is ticked'", () => {
    const base = { q_customer: "opt_yes", q_satisfaction: 4 };

    const without = resolve(FEEDBACK_FORM, { ...base, q_features: ["opt_logic"] });
    expect(without.visibleQuestionIds.has("q_features_other")).toBe(false);

    const with_ = resolve(FEEDBACK_FORM, { ...base, q_features: ["opt_logic", "opt_other"] });
    expect(with_.visibleQuestionIds.has("q_features_other")).toBe(true);
    expect(with_.requiredQuestionIds.has("q_features_other")).toBe(true);
  });

  it("HIDE beats SHOW when both fire", () => {
    const f = form(
      [page("p1", 0, [q("trigger", "yes_no", 0), q("target", "short_text", 1)])],
      [
        rule("r1", "trigger", "equals", true, "SHOW", "target"),
        rule("r2", "trigger", "equals", true, "HIDE", "target"),
      ],
    );

    expect(resolve(f, { trigger: true }).visibleQuestionIds.has("target")).toBe(false);
  });

  it("a question with no SHOW rule is visible by default", () => {
    const f = form([page("p1", 0, [q("a", "short_text", 0)])]);
    expect(resolve(f, {}).visibleQuestionIds.has("a")).toBe(true);
  });
});

describe("resolve — the cascade (hidden ⇒ empty)", () => {
  it("a hidden question's answer cannot drive a rule", () => {
    // q1 shows q2. q2 shows q3. Answering q1 'no' must collapse BOTH.
    const f = form(
      [
        page("p1", 0, [
          q("q1", "yes_no", 0),
          q("q2", "yes_no", 1),
          q("q3", "short_text", 2),
        ]),
      ],
      [
        rule("r1", "q1", "equals", true, "SHOW", "q2"),
        rule("r2", "q2", "equals", true, "SHOW", "q3"),
      ],
    );

    // Note q2 still has a stale `true` sitting in the answer map — the user
    // answered it, then went back and changed q1. It must not reveal q3.
    const r = resolve(f, { q1: false, q2: true });

    expect(r.visibleQuestionIds.has("q2")).toBe(false);
    expect(r.visibleQuestionIds.has("q3")).toBe(false);
    // The stale answer is excluded from the effective set entirely.
    expect(r.effectiveAnswers.q2).toBeUndefined();
  });

  it("a hidden trigger cannot fire a JUMP", () => {
    const f = form(
      [
        page("p1", 0, [q("gate", "yes_no", 0), q("jumper", "yes_no", 1)]),
        page("p2", 1, [q("mid", "short_text", 0)]),
        page("p3", 2, [q("last", "short_text", 0)]),
      ],
      [
        rule("r1", "gate", "equals", true, "SHOW", "jumper"),
        rule("r2", "jumper", "equals", true, "JUMP", "p3"),
      ],
    );

    // `jumper` is hidden (gate is false), so its stale `true` must not skip p2.
    const r = resolve(f, { gate: false, jumper: true });
    expect(r.path).toEqual(["p1", "p2", "p3"]);
  });

  it("`not_equals` does not fire on an empty answer", () => {
    // Otherwise an unanswered question would satisfy "is not X" and reveal
    // things before the respondent has touched anything.
    const f = form(
      [page("p1", 0, [q("trigger", "radio", 0, { options: opts("a", "b") }), q("target", "short_text", 1)])],
      [rule("r1", "trigger", "not_equals", "a", "SHOW", "target")],
    );

    expect(resolve(f, {}).visibleQuestionIds.has("target")).toBe(false);
    expect(resolve(f, { trigger: "b" }).visibleQuestionIds.has("target")).toBe(true);
  });
});

describe("resolve — pages with nothing left to show", () => {
  it("walks THROUGH a conversational page whose only question is hidden", () => {
    // In the conversational layout a page holds exactly one question, so hiding
    // that question empties the page. It must be skipped, not painted blank.
    const f = form(
      [
        page("p1", 0, [q("has_pet", "yes_no", 0)]),
        page("p2", 1, [q("pet_name", "short_text", 0)]), // hidden when has_pet = false
        page("p3", 2, [q("email", "email", 0)]),
      ],
      [rule("r1", "has_pet", "equals", true, "SHOW", "pet_name")],
    );

    const withPet = resolve(f, { has_pet: true });
    expect(withPet.path).toEqual(["p1", "p2", "p3"]);

    const withoutPet = resolve(f, { has_pet: false });
    expect(withoutPet.path).toEqual(["p1", "p3"]); // p2 never shown
    expect(withoutPet.visibleQuestionIds.has("pet_name")).toBe(false);
  });

  it("skips a vertical page when every question on it is hidden", () => {
    const f = form(
      [
        page("p1", 0, [q("gate", "yes_no", 0)]),
        page("p2", 1, [q("a", "short_text", 0), q("b", "short_text", 1)]),
        page("p3", 2, [q("z", "short_text", 0)]),
      ],
      [
        rule("r1", "gate", "equals", true, "SHOW", "a"),
        rule("r2", "gate", "equals", true, "SHOW", "b"),
      ],
    );

    expect(resolve(f, { gate: true }).path).toEqual(["p1", "p2", "p3"]);
    expect(resolve(f, { gate: false }).path).toEqual(["p1", "p3"]);
  });

  it("still honours defaultNext when walking through an emptied page", () => {
    const f = form(
      [
        page("p1", 0, [q("gate", "yes_no", 0)]),
        page("p2", 1, [q("hidden", "short_text", 0)], "p4"), // defaultNext skips p3
        page("p3", 2, [q("never", "short_text", 0)]),
        page("p4", 3, [q("last", "short_text", 0)]),
      ],
      [rule("r1", "gate", "equals", true, "SHOW", "hidden")],
    );

    // p2 is emptied, but its "always go to p4" still applies.
    expect(resolve(f, { gate: false }).path).toEqual(["p1", "p4"]);
  });

  it("nextPageAfter skips over an emptied page", () => {
    const f = form(
      [
        page("p1", 0, [q("gate", "yes_no", 0)]),
        page("p2", 1, [q("maybe", "short_text", 0)]),
        page("p3", 2, [q("last", "short_text", 0)]),
      ],
      [rule("r1", "gate", "equals", true, "SHOW", "maybe")],
    );

    expect(nextPageAfter(f, { gate: true }, "p1")).toBe("p2");
    expect(nextPageAfter(f, { gate: false }, "p1")).toBe("p3"); // straight past p2
  });
});

describe("resolve — edge cases", () => {
  it("survives a JUMP cycle instead of looping forever", () => {
    const f = form(
      [page("p1", 0, [q("a", "yes_no", 0)]), page("p2", 1, [q("b", "yes_no", 0)])],
      [rule("r1", "b", "equals", true, "JUMP", "p1")],
    );

    const r = resolve(f, { a: true, b: true });
    expect(r.truncated).toBe(true);
    expect(r.path).toEqual(["p1", "p2"]); // stopped, did not hang
  });

  it("JUMP to END finishes the form", () => {
    const f = form(
      [page("p1", 0, [q("bail", "yes_no", 0)]), page("p2", 1, [q("never", "short_text", 0)])],
      [rule("r1", "bail", "equals", true, "JUMP", "END")],
    );

    const r = resolve(f, { bail: true });
    expect(r.path).toEqual(["p1"]);
    expect(r.visibleQuestionIds.has("never")).toBe(false);
  });

  it("handles an empty form without throwing", () => {
    const r = resolve(form([]), {});
    expect(r.path).toEqual([]);
  });
});

describe("simulate", () => {
  it("reports the prospect's journey", () => {
    const s = simulate(FEEDBACK_FORM, { q_customer: "opt_no", q_blocker: "opt_price" });

    expect(s.path).toEqual(["pg_intro", "pg_prospect", "pg_contact"]);
    expect(s.asked.map((a) => a.id)).toEqual(["q_customer", "q_current_tool", "q_blocker", "q_email"]);
    expect(s.missingRequired).toEqual([]);
    expect(s.skipped).toContain("q_plan");
  });

  it("flags a required question the respondent skipped", () => {
    const s = simulate(FEEDBACK_FORM, { q_customer: "opt_yes", q_satisfaction: 1 });
    // The low rating made q_problem mandatory, and it is blank.
    expect(s.missingRequired).toContain("q_problem");
  });

  it("flags answers to questions that were never reachable", () => {
    const s = simulate(FEEDBACK_FORM, { q_customer: "opt_no", q_plan: "opt_pro" });
    expect(s.unreachableAnswers).toEqual(["q_plan"]);
  });
});
