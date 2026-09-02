# @flowform/form-core

The form kernel. Pure functions, no React, no database, no network.

One implementation of *"how a form behaves"*, imported by everyone who needs to
know: the editor, the public renderer, the server — and later, the AI agent.

Nothing in this package is wired up yet. It is additive and side-effect free.

```bash
pnpm --filter @flowform/form-core test
```

## The four functions

### `resolve(content, answers)` — the one that matters

> *"Given what this person answered — which questions did they actually get asked?"*

Conditional logic is **not a filter, it is a graph walk.** A `JUMP` on page 2
can mean pages 3–6 never happened to you, no matter what their own rules say.
So you cannot ask "is Q7 visible?" in isolation — you have to replay the
journey from page one, following jumps, and see where the person landed.

`resolve` does that walk and returns the path taken, the questions that were
visible, and which of those were required.

**Both sides must call this.** The renderer calls it to decide what to paint;
the server calls it to decide what to accept. It is a pure function of
`(content, answers)`, which is why the two always agree. If a second
implementation of this ever appears, they will drift, and the day they drift is
the day a real form becomes impossible to submit.

### `validateAnswers(content, entries)` — the server-side check

Resolves first, then validates **only the questions the respondent was actually
asked**. Rejects answers to questions that were never reachable (bots stuffing
hidden branches). Returns errors keyed by `questionId`, so the UI can highlight
the offending field instead of showing an opaque toast.

### `validate(content)` — the publish gate

Structural problems, caught in the editor rather than by a respondent at 11pm:
dangling rules, a trigger that comes after its target, a rule checking for a
deleted option, jump loops, unreachable pages, required questions nobody can
ever reach.

Every diagnostic carries a `suggestion`. That is what turns this from
"invalid form" into a fixable instruction — for a human, and later for an agent.

### `simulate(content, answers)` — the test harness

*"Pretend someone answered like this. Where do they end up?"* How an author (or
an agent) tests a branch without filling the form in.

## Two load-bearing rules

**1. Hidden ⇒ empty.** A hidden question's answer never drives a rule. This is
enforced in one place — `resolve` only ever passes *visible* answers to
`matches()` — and it is what makes cascades collapse automatically. Q1 hides Q2,
Q2 was revealing Q3, so Q3 disappears too. No special-case code.

An empty trigger therefore never matches *any* operator, including
`not_equals`. (`is_empty` / `is_not_empty` are the deliberate exceptions.)

**2. A trigger must come before its target.** Enforced by `validate()`
(`TRIGGER_AFTER_TARGET`). A rule that depends on a later answer is meaningless:
at the moment you must decide whether to show the target, no answer exists yet.

That single invariant is what lets `resolve()` work as **one ordered pass** — no
topological sort, no cycle detection, no fixed-point iteration. Give it up and
you are in real graph-algorithm territory for no benefit.

## What is deliberately not here yet

- **`commands()`** — the mutation verb set (`addQuestion`, `moveQuestion`, …)
  that the Zustand store and the agent will both call. Next step.
- **`defaultNext` on `FormPage`** — supported by this package but not yet a
  field in `@flowform/database`. Until it is added, branches can diverge but
  cannot rejoin a shared tail.
- **`not_contains` / `is_empty` / `is_not_empty` / `is_one_of`** — implemented
  here, but not yet in the `LogicCondition` union in `@flowform/database`. The
  types are widened locally so this package compiles without touching the
  database package.
