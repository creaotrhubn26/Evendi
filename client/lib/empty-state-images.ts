/**
 * Empty State Illustrations — Maps screen keys to bundled PNGs.
 * Admin can override any illustration with a custom image URI
 * stored in AsyncStorage via useCustomEmptyImages().
 */
import type { ImageSourcePropType } from "react-native";

export type EmptyStateKey = "guests" | "schedule" | "inspiration";

export interface EmptyStateConfig {
  key: EmptyStateKey;
  labelNo: string;
  labelEn: string;
}

export const EMPTY_STATE_CONFIGS: EmptyStateConfig[] = [
  { key: "guests", labelNo: "Gjester", labelEn: "Guests" },
  { key: "schedule", labelNo: "Program", labelEn: "Schedule" },
  { key: "inspiration", labelNo: "Inspirasjon", labelEn: "Inspiration" },
];

// ─── Bundled images ─────────────────────────────────────────────
const BUNDLED_IMAGES: Record<EmptyStateKey, ImageSourcePropType> = {
  guests: require("@/../../assets/images/empty-guests.png"),
  schedule: require("@/../../assets/images/empty-schedule.png"),
  inspiration: require("@/../../assets/images/empty-inspiration.png"),
};

/**
 * Get image source for an empty state.
 * Custom URI (admin override) takes priority over bundled PNG.
 */
export function getEmptyStateImage(
  key: EmptyStateKey,
  customImages?: Record<string, string>,
): ImageSourcePropType {
  if (customImages?.[key]) {
    return { uri: customImages[key] };
  }
  return BUNDLED_IMAGES[key];
}
