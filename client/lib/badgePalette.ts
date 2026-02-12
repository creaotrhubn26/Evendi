export type BadgeTone = "accent" | "success" | "warning" | "error" | "neutral";

type ThemeLike = {
  accent: string;
  success: string;
  warning: string;
  error: string;
  textSecondary: string;
};

type BadgePalette = {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
};

export const getBadgePalette = (
  theme: ThemeLike,
  tone: BadgeTone,
  alpha: string = "15"
): BadgePalette => {
  const base =
    tone === "success"
      ? theme.success
      : tone === "warning"
      ? theme.warning
      : tone === "error"
      ? theme.error
      : tone === "neutral"
      ? theme.textSecondary
      : theme.accent;

  return {
    backgroundColor: `${base}${alpha}`,
    textColor: base,
    borderColor: `${base}30`,
  };
};
