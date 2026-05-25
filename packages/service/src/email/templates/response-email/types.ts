import type { AnswerEntry } from "@flowform/database/models";

export type EmailTemplateProps = {
  brandName: string;
  brandColor: string;
  brandLogo?: string | null;
  brandLink?: string | null;
  personalizedMessage: string;
  formTitle: string;
  answers: AnswerEntry[];
  respondentEmail?: string | null;
};
