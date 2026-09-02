"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  FileText,
  ChevronDown,
  CheckSquare,
  CircleDot,
  Mail,
  Type,
  AlignLeft,
  Star,
  Hash,
  Calendar,
  List,
  Phone,
  Link2,
  ToggleLeft,
  PlayCircle,
  Flag,
  GripVertical,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import type { QuestionType } from "@/store/use-form-editor-store";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AddContentModal } from "@/components/modals/add-content-modal";
import { DeletePageModal } from "@/components/modals/delete-page-modal";
import { useDeleteCoverImage } from "@/hooks/user/use-form";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FormSettings } from "@flowform/database/models";

const TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  short_text: <Type className="size-3.5" />,
  long_text: <AlignLeft className="size-3.5" />,
  email: <Mail className="size-3.5" />,
  number: <Hash className="size-3.5" />,
  phone: <Phone className="size-3.5" />,
  url: <Link2 className="size-3.5" />,
  select: <List className="size-3.5" />,
  radio: <CircleDot className="size-3.5" />,
  checkbox: <CheckSquare className="size-3.5" />,
  rating: <Star className="size-3.5" />,
  date: <Calendar className="size-3.5" />,
  yes_no: <ToggleLeft className="size-3.5" />,
};

// ─── Sortable question item ─────────────────────────────────────────────────

function SortableQuestion({
  id,
  type,
  label,
  isSelected,
  onSelect,
}: {
  id: string;
  type: QuestionType;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 rounded-md text-xs transition-all group/q overflow-hidden",
        isSelected
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground opacity-0 group-hover/q:opacity-100 transition-opacity shrink-0"
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-3" />
      </button>
      <button
        onClick={onSelect}
        className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden py-1.5 pr-2 text-left"
      >
        <span
          className={cn(
            "shrink-0",
            isSelected ? "text-primary" : "text-muted-foreground",
          )}
        >
          {TYPE_ICONS[type] ?? <FileText className="size-3.5" />}
        </span>
        <span className="flex-1">
          {label.length > 25 ? `${label.slice(0, 25)}…` : label || "Untitled question"}
        </span>
      </button>
    </div>
  );
}

// ─── Sortable page item ─────────────────────────────────────────────────────

function SortablePage({
  page,
  index,
  isActivePage,
  isSelected,
  hasFlow,
  isOpen,
  onToggle,
  onActivate,
  onAddQuestion,
  onDeletePage,
  canDelete,
  isConversational,
  children,
}: {
  page: { id: string };
  index: number;
  isActivePage: boolean;
  /** The page itself is selected — its flow panel is open on the right. */
  isSelected: boolean;
  /** This page branches: it has a jump, or an explicit "always go to X". */
  hasFlow: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onActivate: () => void;
  onAddQuestion: () => void;
  onDeletePage: () => void;
  canDelete: boolean;
  isConversational: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={isOpen} onOpenChange={onToggle} className="w-full">
        <div
          className={cn(
            "flex items-center group rounded-md transition-colors",
            isSelected
              ? "bg-primary/10 text-primary"
              : isActivePage
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50",
          )}
        >
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 ml-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            tabIndex={-1}
            aria-label="Drag to reorder page"
          >
            <GripVertical className="size-3.5" />
          </button>

          <CollapsibleTrigger asChild>
            <button className="p-1.5 hover:text-foreground">
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  !isOpen && "-rotate-90",
                )}
              />
            </button>
          </CollapsibleTrigger>

          <button
            className="flex-1 min-w-0 flex items-center text-sm font-semibold py-2 text-left gap-2"
            onClick={onActivate}
          >
            Page {index + 1}
            {isConversational && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                1Q
              </span>
            )}
            {/* This page sends people somewhere other than straight down the outline. */}
            {hasFlow && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="shrink-0">
                    <Route className="size-3 text-primary" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">This page branches</TooltipContent>
              </Tooltip>
            )}
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onAddQuestion}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-150"
              >
                <Plus className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Add question</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={canDelete ? onDeletePage : undefined}
                disabled={!canDelete}
                className={cn(
                  "p-1.5 mr-1 rounded-md transition-all duration-150",
                  canDelete
                    ? "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    : "text-muted-foreground/30 cursor-not-allowed",
                )}
              >
                <Trash2 className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {canDelete ? "Delete page" : "Can't delete the only page"}
            </TooltipContent>
          </Tooltip>
        </div>

        <CollapsibleContent className="pl-4 pr-2 pt-1 pb-2 space-y-1">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ─── Main sidebar ───────────────────────────────────────────────────────────

export function FormPagesSidebar() {
  const { workspaceId, formId } = useParams<{
    workspaceId: string;
    formId: string;
  }>();

  const content = useFormEditorStore((s) => s.content);
  const activePageId = useFormEditorStore((s) => s.activePageId);
  const selectedItem = useFormEditorStore((s) => s.selectedItem);
  const form = useFormEditorStore((s) => s.form);
  const setActivePage = useFormEditorStore((s) => s.setActivePage);
  const selectItem = useFormEditorStore((s) => s.selectItem);
  const addPage = useFormEditorStore((s) => s.addPage);
  const deletePage = useFormEditorStore((s) => s.deletePage);
  const reorderPages = useFormEditorStore((s) => s.reorderPages);
  const reorderQuestions = useFormEditorStore((s) => s.reorderQuestions);

  const { mutate: deleteCoverImage } = useDeleteCoverImage();

  const pages = content?.pages ?? [];
  const formLayout =
    (form?.settings as FormSettings | undefined)?.formLayout ?? "vertical";
  const isConversational = formLayout === "conversational";

  // Pages that a JUMP can fire from — i.e. pages holding a jump's trigger question.
  const jumpPageIds = new Set(
    (content?.logic ?? [])
      .filter((r) => r.action === "JUMP")
      .map((r) => pages.find((p) => p.questions.some((q) => q.id === r.triggerId))?.id)
      .filter((id): id is string => !!id),
  );

  const [openPages, setOpenPages] = useState<Record<string, boolean>>({});
  const [addContentPageId, setAddContentPageId] = useState<string | null>(null);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);

  const isPageOpen = (pageId: string) => openPages[pageId] ?? true;
  const togglePage = (pageId: string) =>
    setOpenPages((prev) => ({ ...prev, [pageId]: !isPageOpen(pageId) }));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handlePageDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) reorderPages(oldIndex, newIndex);
  }

  function handleQuestionDragEnd(pageId: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const oldIndex = page.questions.findIndex((q) => q.id === active.id);
    const newIndex = page.questions.findIndex((q) => q.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1)
      reorderQuestions(pageId, oldIndex, newIndex);
  }

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="flex flex-col w-[260px] overflow-x-hidden border-r border-border bg-background shrink-0 h-full">
        {/* Header */}
        <div className="h-11 px-4 flex items-center justify-between border-b border-border shrink-0">
          <span className="text-xs font-bold text-foreground uppercase tracking-widest">
            Form Outline
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={addPage}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all p-1 rounded-md active:scale-90"
              >
                <Plus className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Add page</TooltipContent>
          </Tooltip>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="py-3 space-y-1">
            {/* ── Start Page ──────────────────────────────────── */}
            <button
              onClick={() => selectItem({ type: "startPage" })}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                selectedItem?.type === "startPage"
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <PlayCircle className="size-3.5 shrink-0" />
              <span>Start page</span>
            </button>

            {/* ── Pages (sortable) ────────────────────────────── */}
            <div className="space-y-1 pt-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handlePageDragEnd}
              >
                <SortableContext
                  items={pages.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {pages.map((page, index) => (
                    <SortablePage
                      key={page.id}
                      page={{ id: page.id }}
                      index={index}
                      isActivePage={activePageId === page.id}
                      isSelected={
                        selectedItem?.type === "page" && selectedItem.pageId === page.id
                      }
                      hasFlow={
                        !!page.defaultNext ||
                        jumpPageIds.has(page.id)
                      }
                      isOpen={isPageOpen(page.id)}
                      onToggle={() => togglePage(page.id)}
                      onActivate={() => {
                        setActivePage(page.id);
                        // Selecting the page opens its flow panel on the right —
                        // that is where JUMPs and "always go to X" are authored.
                        selectItem({ type: "page", pageId: page.id });
                      }}
                      onAddQuestion={() => {
                        setActivePage(page.id);
                        setAddContentPageId(page.id);
                      }}
                      onDeletePage={() => setDeletePageId(page.id)}
                      canDelete={pages.length > 1}
                      isConversational={isConversational}
                    >
                      {/* Questions inside page (sortable) */}
                      {page.questions.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-1 px-2">
                          {isConversational
                            ? "No question yet"
                            : "No questions yet"}
                        </p>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) => handleQuestionDragEnd(page.id, e)}
                        >
                          <SortableContext
                            items={page.questions.map((q) => q.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-0.5">
                              {page.questions.map((q) => (
                                <SortableQuestion
                                  key={q.id}
                                  id={q.id}
                                  type={q.type}
                                  label={q.label}
                                  isSelected={
                                    selectedItem?.type === "question" &&
                                    selectedItem.questionId === q.id
                                  }
                                  onSelect={() => {
                                    setActivePage(page.id);
                                    selectItem({
                                      type: "question",
                                      pageId: page.id,
                                      questionId: q.id,
                                    });
                                  }}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </SortablePage>
                  ))}
                </SortableContext>
              </DndContext>
            </div>

            {/* ── End Page ────────────────────────────────────── */}
            <button
              onClick={() => selectItem({ type: "endPage" })}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                selectedItem?.type === "endPage"
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Flag className="size-3.5 shrink-0" />
              <span>End page</span>
            </button>
          </div>
        </ScrollArea>

        <AddContentModal
          pageId={addContentPageId}
          open={addContentPageId !== null}
          onOpenChange={(open) => {
            if (!open) setAddContentPageId(null);
          }}
        />

        <DeletePageModal
          open={deletePageId !== null}
          onOpenChange={(open) => {
            if (!open) setDeletePageId(null);
          }}
          onConfirm={() => {
            if (deletePageId) {
              const page = pages.find((p) => p.id === deletePageId);
              if (page?.coverImage) {
                deleteCoverImage({ formId, pageId: deletePageId, workspaceId });
              }
              deletePage(deletePageId);
              setDeletePageId(null);
            }
          }}
        />
      </aside>
    </TooltipProvider>
  );
}
