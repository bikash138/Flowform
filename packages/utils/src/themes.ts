import type { FormTheme } from "@flowform/database/models";

export type ThemeTemplate = {
  id: string;
  name: string;
  description: string;
  theme: FormTheme;
};

export const FREE_THEMES: ThemeTemplate[] = [
  {
    id: "flowform",
    name: "Flowform",
    description: "Warm and welcoming — the Flowform default.",
    theme: {
      primaryColor: "#D9B38C",
      backgroundColor: "#FFFFFF",
      accentColor: "#A68A6D",

      borderRadius: "rounded",
      backgroundImage: null,
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean and sharp. No distractions.",
    theme: {
      primaryColor: "#2B2B2B",
      backgroundColor: "#FFFFFF",
      accentColor: "#666666",

      borderRadius: "sharp",
      backgroundImage: null,
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark background with a bold indigo accent.",
    theme: {
      primaryColor: "#6366F1",
      backgroundColor: "#0F0F0F",
      accentColor: "#818CF8",

      borderRadius: "rounded",
      backgroundImage: null,
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool blue tones with a soft, airy feel.",
    theme: {
      primaryColor: "#0EA5E9",
      backgroundColor: "#F0F9FF",
      accentColor: "#0284C7",

      borderRadius: "pill",
      backgroundImage: null,
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Earthy greens. Calm and focused.",
    theme: {
      primaryColor: "#16A34A",
      backgroundColor: "#F0FDF4",
      accentColor: "#15803D",

      borderRadius: "rounded",
      backgroundImage: null,
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange energy. Bold and inviting.",
    theme: {
      primaryColor: "#F97316",
      backgroundColor: "#FFF7ED",
      accentColor: "#EA580C",

      borderRadius: "rounded",
      backgroundImage: null,
    },
  },
];

export function getFreeThemeById(id: string): ThemeTemplate | undefined {
  return FREE_THEMES.find((t) => t.id === id);
}