import { describe, expect, it } from "vitest";
import { resolve } from "../resolve";
import { form, opts, page, q, rule } from "./fixtures";

/**
 * The pet form, exactly as described:
 *
 *   Do you have a pet?          (yes/no)
 *     └─ Which pet?             (dog / cat / fish)   ← shown when pet = yes
 *          ├─ Which dog breed?                       ← shown when pet type = dog
 *          ├─ Is the cat indoor?                     ← shown when pet type = cat
 *          └─ How big is the tank?                   ← shown when pet type = fish
 *
 * That is TWO levels of nesting. It needs no special support: it is just three
 * questions, each with its own condition, chained.
 */
const PET_FORM = form(
  [
    page("pg_pet", 0, [
      q("q_has_pet", "yes_no", 0, { required: true }),
      q("q_which_pet", "radio", 1, { options: opts("dog", "cat", "fish") }),
      q("q_dog_breed", "short_text", 2),
      q("q_cat_indoor", "yes_no", 3),
      q("q_tank_size", "number", 4),
    ]),
    page("pg_end", 1, [q("q_email", "email", 0)]),
  ],
  [
    // Level 1
    rule("r1", "q_has_pet", "equals", true, "SHOW", "q_which_pet"),
    // Level 2 — triggered by a question that is ITSELF conditional
    rule("r2", "q_which_pet", "equals", "dog", "SHOW", "q_dog_breed"),
    rule("r3", "q_which_pet", "equals", "cat", "SHOW", "q_cat_indoor"),
    rule("r4", "q_which_pet", "equals", "fish", "SHOW", "q_tank_size"),
  ],
);

const seen = (answers: Parameters<typeof resolve>[1]) =>
  [...resolve(PET_FORM, answers).visibleQuestionIds];

describe("two-level chains work with no special support", () => {
  it("no pet → nothing below is asked", () => {
    expect(seen({ q_has_pet: false })).toEqual(["q_has_pet", "q_email"]);
  });

  it("has a pet → the second question appears, but not the third level yet", () => {
    expect(seen({ q_has_pet: true })).toEqual(["q_has_pet", "q_which_pet", "q_email"]);
  });

  it("dog → only the dog question appears", () => {
    expect(seen({ q_has_pet: true, q_which_pet: "dog" })).toEqual([
      "q_has_pet",
      "q_which_pet",
      "q_dog_breed",
      "q_email",
    ]);
  });

  it("cat → only the cat question appears", () => {
    expect(seen({ q_has_pet: true, q_which_pet: "cat" })).toEqual([
      "q_has_pet",
      "q_which_pet",
      "q_cat_indoor",
      "q_email",
    ]);
  });

  it("fish → only the fish question appears", () => {
    expect(seen({ q_has_pet: true, q_which_pet: "fish" })).toEqual([
      "q_has_pet",
      "q_which_pet",
      "q_tank_size",
      "q_email",
    ]);
  });

  it("THE COLLAPSE: changing the top answer wipes out the whole chain below it", () => {
    // The respondent said yes → dog → "Beagle", then went back and said "no pet".
    // Both stale answers are still sitting in the browser's answer map.
    const r = resolve(PET_FORM, {
      q_has_pet: false,
      q_which_pet: "dog", // stale
      q_dog_breed: "Beagle", // stale
    });

    // Level 1 hidden → its answer is empty → level 2 cannot fire. Two levels
    // collapse from one answer change, and no code anywhere handles "nesting".
    expect(r.visibleQuestionIds.has("q_which_pet")).toBe(false);
    expect(r.visibleQuestionIds.has("q_dog_breed")).toBe(false);
    expect(r.effectiveAnswers.q_which_pet).toBeUndefined();
    expect(r.effectiveAnswers.q_dog_breed).toBeUndefined();
  });

  it("switching dog → cat drops the dog answer and reveals the cat one", () => {
    const r = resolve(PET_FORM, {
      q_has_pet: true,
      q_which_pet: "cat",
      q_dog_breed: "Beagle", // stale, from before they switched
    });

    expect(r.visibleQuestionIds.has("q_cat_indoor")).toBe(true);
    expect(r.visibleQuestionIds.has("q_dog_breed")).toBe(false);
    expect(r.effectiveAnswers.q_dog_breed).toBeUndefined(); // will not be submitted
  });
});
