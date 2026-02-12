/**
 * Event Type Icons — Maps event types to EvendiIcon names.
 *
 * Since we don't have custom PNGs for all 19 event types yet,
 * this module maps each type to a Feather/EvendiIcon name as the default.
 * Admin can override any event type icon with a custom image URI
 * stored in AsyncStorage via useCustomEventIcons().
 *
 * When custom PNGs are added to assets/event-types/, update BUNDLED_IMAGES.
 */
import type { EventType } from "@shared/event-types";
import type { ImageSourcePropType } from "react-native";

// ─── Default EvendiIcon name per event type ─────────────────────
export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  wedding: "heart",
  confirmation: "star",
  birthday: "gift",
  anniversary: "award",
  engagement: "diamond" as string,  // feather doesn't have diamond, fallback below
  baby_shower: "smile",
  conference: "mic",
  seminar: "clipboard",
  kickoff: "target",
  summer_party: "sun",
  christmas_party: "gift",
  team_building: "users",
  product_launch: "zap",
  trade_fair: "globe",
  corporate_anniversary: "award",
  awards_night: "award",
  employee_day: "thumbs-up",
  onboarding_day: "user-plus",
  corporate_event: "briefcase",
};

// Fix icons that don't exist in Feather set
const FEATHER_FIXES: Record<string, string> = {
  diamond: "hexagon",
  mic: "mic",
};

/**
 * Get the EvendiIcon name for an event type.
 */
export function getEventTypeIcon(type: EventType): string {
  const icon = EVENT_TYPE_ICONS[type] ?? "calendar";
  return FEATHER_FIXES[icon] ?? icon;
}

// ─── Accent colors per event type ───────────────────────────────
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  wedding: "#ec4899",
  confirmation: "#8b5cf6",
  birthday: "#f59e0b",
  anniversary: "#ef4444",
  engagement: "#ec4899",
  baby_shower: "#06b6d4",
  conference: "#3b82f6",
  seminar: "#6366f1",
  kickoff: "#f97316",
  summer_party: "#eab308",
  christmas_party: "#ef4444",
  team_building: "#10b981",
  product_launch: "#f97316",
  trade_fair: "#6366f1",
  corporate_anniversary: "#f59e0b",
  awards_night: "#f59e0b",
  employee_day: "#10b981",
  onboarding_day: "#3b82f6",
  corporate_event: "#64748b",
};

/**
 * Get accent color for an event type. Admin can override.
 */
export function getEventTypeColor(
  type: EventType,
  customColors?: Record<string, string>,
): string {
  return customColors?.[type] ?? EVENT_TYPE_COLORS[type] ?? "#64748b";
}

// ─── Bundled PNG images (add as you create them) ────────────────
const BUNDLED_IMAGES: Partial<Record<EventType, ImageSourcePropType>> = {
  // When you add a PNG for an event type, map it here:
  // conference: require("@/../../assets/event-types/conference.png"),
};

/**
 * Get the image source for an event type if available.
 * Returns custom URI, bundled PNG, or null (meaning use icon instead).
 */
export function getEventTypeImage(
  type: EventType,
  customIcons?: Record<string, string>,
): ImageSourcePropType | null {
  if (customIcons?.[type]) {
    return { uri: customIcons[type] };
  }
  return BUNDLED_IMAGES[type] ?? null;
}
