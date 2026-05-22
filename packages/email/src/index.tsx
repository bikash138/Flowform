import { render } from "@react-email/components";
import type { EmailTemplateProps } from "./types";
import { MinimalTemplate } from "./templates/template-1";
import { BoldTemplate } from "./templates/template-2";
import { CardTemplate } from "./templates/template-3";
import { DarkTemplate } from "./templates/template-4";
import { SplitTemplate } from "./templates/template-5";
import { WarmTemplate } from "./templates/template-6";

export type { EmailTemplateProps } from "./types";

const TEMPLATES = {
  1: MinimalTemplate,
  2: BoldTemplate,
  3: CardTemplate,
  4: DarkTemplate,
  5: SplitTemplate,
  6: WarmTemplate,
} as const;

export type TemplateId = keyof typeof TEMPLATES;

export async function renderEmailTemplate(
  templateId: TemplateId,
  props: EmailTemplateProps,
): Promise<string> {
  const Template = TEMPLATES[templateId];
  return render(<Template {...props} />);
}
