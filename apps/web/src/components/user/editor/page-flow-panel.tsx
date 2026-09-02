"use client";

import { CornerDownRight, Info, Plus, Route, Trash2 } from "lucide-react";
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
import type { LogicCondition, Question, QuestionType } from "@flowform/database/models";

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

const defaultConditionFor = (t: Question): LogicCondition =>
  t.type === "checkbox" ? "contains" : "equals";

function defaultValueFor(t: Question): unknown {
  if (t.type === "yes_no") return true;
  if (t.type === "rating" || t.type === "number") return 1;
  return t.options?.[0]?.id ?? "";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

/**
 * Page-level branching.
 *
 * SHOW/HIDE reveal or remove a QUESTION on a screen the respondent is already
 * looking at. A JUMP sends them to a different PAGE entirely — it is how you skip
 * a whole branch ("not a customer? skip the six customer pages").
 *
 * Precedence when leaving a page, and this order matters:
 *
 *   1. The FIRST matching JUMP whose trigger question lives on THIS page
 *      (and is itself visible — a hidden question cannot teleport anyone)
 *   2. "After this page, always go to X"  (defaultNext)
 *   3. The next page in document order
 *
 * Rule 2 is what lets branches REJOIN. Without it a branch can diverge but never
 * merge, and a customer finishing the customer pages would fall straight into the
 * prospect pages.
 */
export function PageFlowPanel({ pageId }: { pageId: string }) {
  const content         = useFormEditorStore((s) => s.content);
  const setPageNext     = useFormEditorStore((s) => s.setPageNext);
  const addLogicRule    = useFormEditorStore((s) => s.addLogicRule);
  const updateLogicRule = useFormEditorStore((s) => s.updateLogicRule);
  const deleteLogicRule = useFormEditorStore((s) => s.deleteLogicRule);

  if (!content) return null;

  const pages = [...content.pages].sort((a, b) => a.order - b.order);
  const index = pages.findIndex((p) => p.id === pageId);
  const page = pages[index];
  if (!page) return null;

  const nextInOrder = pages[index + 1];
  const label = (id: string) => `Page ${pages.findIndex((p) => p.id === id) + 1}`;

  // A JUMP fires when you LEAVE the page holding its trigger — so the trigger
  // must be a question ON THIS PAGE.
  const triggers = [...page.questions]
    .filter((q) => TRIGGERABLE_TYPES.has(q.type))
    .sort((a, b) => a.order - b.order);

  const jumps = content.logic.filter(
    (r) => r.action === "JUMP" && page.questions.some((q) => q.id === r.triggerId),
  );

  // Every page except this one, plus the end of the form.
  const destinations = [
    ...pages.filter((p) => p.id !== pageId).map((p) => ({ id: p.id, label: label(p.id) })),
    { id: "END", label: "End of form" },
  ];

  function addJump() {
    const trigger = triggers[0];
    const dest = destinations[0];
    if (!trigger || !dest) return;

    addLogicRule({
      id: crypto.randomUUID(),
      triggerId: trigger.id,
      condition: defaultConditionFor(trigger),
      value: defaultValueFor(trigger),
      action: "JUMP",
      targetId: dest.id,
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Route className="size-4 text-primary" />
        <span className="text-sm font-semibold">Page {index + 1}</span>
      </div>

      {/* ── Default next ──────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <SectionLabel>After this page, go to</SectionLabel>
        <Select
          value={page.defaultNext ?? "__next__"}
          onValueChange={(v) => setPageNext(pageId, v === "__next__" ? null : v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__next__">
              {nextInOrder ? `Next page (${label(nextInOrder.id)})` : "End of form"}
            </SelectItem>
            {destinations.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {page.defaultNext
            ? "Everyone leaving this page lands here — this is how a branch rejoins the rest of the form."
            : "Falls through to the next page in the outline."}
        </p>
      </div>

      <Separator />

      {/* ── Conditional jumps ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CornerDownRight className="size-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-foreground">
            Skip ahead when
          </span>
        </div>

        {triggers.length === 0 ? (
          <div className="flex gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
            <Info className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              To branch away from this page, add a{" "}
              <span className="font-semibold">yes/no, choice, rating or number</span> question{" "}
              <span className="font-semibold">to this page</span>. Its answer is what decides
              where the respondent goes next.
            </p>
          </div>
        ) : (
          <>
            {jumps.map((rule) => {
              const trigger = triggers.find((t) => t.id === rule.triggerId);

              return (
                <div
                  key={rule.id}
                  className="space-y-2 rounded-lg border border-primary/25 bg-primary/[0.04] p-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Select
                        value={rule.triggerId}
                        onValueChange={(triggerId) => {
                          const t = triggers.find((x) => x.id === triggerId);
                          if (!t) return;
                          updateLogicRule(rule.id, {
                            triggerId,
                            condition: defaultConditionFor(t),
                            value: defaultValueFor(t),
                          });
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {triggers.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.label || "Untitled question"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {trigger && (
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={rule.condition}
                            onValueChange={(v) =>
                              updateLogicRule(rule.id, { condition: v as LogicCondition })
                            }
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
                              onValueChange={(v) =>
                                updateLogicRule(rule.id, { value: v === "true" })
                              }
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

                          {(trigger.type === "radio" ||
                            trigger.type === "select" ||
                            trigger.type === "checkbox") && (
                            <Select
                              value={String(rule.value ?? "")}
                              onValueChange={(v) => updateLogicRule(rule.id, { value: v })}
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
                                updateLogicRule(rule.id, {
                                  value: e.target.value === "" ? 0 : Number(e.target.value),
                                })
                              }
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => deleteLogicRule(rule.id)}
                      className="shrink-0 p-1.5 rounded-md text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      aria-label="Delete jump"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <CornerDownRight className="size-3.5 text-muted-foreground shrink-0" />
                    <Select
                      value={rule.targetId}
                      onValueChange={(v) => updateLogicRule(rule.id, { targetId: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {destinations.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}

            <button
              onClick={addJump}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="size-3.5" />
              Add a jump
            </button>

            {jumps.length > 1 && (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Checked top to bottom — the first jump that matches wins.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
