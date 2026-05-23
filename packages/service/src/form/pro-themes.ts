import type { FormTheme } from "@flowform/database/models";

export type ThemeTier = "FREE" | "PRO" | "PRO_MAX";

export const PLAN_RANK: Record<ThemeTier, number> = { FREE: 0, PRO: 1, PRO_MAX: 2 };

export type ProThemeTemplate = {
  id: string;
  name: string;
  description: string;
  tier: "PRO";
  theme: FormTheme;
};

const PRO_THEMES: ProThemeTemplate[] = [
  {
    id: "aurora",
    name: "Aurora",
    description: "Deep navy with a glowing purple-teal palette.",
    tier: "PRO",
    theme: {
      primaryColor: "#A78BFA",
      backgroundColor: "#0D1117",
      accentColor: "#34D399",
      labelColor: "#E2E8F0",
      placeholderColor: "#4B5563",
      inputBackgroundColor: "#161B22",
      inputBorderColor: "#30363D",
      inputTextColor: "#E2E8F0",
      choiceColor: "#161B22",
      choiceSelectedColor: "#1F2937",
      starColor: "#A78BFA",
      borderRadius: "rounded",
      buttonRadius: "rounded",
      inputRadius: "rounded",
      backgroundImage: null,
    },
  },
  {
    id: "marble",
    name: "Marble",
    description: "Elegant white with soft grey accents. Luxury feel.",
    tier: "PRO",
    theme: {
      primaryColor: "#1C1C1C",
      backgroundColor: "#FAFAFA",
      accentColor: "#9CA3AF",
      labelColor: "#1C1C1C",
      placeholderColor: "#9CA3AF",
      inputBackgroundColor: "#F5F5F5",
      inputBorderColor: "#E5E7EB",
      inputTextColor: "#1C1C1C",
      choiceColor: "#F5F5F5",
      choiceSelectedColor: "#E5E7EB",
      starColor: "#1C1C1C",
      borderRadius: "sharp",
      buttonRadius: "sharp",
      inputRadius: "sharp",
      backgroundImage: null,
    },
  },
  {
    id: "neon",
    name: "Neon",
    description: "Dark canvas with electric pink and cyan accents.",
    tier: "PRO",
    theme: {
      primaryColor: "#F472B6",
      backgroundColor: "#09090B",
      accentColor: "#22D3EE",
      labelColor: "#F9FAFB",
      placeholderColor: "#374151",
      inputBackgroundColor: "#18181B",
      inputBorderColor: "#27272A",
      inputTextColor: "#F9FAFB",
      choiceColor: "#18181B",
      choiceSelectedColor: "#2D1535",
      starColor: "#F472B6",
      borderRadius: "pill",
      buttonRadius: "pill",
      inputRadius: "pill",
      backgroundImage: null,
    },
  },
];

export function getProThemeById(id: string): ProThemeTemplate | undefined {
  return PRO_THEMES.find((t) => t.id === id);
}

export function getAllProThemeIds(): string[] {
  return PRO_THEMES.map((t) => t.id);
}
