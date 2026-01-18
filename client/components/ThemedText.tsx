import { Text, type TextProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Typography } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "h1" | "h2" | "h3" | "h4" | "body" | "small" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  ...rest
}: ThemedTextProps) {
  const { theme, isDark, designSettings } = useTheme();

  const getColor = () => {
    if (isDark && darkColor) {
      return darkColor;
    }

    if (!isDark && lightColor) {
      return lightColor;
    }

    if (type === "link") {
      return theme.link;
    }

    return theme.text;
  };

  const getTypeStyle = () => {
    const baseFontSize = parseInt(designSettings.fontSize || "16");
    const fontFamily = designSettings.fontFamily;
    
    const fontFamilyStyle = fontFamily !== "System" 
      ? { fontFamily }
      : {};

    switch (type) {
      case "h1":
        return { ...Typography.h1, ...fontFamilyStyle, fontSize: baseFontSize * 2 };
      case "h2":
        return { ...Typography.h2, ...fontFamilyStyle, fontSize: baseFontSize * 1.75 };
      case "h3":
        return { ...Typography.h3, ...fontFamilyStyle, fontSize: baseFontSize * 1.5 };
      case "h4":
        return { ...Typography.h4, ...fontFamilyStyle, fontSize: baseFontSize * 1.25 };
      case "body":
        return { ...Typography.body, ...fontFamilyStyle, fontSize: baseFontSize };
      case "small":
        return { ...Typography.small, ...fontFamilyStyle, fontSize: baseFontSize * 0.875 };
      case "link":
        return { ...Typography.link, ...fontFamilyStyle, fontSize: baseFontSize };
      default:
        return { ...Typography.body, ...fontFamilyStyle, fontSize: baseFontSize };
    }
  };

  return (
    <Text style={[{ color: getColor() }, getTypeStyle(), style]} {...rest} />
  );
}
