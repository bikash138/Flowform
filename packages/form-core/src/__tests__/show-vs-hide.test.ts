import { describe, expect, it } from "vitest";
import { resolve } from "../resolve";
import { form, page, q, rule } from "./fixtures";

/**
 * Reproducing the reported case exactly:
 *
 *   Q1: "Do you have a pet?"   (yes_no)
 *   Q2: "What's its name?"     — "HIDE if Q1 is No"
 *
 * The claim: this should behave identically to "SHOW if Q1 is Yes", but the
 * question appears to be always visible.
 */
const HIDE_FORM = form(
  [page("p1", 0, [q("q_has_pet", "yes_no", 0, { required: true }), q("q_name", "short_text", 1)])],
  [rule("h1", "q_has_pet", "equals", false, "HIDE", "q_name")],
);

const SHOW_FORM = form(
  [page("p1", 0, [q("q_has_pet", "yes_no", 0, { required: true }), q("q_name", "short_text", 1)])],
  [rule("s1", "q_has_pet", "equals", true, "SHOW", "q_name")],
);

const vis = (f: typeof HIDE_FORM, a: Record<string, unknown>) =>
  resolve(f, a as never).visibleQuestionIds.has("q_name");

describe("HIDE — is it firing at all?", () => {
  it("HIDE fires when the trigger matches (answer = No → hidden)", () => {
    expect(vis(HIDE_FORM, { q_has_pet: false })).toBe(false);
  });

  it("HIDE does not fire when the trigger does not match (answer = Yes → visible)", () => {
    expect(vis(HIDE_FORM, { q_has_pet: true })).toBe(true);
  });
});

describe("HIDE-if-No vs SHOW-if-Yes — where they actually differ", () => {
  it("they agree once the trigger IS answered", () => {
    expect(vis(HIDE_FORM, { q_has_pet: true })).toBe(vis(SHOW_FORM, { q_has_pet: true }));   // both true
    expect(vis(HIDE_FORM, { q_has_pet: false })).toBe(vis(SHOW_FORM, { q_has_pet: false })); // both false
  });

  it("THEY DISAGREE WHILE THE TRIGGER IS UNANSWERED — this is the whole difference", () => {
    // SHOW is opt-IN:  hidden until something reveals it.
    expect(vis(SHOW_FORM, {})).toBe(false);

    // HIDE is opt-OUT: visible until something suppresses it. An unanswered
    // trigger cannot match, so the HIDE cannot fire, so the question is shown.
    expect(vis(HIDE_FORM, {})).toBe(true);
  });
});
