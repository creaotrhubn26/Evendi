/**
 * EmptyStateIllustration — Renders a custom image or EvendiIcon for empty states.
 *
 * If admin has set a custom image (or a bundled PNG exists), renders <Image>.
 * Otherwise renders a circular EvendiIcon badge.
 */
import React from "react";
import { Image, View } from "react-native";
import { EvendiIcon } from "@/components/EvendiIcon";
import { useTheme } from "@/hooks/useTheme";
import { useCustomEmptyImages } from "@/hooks/useCustomEmptyImages";
import { getEmptyStateImage, getEmptyStateIcon } from "@/lib/empty-state-images";
import type { EmptyStateKey } from "@/lib/empty-state-images";

interface Props {
  stateKey: EmptyStateKey;
  size?: number;
}

export function EmptyStateIllustration({ stateKey, size = 120 }: Props) {
  const { theme } = useTheme();
  const { customImages } = useCustomEmptyImages();
  const image = getEmptyStateImage(stateKey, customImages);

  if (image) {
    return (
      <Image
        source={image}
        style={{ width: size, height: size, opacity: 0.85, marginBottom: 16 }}
        resizeMode="contain"
      />
    );
  }

  const iconName = getEmptyStateIcon(stateKey);
  const iconSize = size * 0.4;

  return (
    <View
      style={{
        width: size * 0.65,
        height: size * 0.65,
        borderRadius: size * 0.325,
        backgroundColor: theme.backgroundSecondary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
      }}
    >
      <EvendiIcon name={iconName} size={iconSize} color={theme.textMuted} />
    </View>
  );
}
