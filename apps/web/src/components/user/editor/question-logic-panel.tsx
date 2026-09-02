"use client";

import { Eye, EyeOff, GitBranch, Info, Route } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import { cn } from "@/lib/utils";
import type {
  FormContent,
  LogicCondition,
  LogicRule,
  Question,
  QuestionType,
} from "@flowform/database/models";

/**
 * Which questions may drive a rule by their VALUE.
 *
 * The principle: a trigger's answers must be enumerable, so the author picks the
 * value from a dropdown instead of typing a string and hoping it matches. Free
 * text triggers ("show X when the name contains 'foo'") break silently.
 *
 * Mirrors TRIGGERABLE_BY_VALUE in @flowform/form-core's validate().
 */
const TRIGGERABLE_TYPES = new Set<QuestionType>([
  "yes_no",
  "radio",
  "select",
  "checkbox",
  "rating",
  "number",
]);

function operatorsFor(type: QuestionType): { value: LogicCondition; label: string }[] {
  if (type === "checkbox") return [{ value: "contains", label: "includes" }];
  if (type === "rating" || type === "number") {
    return [
      { value: "equals", label: "is" },
      { value: "less_than", label: "is less than" },
      { value: "greater_than", label: "is more than" },
    ];
  }
  return [
    { value: "equals", label: "is" },
    { value: "not_equals", label: "is not" },
  ];
}

function defaultConditionFor(trigger: Question): LogicCondition {
  return trigger.type === "checkbox" ? "contains" : "equals";
}

function defaultValueFor(trigger: Question): unknown {
  if (trigger.type === "yes_no") return true;
  if (trigger.type === "rating" || trigger.type === "number") return 1;
  return trigger.options?.[0]?.id ?? "";
}

/** Every question in reading order, with its page — so we can enforce "trigger before target". */
function questionsInOrder(content: FormContent): { q: Question; pageId: string }[] {
  return [...content.pages]
    .sort((a, b) => a.order - b.order)
    .flatMap((p) =>
      [...p.questions].sort((a, b) => a.order - b.order).map((q) => ({ q, pageId: p.id })),
    );
}

// ─── Shared bits ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

/** A three-position segmented control. States are mutually exclusive by construction. */
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-1 rounded-lg bg-muted p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md py-1.5 text-[11px] font-semibold transition-colors",
            value === o.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A question that may drive a rule, and the page it lives on. */
export type Candidate = { q: Question; pageId: string };

/**
 * The "[question] [is] [value]" row. Shared by visibility and requirement — they
 * are two independent questions about a question, but they ask them the same way.
 *
 * The trigger picker spans PAGES: the only rule is that the trigger comes before
 * the target in document order. Each option is tagged with its page number, so
 * "Page 1 · Which ticket?" is unambiguous when several pages have similar labels.
 */
function ConditionEditor({
  candidates,
  rule,
  pageNumber,
  onPickTrigger,
  onPatch,
}: {
  candidates: Candidate[];
  rule: LogicRule;
  pageNumber: (pageId: string) => number;
  onPickTrigger: (triggerId: string) => void;
  onPatch: (patch: { condition?: LogicCondition; value?: unknown }) => void;
}) {
  const trigger = candidates.find((c) => c.q.id === rule.triggerId)?.q;

  return (
    <div className="space-y-2">
      <Select value={rule.triggerId} onValueChange={onPickTrigger}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Pick a question" />
        </SelectTrigger>
        <SelectContent>
          {candidates.map(({ q, pageId }) => (
            <SelectItem key={q.id} value={q.id}>
              <span className="text-muted-foreground tabular-nums">
                Page {pageNumber(pageId)}
              </span>
              <span className="mx-1.5 text-muted-foreground/50">·</span>
              {q.label || "Untitled question"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {trigger && (
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={rule.condition}
            onValueChange={(v) => onPatch({ condition: v as LogicCondition })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operatorsFor(trigger.type).map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {trigger.type === "yes_no" && (
            <Select
              value={String(rule.value)}
              onValueChange={(v) => onPatch({ value: v === "true" })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          )}

          {(trigger.type === "radio" || trigger.type === "select" || trigger.type === "checkbox") && (
            <Select
              value={String(rule.value ?? "")}
              onValueChange={(v) => onPatch({ value: v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Pick an option" />
              </SelectTrigger>
              <SelectContent>
                {(trigger.options ?? []).map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label || "Untitled option"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(trigger.type === "rating" || trigger.type === "number") && (
            <Input
              type="number"
              className="h-9"
              value={typeof rule.value === "number" ? rule.value : ""}
              onChange={(e) =>
                onPatch({ value: e.target.value === "" ? 0 : Number(e.target.value) })
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
      <Info className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

// ─── REQUIREMENT ──────────────────────────────────────────────────────────────

type RequiredMode = "never" | "always" | "when";

/**
 * Replaces the plain Required switch. ONE control, three positions — because
 * "always required" AND "required when X" is meaningless: isRequired() is
 * `q.required || rule fires`, so `always` short-circuits and the rule could
 * never change the outcome. A radio makes that contradiction unrepresentable.
 *
 *   Never   → required: false, no rule
 *   Always  → required: true,  no rule      ← the right answer for a SHOW-gated
 *                                             question: the walk never demands a
 *                                             hidden question, so "always" really
 *                                             means "whenever it appears"
 *   When…   → required: false + a standalone REQUIRE rule, with its OWN condition
 *
 * "When…" is the case the boolean cannot express:
 *
 *   "Are you a student or a professional?"  [Student] [Professional]
 *   "Years of experience"                   ← EVERYONE sees it…
 *                                             …but only professionals must answer.
 */
export function QuestionRequiredControl({
  pageId,
  question,
}: {
  pageId: string;
  question: Question;
}) {
  const content         = useFormEditorStore((s) => s.content);
  const updateQuestion  = useFormEditorStore((s) => s.updateQuestion);
  const addLogicRule    = useFormEditorStore((s) => s.addLogicRule);
  const updateLogicRule = useFormEditorStore((s) => s.updateLogicRule);
  const deleteLogicRule = useFormEditorStore((s) => s.deleteLogicRule);

  if (!content) return null;

  const requireRule = content.logic.find(
    (r) => r.action === "REQUIRE" && r.targetId === question.id,
  );

  const mode: RequiredMode = question.required ? "always" : requireRule ? "when" : "never";

  // A REQUIRE trigger may live on ANY earlier question — including an earlier
  // PAGE. Requirement is not a same-screen concern: "you said professional on
  // page 1, so the experience field on page 3 is mandatory" is perfectly normal.
  const ordered = questionsInOrder(content);
  const myIndex = ordered.findIndex((x) => x.q.id === question.id);
  const candidates = ordered
    .slice(0, Math.max(0, myIndex))
    .filter((x) => TRIGGERABLE_TYPES.has(x.q.type));

  const pageNumber = (pid: string) =>
    [...content.pages].sort((a, b) => a.order - b.order).findIndex((p) => p.id === pid) + 1;

  function setMode(next: RequiredMode) {
    if (next === "never") {
      updateQuestion(pageId, question.id, { required: false });
      if (requireRule) deleteLogicRule(requireRule.id);
      return;
    }
    if (next === "always") {
      updateQuestion(pageId, question.id, { required: true });
      if (requireRule) deleteLogicRule(requireRule.id); // it could never fire anyway
      return;
    }

    // "when" — the rule decides, so the question itself must be optional.
    const trigger = candidates[0]?.q;
    if (!trigger) return;

    updateQuestion(pageId, question.id, { required: false });
    if (requireRule) return;

    addLogicRule({
      id: crypto.randomUUID(),
      triggerId: trigger.id,
      condition: defaultConditionFor(trigger),
      value: defaultValueFor(trigger),
      action: "REQUIRE",
      targetId: question.id,
    });
  }

  const canBeConditional = candidates.length > 0;

  return (
    <div className="space-y-2">
      <SectionLabel>Required</SectionLabel>

      <Segmented<RequiredMode>
        value={mode}
        onChange={setMode}
        options={[
          { value: "never", label: "Never" },
          { value: "always", label: "Always" },
          ...(canBeConditional ? [{ value: "when" as const, label: "When…" }] : []),
        ]}
      />

      {mode === "when" && requireRule && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.05] p-3">
          <SectionLabel>Required only when</SectionLabel>
          <ConditionEditor
            candidates={candidates}
            rule={requireRule}
            pageNumber={pageNumber}
            onPickTrigger={(triggerId) => {
              const t = candidates.find((c) => c.q.id === triggerId)?.q;
              if (!t) return;
              updateLogicRule(requireRule.id, {
                triggerId,
                condition: defaultConditionFor(t),
                value: defaultValueFor(t),
              });
            }}
            onPatch={(patch) => updateLogicRule(requireRule.id, patch)}
          />
          <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
            Everyone still sees this question — only these respondents have to answer it.
          </p>
        </div>
      )}

      {mode === "always" && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Mandatory whenever this question is on screen. If it is conditionally shown,
          it is only demanded when it appears.
        </p>
      )}
    </div>
  );
}

// ─── VISIBILITY ───────────────────────────────────────────────────────────────

type VisibilityMode = "always" | "show_when" | "hide_when";

/**
 * SHOW and HIDE are NOT opposites — they flip the DEFAULT.
 *
 *   Only show when…   → SHOW. Hidden by default, opt-IN.
 *                       "Ask this only of people who said they have a pet."
 *
 *   Always show except…→ HIDE. Visible by default, opt-OUT.
 *                       "Ask everyone for a company name — except students."
 *                       Doing that with SHOW would need one rule per non-student
 *                       role, and adding a new role later would silently hide the
 *                       question from it. HIDE names the exception instead.
 */
export function QuestionLogicPanel({
  pageId,
  question,
}: {
  pageId: string;
  question: Question;
}) {
  const content         = useFormEditorStore((s) => s.content);
  const addLogicRule    = useFormEditorStore((s) => s.addLogicRule);
  const updateLogicRule = useFormEditorStore((s) => s.updateLogicRule);
  const deleteLogicRule = useFormEditorStore((s) => s.deleteLogicRule);

  if (!content) return null;

  const page = content.pages.find((p) => p.id === pageId);
  if (!page) return null;

  const showRule = content.logic.find((r) => r.action === "SHOW" && r.targetId === question.id);
  const hideRule = content.logic.find((r) => r.action === "HIDE" && r.targetId === question.id);
  const rule = showRule ?? hideRule;

  const mode: VisibilityMode = showRule ? "show_when" : hideRule ? "hide_when" : "always";

  // The ONLY constraint is that the trigger comes BEFORE this question in
  // document order — across pages, not just within one.
  //
  // "Before" is load-bearing: a rule depending on a LATER answer is meaningless,
  // because at the moment we must decide whether to show this question that
  // answer does not exist yet. It is also what lets the engine resolve
  // visibility in a single top-to-bottom pass with no graph algorithms.
  //
  // "Same page" is NOT a constraint, and restricting the picker to one page was
  // a mistake: a conference form that asks "ticket type?" on page 1 and hides
  // "Company name" on page 2 for students is completely ordinary, and a JUMP
  // cannot express it — page 2 also holds questions students DO answer.
  const ordered = questionsInOrder(content);
  const myIndex = ordered.findIndex((x) => x.q.id === question.id);
  const candidates = ordered
    .slice(0, Math.max(0, myIndex))
    .filter((x) => TRIGGERABLE_TYPES.has(x.q.type));

  const pageNumber = (pid: string) =>
    [...content.pages].sort((a, b) => a.order - b.order).findIndex((p) => p.id === pid) + 1;

  function setMode(next: VisibilityMode) {
    if (next === "always") {
      if (rule) deleteLogicRule(rule.id);
      return;
    }

    const action = next === "show_when" ? "SHOW" : "HIDE";

    // Switching between show/hide keeps the condition — the author is flipping
    // the polarity, not starting over.
    if (rule) {
      updateLogicRule(rule.id, { action });
      return;
    }

    const trigger = candidates[0]?.q;
    if (!trigger) return;

    addLogicRule({
      id: crypto.randomUUID(),
      triggerId: trigger.id,
      condition: defaultConditionFor(trigger),
      value: defaultValueFor(trigger),
      action,
      targetId: question.id,
    });
  }

  const header = (
    <div className="flex items-center gap-2">
      <GitBranch className="size-3.5 text-primary" />
      <span className="text-xs font-bold uppercase tracking-widest text-foreground">
        Conditional logic
      </span>
    </div>
  );

  // Jumps are authored on the PAGE, not here — a jump fires when the respondent
  // LEAVES the page holding its trigger, not the moment they answer. But an
  // author looking at this question needs to know that (a) the option exists,
  // and (b) this answer may already be sending people somewhere.
  const jumpFooter = TRIGGERABLE_TYPES.has(question.type) ? (
    <PageJumpHint pageId={pageId} question={question} />
  ) : null;

  if (candidates.length === 0) {
    return (
      <>
        <Separator />
        <div className="space-y-3">
          {header}
          <EmptyHint>
            To make this question conditional, add a{" "}
            <span className="font-semibold">yes/no, choice, rating or number</span> question{" "}
            <span className="font-semibold">anywhere before it</span> — on this page or an
            earlier one. Its answer is what decides whether this one appears.
          </EmptyHint>
          {jumpFooter}
        </div>
      </>
    );
  }

  return (
    <>
      <Separator />
      <div className="space-y-3">
        {header}

        <Segmented<VisibilityMode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "always", label: "Always" },
            { value: "show_when", label: "Show if" },
            { value: "hide_when", label: "Hide if" },
          ]}
        />

        {mode === "always" && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Everyone who reaches this page sees this question.
          </p>
        )}

        {rule && mode !== "always" && (
          <div className="space-y-2 rounded-lg border border-primary/25 bg-primary/[0.04] p-3">
            <div className="flex items-center gap-1.5">
              {mode === "show_when" ? (
                <Eye className="size-3.5 text-primary" />
              ) : (
                <EyeOff className="size-3.5 text-primary" />
              )}
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {mode === "show_when" ? "Only show when" : "Show always, except when"}
              </p>
            </div>

            <ConditionEditor
              candidates={candidates}
              rule={rule}
              pageNumber={pageNumber}
              onPickTrigger={(triggerId) => {
                const t = candidates.find((c) => c.q.id === triggerId)?.q;
                if (!t) return;
                updateLogicRule(rule.id, {
                  triggerId,
                  condition: defaultConditionFor(t),
                  value: defaultValueFor(t),
                });
              }}
              onPatch={(patch) => updateLogicRule(rule.id, patch)}
            />

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {mode === "show_when"
                ? "Hidden by default — including before the question above is answered. Only respondents matching this condition are asked."
                : "Shown by default — including before the question above is answered. Only respondents matching this condition have it removed."}
            </p>

            {/* SHOW and HIDE are not opposites: they flip the DEFAULT, and they
                only differ while the trigger is still blank. On a vertical page
                both questions are on screen at once, so "blank" is the first
                thing a respondent sees — which is where authors get caught. */}
            {mode === "hide_when" && (
              <div className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5">
                <Info className="size-3.5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Building a <span className="font-semibold text-foreground">follow-up</span> that
                  should not exist until someone answers above it? Use{" "}
                  <span className="font-semibold text-foreground">Show if</span> instead — with{" "}
                  <span className="font-semibold text-foreground">Hide if</span> the question is
                  on screen from the start, and only disappears once the condition is met.
                </p>
              </div>
            )}
          </div>
        )}

        {jumpFooter}
      </div>
    </>
  );
}

// ─── Cross-link to page flow ──────────────────────────────────────────────────

/**
 * SHOW/HIDE change what is on THIS screen. A JUMP sends the respondent to a
 * different PAGE — and it fires when they LEAVE the page holding its trigger,
 * not the moment they answer. That is why jumps are authored on the page, where
 * their precedence ("first match wins") is readable top to bottom, rather than
 * scattered across the question panels of a page.
 *
 * But an author standing on this question still needs to know the option exists,
 * and whether THIS answer is already routing people somewhere. So: read-only
 * here, with a link to the place it is edited.
 */
function PageJumpHint({ pageId, question }: { pageId: string; question: Question }) {
  const content    = useFormEditorStore((s) => s.content);
  const selectItem = useFormEditorStore((s) => s.selectItem);

  if (!content) return null;

  const pages = [...content.pages].sort((a, b) => a.order - b.order);
  const pageLabel = (id: string) =>
    id === "END" ? "the end of the form" : `Page ${pages.findIndex((p) => p.id === id) + 1}`;

  const myJumps = content.logic.filter(
    (r) => r.action === "JUMP" && r.triggerId === question.id,
  );

  const open = () => selectItem({ type: "page", pageId });

  if (myJumps.length === 0) {
    return (
      <button
        onClick={open}
        className="flex w-full items-start gap-2 rounded-md border border-dashed border-border p-2.5 text-left transition-colors hover:border-primary/50"
      >
        <Route className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        <span className="text-[11px] leading-relaxed text-muted-foreground">
          Want this answer to <span className="font-semibold text-foreground">skip whole pages</span>{" "}
          instead of hiding one question? Set that up in{" "}
          <span className="font-semibold text-primary">Page flow</span>.
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={open}
      className="flex w-full items-start gap-2 rounded-md border border-primary/25 bg-primary/[0.04] p-2.5 text-left transition-colors hover:border-primary/50"
    >
      <Route className="mt-0.5 size-3.5 shrink-0 text-primary" />
      <span className="text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">This answer also routes the form.</span>{" "}
        {myJumps.map((r, i) => (
          <span key={r.id}>
            {i > 0 && " "}
            Sends people to{" "}
            <span className="font-semibold text-primary">{pageLabel(r.targetId)}</span>.
          </span>
        ))}{" "}
        Edit in <span className="font-semibold text-primary">Page flow</span>.
      </span>
    </button>
  );
}
