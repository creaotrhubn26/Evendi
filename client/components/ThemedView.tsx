import { View, type ViewProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  cardStyle?: boolean; // Use cardRadius from design settings
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  cardStyle = false,
  ...otherProps
}: ThemedViewProps) {
  const { theme, isDark, designSettings } = useTheme();

  const backgroundColor =
    isDark && darkColor
      ? darkColor
      : !isDark && lightColor
        ? lightColor
        : theme.backgroundRoot;

  const cardRadius = cardStyle ? parseInt(designSettings.cardRadius || "12") : undefined;

  return (
    <View 
      style={[
        { backgroundColor, ...(cardRadius && { borderRadius: cardRadius }) }, 
        style
      ]} 
      {...otherProps} 
    />
  );
}
