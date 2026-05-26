import { create } from "zustand";
import { produce } from "immer";
import { genPageId, genQuestionId } from "@flowform/utils";
import type {
  FormContent,
  FormPage,
  PageLayout,
  Question,
  QuestionType,
  FormSettings,
  FormTheme,
  StartPage,
  EndPage,
  LogicRule,
} from "@flowform/database/models";
import type { useFormById } from "@/hooks/user/use-form";

export type FormServerData = NonNullable<
  ReturnType<typeof useFormById>["data"]
>;

export type SyncStatus = "idle" | "synced" | "dirty" | "saving" | "error";

// "none"  → no changes since last publish
// "soft"  → label/placeholder/required/descriptions changed — safe to republish
// "hard"  → options/questions/pages added or removed — creates a new version
export type PublishChangeType = "none" | "soft" | "hard";

// Drives the right sidebar panel. null = nothing selected.
export type SelectedItem =
  | { type: "startPage" }
  | { type: "endPage" }
  | { type: "question"; pageId: string; questionId: string }
  | null;

// Re-export DB types so editor components don't need to import from @flowform/database directly
export type { FormContent, FormPage, PageLayout, Question, QuestionType, StartPage, EndPage, LogicRule, FormTheme };

interface FormEditorState {
  form: FormServerData | null;
  content: FormContent | null;
  isInitialized: boolean;
  editVersion: number;

  // Navigation
  activePageId: string | null; // page UUID | "startPage" | "endPage"
  selectedItem: SelectedItem;
  previewMode: "desktop" | "mobile";
  currentPageIndex: number;
  isFirstPage: boolean;
  isLastPage: boolean;

  // Sync & publish state
  syncStatus: SyncStatus;
  publishChangeType: PublishChangeType;

  // UI panels
  designPanelOpen: boolean;
  hoverTheme: FormTheme | null;

  // ─── Actions ──────────────────────────────────────────────────────────────

  initializeEditor: (form: FormServerData, content: FormContent) => void;

  // Navigation / selection
  setActivePage: (pageId: string) => void;
  selectItem: (item: SelectedItem) => void;
  setPreviewMode: (mode: "desktop" | "mobile") => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;

  // Sync lifecycle
  setSyncStatus: (status: SyncStatus) => void;
  syncSuccess: (newEditVersion: number) => void;
  publishSuccess: (newPublishVersion: number) => void;

  // Questions — hard changes
  addQuestion: (pageId: string, type: QuestionType) => void;
  deleteQuestion: (pageId: string, questionId: string) => void;
  reorderQuestions: (pageId: string, fromIndex: number, toIndex: number) => void;

  // Question properties — soft changes
  updateQuestion: (
    pageId: string,
    questionId: string,
    patch: Partial<Omit<Question, "id" | "type">>,
  ) => void;

  // Options — hard changes
  addOption: (pageId: string, questionId: string) => void;
  updateOption: (pageId: string, questionId: string, optionId: string, label: string) => void;
  deleteOption: (pageId: string, questionId: string, optionId: string) => void;
  reorderOptions: (pageId: string, questionId: string, fromIndex: number, toIndex: number) => void;

  // Pages — hard changes
  addPage: () => void;
  deletePage: (pageId: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  updatePageLayout: (pageId: string, layout: PageLayout) => void;
  updatePageCoverImage: (pageId: string, imageUrl: string | null) => void;
  updatePageImagePosition: (pageId: string, position: "left" | "right") => void;

  // Start / end page — soft changes
  updateStartPage: (patch: Partial<StartPage>) => void;
  updateEndPage: (patch: Partial<EndPage>) => void;

  // Logic rules — soft changes
  addLogicRule: (rule: LogicRule) => void;
  updateLogicRule: (ruleId: string, patch: Partial<LogicRule>) => void;
  deleteLogicRule: (ruleId: string) => void;

  // Form metadata — local only, NOT part of content sync
  // Title/description need a dedicated backend endpoint (TODO: not yet built)
  // Settings are persisted via the settings modal using the updateSettings endpoint
  updateTitle: (title: string) => void;
  updateDescription: (description: string | null) => void;
  updateSettings: (settings: Partial<FormSettings>) => void;
  updateSlug: (slug: string | null) => void;

  setDesignPanelOpen: (open: boolean) => void;
  setHoverTheme: (theme: FormTheme | null) => void;
  updateThemeLocally: (theme: FormTheme) => void;

  resetEditor: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function computePageNavState(pages: FormPage[], activePageId: string | null) {
  const idx = pages.findIndex((p) => p.id === activePageId);
  const currentIndex = idx === -1 ? 0 : idx;
  return {
    currentPageIndex: currentIndex,
    isFirstPage: currentIndex === 0,
    isLastPage: currentIndex === pages.length - 1,
  };
}

// hard always wins; soft only upgrades from "none"
function markChange(state: FormEditorState, changeType: "soft" | "hard") {
  state.syncStatus = "dirty";
  if (changeType === "hard") {
    state.publishChangeType = "hard";
  } else if (state.publishChangeType === "none") {
    state.publishChangeType = "soft";
  }
}

function buildDefaultQuestion(type: QuestionType, order: number): Question {
  const base: Question = {
    id: genQuestionId(type),
    order,
    type,
    label: "Untitled question",
    required: false,
  };

  if (type === "select" || type === "radio" || type === "checkbox") {
    return {
      ...base,
      options: [
        { id: crypto.randomUUID(), label: "Option 1", order: 0 },
        { id: crypto.randomUUID(), label: "Option 2", order: 1 },
      ],
    };
  }

  if (type === "rating") {
    return { ...base, config: { scale: 5 } };
  }

  return base;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useFormEditorStore = create<FormEditorState>((set) => ({
  form: null,
  content: null,
  isInitialized: false,
  editVersion: 0,
  activePageId: null,
  selectedItem: null,
  previewMode: "desktop",
  currentPageIndex: 0,
  isFirstPage: true,
  isLastPage: false,
  syncStatus: "idle",
  publishChangeType: "none",
  designPanelOpen: false,
  hoverTheme: null,

  initializeEditor: (form, content) => {
    const firstPageId = content.pages.length > 0 ? content.pages[0]!.id : null;
    set({
      form,
      content,
      isInitialized: true,
      editVersion: form.editVersion,
      syncStatus: "synced",
      publishChangeType: "none",
      activePageId: firstPageId,
      selectedItem: null,
      ...computePageNavState(content.pages, firstPageId),
    });
  },

  resetEditor: () =>
    set({
      form: null,
      content: null,
      isInitialized: false,
      editVersion: 0,
      activePageId: null,
      selectedItem: null,
      currentPageIndex: 0,
      isFirstPage: true,
      isLastPage: false,
      syncStatus: "idle",
      publishChangeType: "none",
      designPanelOpen: false,
      hoverTheme: null,
    }),

  setSyncStatus: (status) => set({ syncStatus: status }),

  syncSuccess: (newEditVersion) =>
    set({ syncStatus: "synced", editVersion: newEditVersion }),

  publishSuccess: (newPublishVersion) =>
    set((state) => ({
      publishChangeType: "none",
      form: state.form
        ? { ...state.form, status: "PUBLISHED", publishVersion: newPublishVersion, hasDraft: false }
        : null,
    })),

  setActivePage: (pageId) =>
    set((state) => ({
      activePageId: pageId,
      selectedItem: null,
      ...computePageNavState(state.content?.pages ?? [], pageId),
    })),

  selectItem: (item) => set({ selectedItem: item }),

  setPreviewMode: (mode) => set({ previewMode: mode }),

  goToNextPage: () =>
    set((state) => {
      const pages = state.content?.pages ?? [];
      const idx = pages.findIndex((p) => p.id === state.activePageId);
      const next = pages[idx + 1];
      if (!next) return {};
      return {
        activePageId: next.id,
        selectedItem: null,
        ...computePageNavState(pages, next.id),
      };
    }),

  goToPreviousPage: () =>
    set((state) => {
      const pages = state.content?.pages ?? [];
      const idx = pages.findIndex((p) => p.id === state.activePageId);
      const prev = pages[idx - 1];
      if (!prev) return {};
      return {
        activePageId: prev.id,
        selectedItem: null,
        ...computePageNavState(pages, prev.id),
      };
    }),

  // ─── Questions ─────────────────────────────────────────────────────────────

  addQuestion: (pageId, type) =>
    set(
      produce((state: FormEditorState) => {
        const page = state.content?.pages.find((p) => p.id === pageId);
        if (!page) return;
        const isConversational = (state.form?.settings as FormSettings | undefined)?.formLayout === "conversational";
        const question = buildDefaultQuestion(type, 0);
        if (isConversational) {
          // Replace existing question instead of adding
          page.questions = [question];
        } else {
          question.order = page.questions.length;
          page.questions.push(question);
        }
        state.selectedItem = { type: "question", pageId, questionId: question.id };
        markChange(state, "hard");
      }),
    ),

  updateQuestion: (pageId, questionId, patch) =>
    set(
      produce((state: FormEditorState) => {
        const page = state.content?.pages.find((p) => p.id === pageId);
        const question = page?.questions.find((q) => q.id === questionId);
        if (!question) return;
        Object.assign(question, patch);
        markChange(state, "soft");
      }),
    ),

  deleteQuestion: (pageId, questionId) =>
    set(
      produce((state: FormEditorState) => {
        const page = state.content?.pages.find((p) => p.id === pageId);
        if (!page) return;
        page.questions = page.questions.filter((q) => q.id !== questionId);
        page.questions.forEach((q, i) => { q.order = i; });
        if (
          state.selectedItem?.type === "question" &&
          state.selectedItem.questionId === questionId
        ) {
          state.selectedItem = null;
        }
        markChange(state, "hard");
      }),
    ),

  reorderQuestions: (pageId, fromIndex, toIndex) =>
    set(
      produce((state: FormEditorState) => {
        const page = state.content?.pages.find((p) => p.id === pageId);
        if (!page) return;
        const [moved] = page.questions.splice(fromIndex, 1);
        page.questions.splice(toIndex, 0, moved!);
        page.questions.forEach((q, i) => { q.order = i; });
        markChange(state, "hard");
      }),
    ),

  // ─── Options ───────────────────────────────────────────────────────────────

  addOption: (pageId, questionId) =>
    set(
      produce((state: FormEditorState) => {
        const page = state.content?.pages.find((p) => p.id === pageId);
        const question = page?.questions.find((q) => q.id === questionId);
        if (!question) return;
        if (!question.options) question.options = [];
        question.options.push({
          id: crypto.randomUUID(),
          label: `Option ${question.options.length + 1}`,
          order: question.options.length,
        });
        markChange(state, "hard");
      }),
    ),

  updateOption: (pageId, questionId, optionId, label) =>
    set(
      produce((state: FormEditorState) => {
        const page = state.content?.pages.find((p) => p.id === pageId);
        const question = page?.questions.find((q) => q.id === questionId);
        const option = question?.options?.find((o) => o.id === optionId);
        if (!option) return;
        option.label = label;
        markChange(state, "hard");
      }),
    ),

  deleteOption: (pageId, questionId, optionId) =>
    set(
      produce((state: FormEditorState) => {
        const page = state.content?.pages.find((p) => p.id === pageId);
        const question = page?.questions.find((q) => q.id === questionId);
        if (!question?.options) return;
        question.options = question.options.filter((o) => o.id !== optionId);
        question.options.forEach((o, i) => { o.order = i; });
        markChange(state, "hard");
      }),
    ),

  reorderOptions: (pageId, questionId, fromIndex, toIndex) =>
    set(
      produce((state: FormEditorState) => {
        const page = state.content?.pages.find((p) => p.id === pageId);
        const question = page?.questions.find((q) => q.id === questionId);
        if (!question?.options) return;
        const [moved] = question.options.splice(fromIndex, 1);
        question.options.splice(toIndex, 0, moved!);
        question.options.forEach((o, i) => { o.order = i; });
        markChange(state, "hard");
      }),
    ),

  // ─── Pages ─────────────────────────────────────────────────────────────────

  addPage: () =>
    set(
      produce((state: FormEditorState) => {
        if (!state.content) return;
        const newPage: FormPage = {
          id: genPageId(),
          order: state.content.pages.length,
          questions: [],
        };
        state.content.pages.push(newPage);
        state.activePageId = newPage.id;
        state.selectedItem = null;
        Object.assign(state, computePageNavState(state.content.pages, newPage.id));
        markChange(state, "hard");
      }),
    ),

  deletePage: (pageId) =>
    set(
      produce((state: FormEditorState) => {
        if (!state.content) return;
        const idx = state.content.pages.findIndex((p) => p.id === pageId);
        if (idx === -1) return;
        state.content.pages.splice(idx, 1);
        state.content.pages.forEach((p, i) => { p.order = i; });
        if (state.activePageId === pageId) {
          const remaining = state.content.pages;
          state.activePageId =
            remaining[Math.max(0, idx - 1)]?.id ?? remaining[0]?.id ?? null;
          state.selectedItem = null;
        }
        Object.assign(state, computePageNavState(state.content.pages, state.activePageId));
        markChange(state, "hard");
      }),
    ),

  reorderPages: (fromIndex, toIndex) =>
    set(
      produce((state: FormEditorState) => {
        if (!state.content) return;
        const [moved] = state.content.pages.splice(fromIndex, 1);
        state.content.pages.splice(toIndex, 0, moved!);
        state.content.pages.forEach((p, i) => { p.order = i; });
        Object.assign(state, computePageNavState(state.content.pages, state.activePageId));
        markChange(state, "hard");
      }),
    ),

  updatePageLayout: (pageId, layout) =>
    set(
      produce((state: FormEditorState) => {
        const page = state.content?.pages.find((p) => p.id === pageId);
        if (!page) return;
        page.layout = layout;
        markChange(state, "soft");
      }),
    ),

  updatePageCoverImage: (pageId, imageUrl) =>
    set(
      produce((state: FormEditorState) => {
        const page = state.content?.pages.find((p) => p.id === pageId);
        if (!page) return;
        page.coverImage = imageUrl;
        markChange(state, "soft");
      }),
    ),

  updatePageImagePosition: (pageId, position) =>
    set(
      produce((state: FormEditorState) => {
        const page = state.content?.pages.find((p) => p.id === pageId);
        if (!page) return;
        page.imagePosition = position;
        markChange(state, "soft");
      }),
    ),

  // ─── Start / End page ──────────────────────────────────────────────────────

  updateStartPage: (patch) =>
    set(
      produce((state: FormEditorState) => {
        if (!state.content) return;
        state.content.startPage = {
          ...(state.content.startPage ?? {}),
          ...patch,
        } as StartPage;
        markChange(state, "soft");
      }),
    ),

  updateEndPage: (patch) =>
    set(
      produce((state: FormEditorState) => {
        if (!state.content) return;
        state.content.endPage = { ...state.content.endPage, ...patch };
        markChange(state, "soft");
      }),
    ),

  // ─── Logic rules ───────────────────────────────────────────────────────────

  addLogicRule: (rule) =>
    set(
      produce((state: FormEditorState) => {
        if (!state.content) return;
        state.content.logic.push(rule);
        markChange(state, "soft");
      }),
    ),

  updateLogicRule: (ruleId, patch) =>
    set(
      produce((state: FormEditorState) => {
        const rule = state.content?.logic.find((r) => r.id === ruleId);
        if (!rule) return;
        Object.assign(rule, patch);
        markChange(state, "soft");
      }),
    ),

  deleteLogicRule: (ruleId) =>
    set(
      produce((state: FormEditorState) => {
        if (!state.content) return;
        state.content.logic = state.content.logic.filter((r) => r.id !== ruleId);
        markChange(state, "soft");
      }),
    ),

  // ─── Form metadata ─────────────────────────────────────────────────────────

  updateTitle: (title) =>
    set(
      produce((state: FormEditorState) => {
        if (state.form) state.form.title = title;
      }),
    ),

  updateDescription: (description) =>
    set(
      produce((state: FormEditorState) => {
        if (state.form) state.form.description = description;
      }),
    ),

  updateSettings: (settings) =>
    set(
      produce((state: FormEditorState) => {
        if (!state.form) return;
        state.form.settings = { ...state.form.settings, ...settings };
      }),
    ),

  updateSlug: (slug) =>
    set(
      produce((state: FormEditorState) => {
        if (state.form) state.form.slug = slug;
      }),
    ),

  setDesignPanelOpen: (open) => set({ designPanelOpen: open }),

  setHoverTheme: (theme) => set({ hoverTheme: theme }),

  updateThemeLocally: (theme) =>
    set(
      produce((state: FormEditorState) => {
        if (state.form) state.form.theme = theme;
      }),
    ),
}));
