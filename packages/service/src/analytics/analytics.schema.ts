import { z } from "zod";
import type { QuestionType } from "@flowform/database/models";

// ─── Input Schemas ────────────────────────────────────────────────────────────

export const GetFormSummaryInputSchema = z.object({
  formId: z.string().min(1),
});

export const GetQuestionStatsInputSchema = z.object({
  formId: z.string().min(1),
  publishVersion: z.number().int().positive(),
});

export const ListResponsesInputSchema = z.object({
  formId: z.string().min(1),
  publishVersion: z.number().int().positive(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const ExportResponsesInputSchema = z.object({
  formId: z.string().min(1),
  publishVersion: z.number().int().positive(),
});

// ─── Output Schemas ───────────────────────────────────────────────────────────

export const GetFormSummaryOutputSchema = z.object({
  views: z.number(),
  starts: z.number(),
  submissions: z.number(),
  completionRate: z.number(),
  avgTimeMs: z.number().nullable(),
});

export const OptionStatSchema = z.object({
  label: z.string(),
  count: z.number(),
  percentage: z.number(),
});

export const RatingDistributionSchema = z.object({
  value: z.number(),
  count: z.number(),
});

export const QuestionStatSchema = z.discriminatedUnion("type", [
  z.object({
    questionId: z.string(),
    label: z.string(),
    type: z.enum(["radio", "checkbox", "select"]),
    stats: z.object({
      options: z.array(OptionStatSchema),
    }),
  }),
  z.object({
    questionId: z.string(),
    label: z.string(),
    type: z.literal("rating"),
    stats: z.object({
      distribution: z.array(RatingDistributionSchema),
      avgScore: z.number(),
    }),
  }),
]);

export const GetQuestionStatsOutputSchema = z.object({
  publishVersion: z.number(),
  totalResponses: z.number(),
  questions: z.array(QuestionStatSchema),
});

export const ResponseColumnSchema = z.object({
  questionId: z.string(),
  label: z.string(),
  type: z.string() as z.ZodType<QuestionType>,
});

export const ResponseRowSchema = z.object({
  id: z.string(),
  submittedAt: z.coerce.date(),
  respondentEmail: z.string().nullable(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      type: z.string(),
      value: z.union([z.string(), z.number(), z.array(z.string()), z.boolean(), z.null()]),
    }),
  ),
});

export const ListResponsesOutputSchema = z.object({
  publishVersion: z.number(),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  columns: z.array(ResponseColumnSchema),
  rows: z.array(ResponseRowSchema),
});

export const ExportResponsesOutputSchema = z.object({
  publishVersion: z.number(),
  columns: z.array(ResponseColumnSchema),
  rows: z.array(ResponseRowSchema),
});

// ─── Geo Analytics ────────────────────────────────────────────────────────────

export const GetGeoStatsInputSchema = z.object({
  formId: z.string().min(1),
});

export const GetGeoStatsOutputSchema = z.object({
  continents: z.record(z.string(), z.number()),
  countries: z.record(z.string(), z.number()),
});

export const GetTopCitiesInputSchema = z.object({
  formId: z.string().min(1),
  continent: z.string().min(1),
  limit: z.number().int().min(1).max(20).default(10),
});

export const GetTopCitiesOutputSchema = z.object({
  continent: z.string(),
  cities: z.array(
    z.object({
      city: z.string(),
      count: z.number(),
    }),
  ),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type GetGeoStatsInput = z.infer<typeof GetGeoStatsInputSchema>;
export type GetGeoStatsOutput = z.infer<typeof GetGeoStatsOutputSchema>;
export type GetTopCitiesInput = z.infer<typeof GetTopCitiesInputSchema>;
export type GetTopCitiesOutput = z.infer<typeof GetTopCitiesOutputSchema>;

export type GetFormSummaryInput = z.infer<typeof GetFormSummaryInputSchema>;
export type GetFormSummaryOutput = z.infer<typeof GetFormSummaryOutputSchema>;
export type GetQuestionStatsInput = z.infer<typeof GetQuestionStatsInputSchema>;
export type ListResponsesInput = z.infer<typeof ListResponsesInputSchema>;
export type ExportResponsesInput = z.infer<typeof ExportResponsesInputSchema>;
export type GetQuestionStatsOutput = z.infer<typeof GetQuestionStatsOutputSchema>;
export type ListResponsesOutput = z.infer<typeof ListResponsesOutputSchema>;
export type ExportResponsesOutput = z.infer<typeof ExportResponsesOutputSchema>;
export type QuestionStat = z.infer<typeof QuestionStatSchema>;
export type ResponseColumn = z.infer<typeof ResponseColumnSchema>;
export type ResponseRow = z.infer<typeof ResponseRowSchema>;