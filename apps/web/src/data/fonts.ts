export type FontOption = {
  label: string;
  value: string;
  category: "sans" | "serif" | "mono";
};

export const AVAILABLE_FONTS: FontOption[] = [
  { label: "Inter", value: "Inter", category: "sans" },
  { label: "Open Sans", value: "Open Sans", category: "sans" },
  { label: "Roboto", value: "Roboto", category: "sans" },
  { label: "Lato", value: "Lato", category: "sans" },
  { label: "Poppins", value: "Poppins", category: "sans" },
  { label: "Montserrat", value: "Montserrat", category: "sans" },
  { label: "DM Sans", value: "DM Sans", category: "sans" },
  { label: "Nunito", value: "Nunito", category: "sans" },
  { label: "Raleway", value: "Raleway", category: "sans" },
  { label: "Playfair Display", value: "Playfair Display", category: "serif" },
  { label: "Merriweather", value: "Merriweather", category: "serif" },
  { label: "Georgia", value: "Georgia", category: "serif" },
  { label: "JetBrains Mono", value: "JetBrains Mono", category: "mono" },
];
