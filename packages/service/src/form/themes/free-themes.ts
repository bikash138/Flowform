import type { FormTheme, FormFont } from "@flowform/database/models";
import type { ThemeTier } from "./pro-themes";

export const DEFAULT_THEME: FormTheme = {
  primaryColor: "#D9B38C",
  backgroundColor: "#FFFFFF",
  accentColor: "#A68A6D",
  labelColor: "#3D2B1A",
  placeholderColor: "#B8A898",
  inputBackgroundColor: "#FDF8F3",
  inputBorderColor: "#E8D5C4",
  inputTextColor: "#3D2B1A",
  choiceColor: "#FDF8F3",
  choiceSelectedColor: "#F5E8D5",
  starColor: "#D9B38C",
  borderRadius: "rounded",
  buttonRadius: "rounded",
  inputRadius: "rounded",
  backgroundImage: null,
};

export const DEFAULT_FONT: FormFont = {
  fontFamily: "Open Sans",
  fontSize: "md",
  letterSpacing: "normal",
};

export type ThemeTemplate = {
  id: string;
  name: string;
  description: string;
  tier: ThemeTier;
  theme: FormTheme;
};

export const FREE_THEMES: ThemeTemplate[] = [
  {
    id: "flowform",
    name: "Flowform",
    description: "Warm and welcoming — the Flowform default.",
    tier: "FREE",
    theme: {
      primaryColor: "#D9B38C",
      backgroundColor: "#FFFFFF",
      accentColor: "#A68A6D",
      labelColor: "#3D2B1A",
      placeholderColor: "#B8A898",
      inputBackgroundColor: "#FDF8F3",
      inputBorderColor: "#E8D5C4",
      inputTextColor: "#3D2B1A",
      choiceColor: "#FDF8F3",
      choiceSelectedColor: "#F5E8D5",
      starColor: "#D9B38C",
      borderRadius: "rounded",
      buttonRadius: "rounded",
      inputRadius: "rounded",
      backgroundImage: null,
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean and sharp. No distractions.",
    tier: "FREE",
    theme: {
      primaryColor: "#2B2B2B",
      backgroundColor: "#FFFFFF",
      accentColor: "#666666",
      labelColor: "#2B2B2B",
      placeholderColor: "#9CA3AF",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#D1D5DB",
      inputTextColor: "#2B2B2B",
      choiceColor: "#FFFFFF",
      choiceSelectedColor: "#F3F4F6",
      starColor: "#2B2B2B",
      borderRadius: "sharp",
      buttonRadius: "sharp",
      inputRadius: "sharp",
      backgroundImage: null,
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark background with a bold indigo accent.",
    tier: "FREE",
    theme: {
      primaryColor: "#6366F1",
      backgroundColor: "#0F0F0F",
      accentColor: "#818CF8",
      labelColor: "#E2E8F0",
      placeholderColor: "#4B556380",
      inputBackgroundColor: "#1A1A2E",
      inputBorderColor: "#3B3B5C",
      inputTextColor: "#E2E8F0",
      choiceColor: "#1A1A2E",
      choiceSelectedColor: "#2D2D5E",
      starColor: "#6366F1",
      borderRadius: "rounded",
      buttonRadius: "rounded",
      inputRadius: "rounded",
      backgroundImage: null,
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool blue tones with a soft, airy feel.",
    tier: "FREE",
    theme: {
      primaryColor: "#0EA5E9",
      backgroundColor: "#F0F9FF",
      accentColor: "#0284C7",
      labelColor: "#0C4A6E",
      placeholderColor: "#7DD3FC",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#BAE6FD",
      inputTextColor: "#0C4A6E",
      choiceColor: "#FFFFFF",
      choiceSelectedColor: "#E0F2FE",
      starColor: "#0EA5E9",
      borderRadius: "pill",
      buttonRadius: "pill",
      inputRadius: "pill",
      backgroundImage: null,
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Earthy greens. Calm and focused.",
    tier: "FREE",
    theme: {
      primaryColor: "#16A34A",
      backgroundColor: "#F0FDF4",
      accentColor: "#15803D",
      labelColor: "#14532D",
      placeholderColor: "#86EFAC",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#BBF7D0",
      inputTextColor: "#14532D",
      choiceColor: "#FFFFFF",
      choiceSelectedColor: "#DCFCE7",
      starColor: "#16A34A",
      borderRadius: "rounded",
      buttonRadius: "rounded",
      inputRadius: "rounded",
      backgroundImage: null,
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange energy. Bold and inviting.",
    tier: "FREE",
    theme: {
      primaryColor: "#F97316",
      backgroundColor: "#FFF7ED",
      accentColor: "#EA580C",
      labelColor: "#7C2D12",
      placeholderColor: "#FDBA74",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#FED7AA",
      inputTextColor: "#7C2D12",
      choiceColor: "#FFFFFF",
      choiceSelectedColor: "#FEF3C7",
      starColor: "#F97316",
      borderRadius: "rounded",
      buttonRadius: "rounded",
      inputRadius: "rounded",
      backgroundImage: null,
    },
  },
];

export function getFreeThemeById(id: string): ThemeTemplate | undefined {
  return FREE_THEMES.find((t) => t.id === id);
}
