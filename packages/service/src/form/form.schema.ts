import { z } from "zod";
import {
  FormStatus,
  FormAccessType,
  ProgressBarStyle,
  FormLayout,
  FontSize,
  LetterSpacing,
  BorderRadius,
} from "@flowform/database/constants";

//Input Schemas

export const CreateFormInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(50),
  description: z.string().max(200).nullable().optional(),
  formLayout: z.enum(FormLayout),
});

export const GetFormByIdInputSchema = z.object({
  formId: z.string().min(1),
});

export const ListFormsInputSchema = z.object({
  status: z.enum(FormStatus).optional(),
});

export const PublishFormInputSchema = z.object({
  formId: z.string().min(1),
});

export const ArchiveFormInputSchema = z.object({
  formId: z.string().min(1),
});

export const DeleteFormInputSchema = z.object({
  formId: z.string().min(1),
});

export const DuplicateFormInputSchema = z.object({
  formId: z.string().min(1),
});

export const SyncFormInputSchema = z.object({
  formId: z.string().min(1),
  draftContent: z.unknown(),
  editVersion: z.number().int().positive(),
});

export const PatchPublishInputSchema = z.object({
  formId: z.string().min(1),
  draftContent: z.unknown(),
  editVersion: z.number().int().positive(),
});

export const SetAccessCodeInputSchema = z.object({
  formId: z.string().min(1),
  accessCode: z
    .string()
    .min(1)
    .max(15)
    .regex(/^[A-Z0-9]+$/, "Access code can only contain uppercase letters and numbers")
    .nullable(),
});

export const CheckSlugInputSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  excludeFormId: z.string().min(1).optional(),
});

//Output Schemas

const radiusEnum = z.enum(BorderRadius);

export const FormFontSchema = z.object({
  fontFamily: z.string().min(1).max(100),
  fontSize: z.enum(FontSize),
  letterSpacing: z.enum(LetterSpacing),
});

export const FormThemeSchema = z.object({
  primaryColor: z.string(),
  backgroundColor: z.string(),
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
  pageBackgroundColor: z.string().optional(),
});

export const NavbarSchema = z.discriminatedUnion("showBranding", [
  z.object({ showBranding: z.literal(false) }),
  z.object({
    showBranding: z.literal(true),
    logoUrl: z.url(),
    brandName: z.string().min(1).max(50),
  }),
]);

export const ConfirmationEmailSchema = z.object({
  templateId: z.union([
    z.literal(1), z.literal(2), z.literal(3),
    z.literal(4), z.literal(5), z.literal(6),
  ]),
  subject: z.string().min(1).max(100),
  brandName: z.string().min(1).max(100),
  brandColor: z.string(),
  brandLogo: z.url().nullable().optional(),
  brandLink: z.url().nullable().optional(),
  personalizedMessage: z.string().min(1).max(500),
});

export const FormSettingsSchema = z.object({
  // FREE
  accessType: z.enum(FormAccessType),
  collectEmail: z.boolean(),
  progressBar: z.discriminatedUnion("enabled", [
    z.object({ enabled: z.literal(false) }),
    z.object({ enabled: z.literal(true), style: z.enum(ProgressBarStyle) }),
  ]),
  formLayout: z.enum(FormLayout),
  // PRO
  closeAtDays: z.number().int().min(1).max(365),
  responseLimit: z.number().int().positive(),
  languages: z.array(z.string().min(2).max(10)),
  defaultLanguage: z.string().min(2).max(10),
  navbar: NavbarSchema,
  redirectOnComplete: z.object({
    url: z.url(),
    label: z.string().min(1).max(50),
  }).nullable().optional(),
  // PRO_MAX
  removeWatermark: z.boolean(),
  confirmationEmail: ConfirmationEmailSchema.optional(),
});

export const FormSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(FormStatus),
  hasDraft: z.boolean(),
  publishVersion: z.number(),
  closeAt: z.iso.datetime().nullable(),
  settings: FormSettingsSchema.pick({ accessType: true }),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const FormDetailSchema = FormSummarySchema.extend({
  draftContent: z.unknown().nullable(),
  editVersion: z.number(),
  theme: FormThemeSchema,
  font: FormFontSchema,
  settings: FormSettingsSchema,
});

export const UpdateSettingsInputSchema = z.object({
  formId: z.string().min(1),
  settings: FormSettingsSchema.partial(),
});

export const UpdateSettingsOutputSchema = z.object({ settings: FormSettingsSchema });

export const UpdateSlugInputSchema = z.object({
  formId: z.string().min(1),
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .nullable(),
});

export const UpdateSlugOutputSchema = z.object({ slug: z.string().nullable() });

export const UpdateThemeInputSchema = z.object({
  formId: z.string().min(1),
  themeId: z.string().min(1),
});

export const UpdateThemeOutputSchema = z.object({ theme: FormThemeSchema });
export const UpdateFontOutputSchema = z.object({ font: FormFontSchema });

export const GetFormResponseCountInputSchema = z.object({
  formId: z.string().min(1),
});

export const GetFormResponseCountOutputSchema = z.object({
  total: z.number().int().min(0),
});

export const UpdateFontInputSchema = z.object({
  formId: z.string().min(1),
  font: FormFontSchema,
});

export const ThemeRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tier: z.enum(["FREE", "PRO", "PRO_MAX"]),
  theme: z.object({
    primaryColor: z.string(),
    backgroundColor: z.string(),
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
  }),
});

export const ListThemesOutputSchema = z.array(ThemeRecordSchema);

export type ThemeRecord = z.infer<typeof ThemeRecordSchema>;

export type CreateFormInput = z.infer<typeof CreateFormInputSchema>;
export type GetFormByIdInput = z.infer<typeof GetFormByIdInputSchema>;
export type ListFormsInput = z.infer<typeof ListFormsInputSchema>;
export type PublishFormInput = z.infer<typeof PublishFormInputSchema>;
export type ArchiveFormInput = z.infer<typeof ArchiveFormInputSchema>;
export type DeleteFormInput = z.infer<typeof DeleteFormInputSchema>;
export type DuplicateFormInput = z.infer<typeof DuplicateFormInputSchema>;
export type SyncFormInput = z.infer<typeof SyncFormInputSchema>;
export type PatchPublishInput = z.infer<typeof PatchPublishInputSchema>;
export type SetAccessCodeInput = z.infer<typeof SetAccessCodeInputSchema>;
export type CheckSlugInput = z.infer<typeof CheckSlugInputSchema>;
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsInputSchema>;
export type UpdateSettingsOutput = z.infer<typeof UpdateSettingsOutputSchema>;
export type UpdateSlugInput = z.infer<typeof UpdateSlugInputSchema>;
export type UpdateSlugOutput = z.infer<typeof UpdateSlugOutputSchema>;
export type UpdateThemeInput = z.infer<typeof UpdateThemeInputSchema>;
export type UpdateThemeOutput = z.infer<typeof UpdateThemeOutputSchema>;
export type UpdateFontInput = z.infer<typeof UpdateFontInputSchema>;
export type UpdateFontOutput = z.infer<typeof UpdateFontOutputSchema>;
export type FormFont = z.infer<typeof FormFontSchema>;
export type GetFormResponseCountInput = z.infer<typeof GetFormResponseCountInputSchema>;
export type FormSummary = z.infer<typeof FormSummarySchema>;
export type FormDetail = z.infer<typeof FormDetailSchema>;
