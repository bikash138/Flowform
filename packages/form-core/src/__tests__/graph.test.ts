import { describe, expect, it } from "vitest";
import { childrenOf, depthOf, parentsOf } from "../graph";
import { resolve } from "../resolve";
import { validate } from "../validate";
import { form, opts, page, q, rule } from "./fixtures";

/** The pet form: two levels deep, one parent revealing a different child per option. */
const PET_FORM = form(
  [
    page("pg_pet", 0, [
      q("q_has_pet", "yes_no", 0, { required: true }),
      q("q_which_pet", "radio", 1, { options: opts("dog", "cat", "fish") }),
      q("q_dog_breed", "short_text", 2),
      q("q_cat_indoor", "yes_no", 3),
      q("q_tank_size", "number", 4),
    ]),
  ],
  [
    rule("r1", "q_has_pet", "equals", true, "SHOW", "q_which_pet"),
    rule("r2", "q_which_pet", "equals", "dog", "SHOW", "q_dog_breed"),
    rule("r3", "q_which_pet", "equals", "cat", "SHOW", "q_cat_indoor"),
    rule("r4", "q_which_pet", "equals", "fish", "SHOW", "q_tank_size"),
  ],
);

describe("childrenOf — what the editor canvas indents", () => {
  it("maps a parent to every question it reveals", () => {
    const children = childrenOf(PET_FORM);

    expect(children.get("q_has_pet")).toEqual(["q_which_pet"]);

    // ONE parent, THREE children, from THREE separate rules — which is exactly
    // why a single `logicId` field on the question could never have worked.
    expect(children.get("q_which_pet")).toEqual(["q_dog_breed", "q_cat_indoor", "q_tank_size"]);

    // A leaf reveals nothing.
    expect(children.get("q_dog_breed")).toBeUndefined();
  });

  it("maps a child back to the question controlling it", () => {
    expect(parentsOf(PET_FORM).get("q_dog_breed")).toEqual(["q_which_pet"]);
    expect(parentsOf(PET_FORM).get("q_has_pet")).toBeUndefined(); // always on screen
  });
});

describe("depthOf — emergent, not configured", () => {
  it("computes how deep each question sits in the reveal chain", () => {
    const depths = depthOf(PET_FORM);

    expect(depths.get("q_has_pet")).toBe(0); // always visible
    expect(depths.get("q_which_pet")).toBe(1); // revealed by a level-0 question
    expect(depths.get("q_dog_breed")).toBe(2); // revealed by a level-1 question
    expect(depths.get("q_cat_indoor")).toBe(2);
    expect(depths.get("q_tank_size")).toBe(2);
  });

  it("two levels deep is perfectly legal — no error, no warning", () => {
    expect(validate(PET_FORM)).toEqual([]);
  });
});

describe("validate — the surviving constraints", () => {
  it("allows a rating to drive a rule (the most common conditional there is)", () => {
    const f = form(
      [page("p1", 0, [q("rating", "rating", 0, { config: { scale: 5 } }), q("why", "long_text", 1)])],
      [rule("r1", "rating", "less_than", 3, "SHOW", "why")],
    );
    expect(validate(f)).toEqual([]);
  });

  it("rejects branching on the VALUE of a free-text question", () => {
    const f = form(
      [page("p1", 0, [q("name", "short_text", 0), q("followup", "short_text", 1)])],
      [rule("r1", "name", "equals", "Bob", "SHOW", "followup")],
    );

    const d = validate(f).find((x) => x.code === "INVALID_TRIGGER_TYPE");
    expect(d).toBeDefined();
    expect(d!.severity).toBe("error");
  });

  it("still allows 'did they fill it in?' on a free-text question", () => {
    const f = form(
      [page("p1", 0, [q("email", "email", 0), q("followup", "yes_no", 1)])],
      [rule("r1", "email", "is_not_empty", null, "SHOW", "followup")],
    );
    expect(validate(f)).toEqual([]);
  });

  it("allows a reveal to cross a page boundary — the trigger just has to come first", () => {
    // The conference-form pattern: ticket type is asked on page 1, and it decides
    // whether "Company name" appears on page 2. A JUMP cannot express this,
    // because page 2 also holds questions the excluded group DOES answer.
    const f = form(
      [
        page("p1", 0, [q("q_ticket", "radio", 0, { required: true, options: opts("standard", "student") })]),
        page("p2", 1, [q("q_company", "short_text", 0, { required: true })]),
      ],
      [rule("r1", "q_ticket", "equals", "student", "HIDE", "q_company")],
    );

    expect(validate(f)).toEqual([]);
    expect(resolve(f, { q_ticket: "student" }).visibleQuestionIds.has("q_company")).toBe(false);
    expect(resolve(f, { q_ticket: "standard" }).visibleQuestionIds.has("q_company")).toBe(true);
  });

  it("warns when a form gets three conditions deep", () => {
    const f = form(
      [
        page("p1", 0, [
          q("a", "yes_no", 0),
          q("b", "yes_no", 1),
          q("c", "yes_no", 2),
          q("d", "short_text", 3),
        ]),
      ],
      [
        rule("r1", "a", "equals", true, "SHOW", "b"),
        rule("r2", "b", "equals", true, "SHOW", "c"),
        rule("r3", "c", "equals", true, "SHOW", "d"), // d is depth 3
      ],
    );

    const d = validate(f).find((x) => x.code === "DEEP_NESTING");
    expect(d).toBeDefined();
    expect(d!.severity).toBe("warning"); // a nudge, not a block
    expect(d!.questionId).toBe("d");
  });
});
