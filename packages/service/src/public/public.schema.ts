import { z } from "zod";
import { FormLayout, ProgressBarStyle, FontSize, LetterSpacing, QuestionType, BorderRadius } from "@flowform/database/constants";

// Track View

export const TrackViewInputSchema = z.object({
  formId: z.string().min(1),
});

export const TrackViewOutputSchema = z.object({
  counted: z.boolean(),
});

// Start Session

export const StartSessionInputSchema = z.object({
  formId: z.string().min(1),
  publishVersion: z.number().int().positive(),
  timezone: z.string().optional(),
});

export const StartSessionOutputSchema = z.object({
  responseId: z.string(),
});

// Submit Response

export const AnswerEntrySchema = z.object({
  questionId: z.string().min(1),
  type: z.enum(QuestionType),
  value: z.union([z.string(), z.number(), z.array(z.string()), z.boolean(), z.null()]),
});

export const SubmitResponseInputSchema = z.object({
  responseId: z.string().uuid(),
  formId: z.string().min(1),
  publishVersion: z.number().int().positive(),
  answers: z.array(AnswerEntrySchema),
  respondentEmail: z.email().nullable().optional(),
  _hp: z.string().optional(),
});

export const SubmitResponseOutputSchema = z.object({
  success: z.boolean(),
  redirectUrl: z.string().nullable(),
});

// Get Public Form

export const GetPublicFormInputSchema = z.object({
  idOrSlug: z.string().min(1),
  accessCode: z.string().optional(),
});

export const PublicFormNavbarSchema = z.discriminatedUnion("showBranding", [
  z.object({ showBranding: z.literal(false) }),
  z.object({ showBranding: z.literal(true), logoUrl: z.url(), brandName: z.string() }),
]);

const radiusEnum = z.enum(BorderRadius);

export const PublicFormProgressBarSchema = z.discriminatedUnion("enabled", [
  z.object({ enabled: z.literal(false) }),
  z.object({ enabled: z.literal(true), style: z.enum(ProgressBarStyle) }),
]);

export const PublicFormSettingsSchema = z.object({
  collectEmail: z.boolean(),
  formLayout: z.enum(FormLayout),
  navbar: PublicFormNavbarSchema,
  progressBar: PublicFormProgressBarSchema,
  defaultLanguage: z.string(),
  removeWatermark: z.boolean(),
  redirectOnComplete: z.object({
    url: z.url(),
    label: z.string(),
  }).nullable().optional(),
});

export const PublicFormThemeSchema = z.object({
  primaryColor: z.string(),
  backgroundColor: z.string(),
  pageBackgroundColor: z.string().optional(),
  accentColor: z.string(),
  labelColor: z.string().optional(),
  placeholderColor: z.string().optional(),
  inputBackgroundColor: z.string().optional(),
  inputBorderColor: z.string().optional(),
  inputTextColor: z.string().optional(),
  choiceColor: z.string().optional(),
  choiceSelectedColor: z.string().optional(),
  starColor: z.string().optional(),
  borderRadius: radiusEnum,
  buttonRadius: radiusEnum.optional(),
  inputRadius: radiusEnum.optional(),
  backgroundImage: z.string().nullable().optional(),
});

export const PublicFormFontSchema = z.object({
  fontFamily: z.string(),
  fontSize: z.enum(FontSize),
  letterSpacing: z.enum(LetterSpacing),
});

export const PublicFormOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  publishVersion: z.number(),
  closed: z.boolean(),
  requiresCode: z.boolean(),
  alreadySubmitted: z.boolean(),
  content: z.unknown().nullable(),
  theme: PublicFormThemeSchema.nullable(),
  font: PublicFormFontSchema.nullable(),
  settings: PublicFormSettingsSchema.nullable(),
});

// Inferred Types

export type TrackViewInput = z.infer<typeof TrackViewInputSchema>;
export type TrackViewOutput = z.infer<typeof TrackViewOutputSchema>;
export type StartSessionInput = z.infer<typeof StartSessionInputSchema>;
export type StartSessionOutput = z.infer<typeof StartSessionOutputSchema>;
export type SubmitResponseInput = z.infer<typeof SubmitResponseInputSchema>;
export type SubmitResponseOutput = z.infer<typeof SubmitResponseOutputSchema>;
export type GetPublicFormInput = z.infer<typeof GetPublicFormInputSchema>;
export type PublicFormOutput = z.infer<typeof PublicFormOutputSchema>;
export type PublicFormSettings = z.infer<typeof PublicFormSettingsSchema>;
export type PublicFormFont = z.infer<typeof PublicFormFontSchema>;
export type AnswerEntry = z.infer<typeof AnswerEntrySchema>;
