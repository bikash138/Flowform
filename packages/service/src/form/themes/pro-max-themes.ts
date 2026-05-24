import type { FormTheme } from "@flowform/database/models";

export type ProMaxThemeTemplate = {
  id: string;
  name: string;
  description: string;
  tier: "PRO_MAX";
  theme: FormTheme;
};

const PRO_MAX_THEMES: ProMaxThemeTemplate[] = [
  {
    id: "obsidian",
    name: "Obsidian",
    description: "Pure black with burnished gold. The most premium feel.",
    tier: "PRO_MAX",
    theme: {
      primaryColor: "#D4AF37",
      backgroundColor: "#0A0A0A",
      accentColor: "#B8962E",
      labelColor: "#F5F5F5",
      placeholderColor: "#3D3D3D",
      inputBackgroundColor: "#111111",
      inputBorderColor: "#2A2A2A",
      inputTextColor: "#F5F5F5",
      choiceColor: "#111111",
      choiceSelectedColor: "#1F1A08",
      starColor: "#D4AF37",
      borderRadius: "sharp",
      buttonRadius: "sharp",
      inputRadius: "sharp",
      backgroundImage: null,
    },
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    description: "Warm blush tones with metallic rose gold accents.",
    tier: "PRO_MAX",
    theme: {
      primaryColor: "#C9726B",
      backgroundColor: "#FDF6F0",
      accentColor: "#B5524B",
      labelColor: "#4A1C1A",
      placeholderColor: "#E8B4B1",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#F3C5C2",
      inputTextColor: "#4A1C1A",
      choiceColor: "#FFFFFF",
      choiceSelectedColor: "#FBE8E7",
      starColor: "#C9726B",
      borderRadius: "pill",
      buttonRadius: "pill",
      inputRadius: "pill",
      backgroundImage: null,
    },
  },
  {
    id: "deep-forest",
    name: "Deep Forest",
    description: "Rich dark green with earthy amber. Grounded and bold.",
    tier: "PRO_MAX",
    theme: {
      primaryColor: "#D97706",
      backgroundColor: "#0D1F0F",
      accentColor: "#92400E",
      labelColor: "#ECFDF5",
      placeholderColor: "#2D4A30",
      inputBackgroundColor: "#0F2211",
      inputBorderColor: "#1F3D22",
      inputTextColor: "#ECFDF5",
      choiceColor: "#0F2211",
      choiceSelectedColor: "#1A3020",
      starColor: "#D97706",
      borderRadius: "rounded",
      buttonRadius: "rounded",
      inputRadius: "rounded",
      backgroundImage: null,
    },
  },
];

export function getProMaxThemeById(id: string): ProMaxThemeTemplate | undefined {
  return PRO_MAX_THEMES.find((t) => t.id === id);
}

export function getAllProMaxThemeIds(): string[] {
  return PRO_MAX_THEMES.map((t) => t.id);
}
