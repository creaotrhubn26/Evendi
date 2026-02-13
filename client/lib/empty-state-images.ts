/**
 * Empty State Illustrations — Maps screen keys to bundled PNGs or custom URIs.
 * Admin can override any illustration with a custom image URI
 * stored in AsyncStorage via useCustomEmptyImages().
 */
import type { ImageSourcePropType } from "react-native";

export type EmptyStateKey =
  // Couple-facing
  | "guests" | "schedule" | "inspiration" | "vendors" | "messages"
  | "timeline" | "reminders" | "offers" | "contracts" | "important_people"
  | "catering" | "haar_makeup" | "cake" | "photographer" | "flowers"
  | "planlegger_meetings" | "planlegger_tasks" | "qa_questions"
  | "video_guides" | "share_partner"
  // Vendor-facing
  | "vendor_inventory" | "vendor_deliveries" | "vendor_inspirations"
  | "vendor_products" | "vendor_offers" | "vendor_reviews" | "vendor_couples"
  | "vendor_messages" | "vendor_bookings" | "vendor_availability"
  | "vendor_speeches" | "vendor_videograf" | "vendor_help"
  // Admin
  | "admin_checklists" | "admin_whats_new" | "admin_inspirations"
  | "admin_categories" | "admin_preview" | "admin_subscriptions"
  | "admin_smoke_test" | "admin_vendor_chats";

export interface EmptyStateConfig {
  key: EmptyStateKey;
  labelNo: string;
  labelEn: string;
  defaultIcon: string;  // EvendiIcon fallback name
}

export const EMPTY_STATE_CONFIGS: EmptyStateConfig[] = [
  // ── Couple-facing ─────────────────────────────
  { key: "guests", labelNo: "Gjester", labelEn: "Guests", defaultIcon: "users" },
  { key: "schedule", labelNo: "Program", labelEn: "Schedule", defaultIcon: "calendar" },
  { key: "inspiration", labelNo: "Inspirasjon", labelEn: "Inspiration", defaultIcon: "image" },
  { key: "vendors", labelNo: "Leverandorer", labelEn: "Vendors", defaultIcon: "search" },
  { key: "messages", labelNo: "Meldinger", labelEn: "Messages", defaultIcon: "inbox" },
  { key: "timeline", labelNo: "Tidsplan", labelEn: "Timeline", defaultIcon: "calendar" },
  { key: "reminders", labelNo: "Paminnelser", labelEn: "Reminders", defaultIcon: "bell-off" },
  { key: "offers", labelNo: "Tilbud", labelEn: "Offers", defaultIcon: "file-text" },
  { key: "contracts", labelNo: "Avtaler", labelEn: "Contracts", defaultIcon: "file-text" },
  { key: "important_people", labelNo: "Viktige personer", labelEn: "Important People", defaultIcon: "users" },
  { key: "catering", labelNo: "Catering", labelEn: "Catering", defaultIcon: "heart" },
  { key: "haar_makeup", labelNo: "Har og makeup", labelEn: "Hair & Makeup", defaultIcon: "heart" },
  { key: "cake", labelNo: "Kake", labelEn: "Cake", defaultIcon: "heart" },
  { key: "photographer", labelNo: "Fotograf", labelEn: "Photographer", defaultIcon: "camera" },
  { key: "flowers", labelNo: "Blomster", labelEn: "Flowers", defaultIcon: "heart" },
  { key: "planlegger_meetings", labelNo: "Planlegger - moter", labelEn: "Planner - Meetings", defaultIcon: "users" },
  { key: "planlegger_tasks", labelNo: "Planlegger - oppgaver", labelEn: "Planner - Tasks", defaultIcon: "check-square" },
  { key: "qa_questions", labelNo: "Q&A sporsmal", labelEn: "Q&A Questions", defaultIcon: "message-circle" },
  { key: "video_guides", labelNo: "Videoguider", labelEn: "Video Guides", defaultIcon: "video" },
  { key: "share_partner", labelNo: "Invitasjoner", labelEn: "Invitations", defaultIcon: "mail" },
  // ── Vendor-facing ─────────────────────────────
  { key: "vendor_inventory", labelNo: "Varelager", labelEn: "Inventory", defaultIcon: "package" },
  { key: "vendor_deliveries", labelNo: "Leveranser", labelEn: "Deliveries", defaultIcon: "package" },
  { key: "vendor_inspirations", labelNo: "Showcases", labelEn: "Showcases", defaultIcon: "image" },
  { key: "vendor_products", labelNo: "Produkter", labelEn: "Products", defaultIcon: "shopping-bag" },
  { key: "vendor_offers", labelNo: "Tilbud (leverandor)", labelEn: "Offers (vendor)", defaultIcon: "file-text" },
  { key: "vendor_reviews", labelNo: "Anmeldelser", labelEn: "Reviews", defaultIcon: "star" },
  { key: "vendor_couples", labelNo: "Brudepar", labelEn: "Couples", defaultIcon: "users" },
  { key: "vendor_messages", labelNo: "Meldinger (leverandor)", labelEn: "Messages (vendor)", defaultIcon: "message-circle" },
  { key: "vendor_bookings", labelNo: "Bookinger", labelEn: "Bookings", defaultIcon: "home" },
  { key: "vendor_availability", labelNo: "Tilgjengelighet", labelEn: "Availability", defaultIcon: "calendar" },
  { key: "vendor_speeches", labelNo: "Taler", labelEn: "Speeches", defaultIcon: "mic" },
  { key: "vendor_videograf", labelNo: "Videograf", labelEn: "Videographer", defaultIcon: "video" },
  { key: "vendor_help", labelNo: "Hjelp", labelEn: "Help", defaultIcon: "help-circle" },
  // ── Admin ─────────────────────────────────────
  { key: "admin_checklists", labelNo: "Sjekklister", labelEn: "Checklists", defaultIcon: "clipboard" },
  { key: "admin_whats_new", labelNo: "Nyheter", labelEn: "What's New", defaultIcon: "bell" },
  { key: "admin_inspirations", labelNo: "Showcases (admin)", labelEn: "Showcases (admin)", defaultIcon: "inbox" },
  { key: "admin_categories", labelNo: "Kategorier", labelEn: "Categories", defaultIcon: "folder" },
  { key: "admin_preview", labelNo: "Forhåndsvisning", labelEn: "Preview", defaultIcon: "inbox" },
  { key: "admin_subscriptions", labelNo: "Abonnementer", labelEn: "Subscriptions", defaultIcon: "credit-card" },
  { key: "admin_smoke_test", labelNo: "Smoke test", labelEn: "Smoke Test", defaultIcon: "activity" },
  { key: "admin_vendor_chats", labelNo: "Chatter", labelEn: "Chats", defaultIcon: "message-circle" },
];

// ─── Bundled images (only for screens that have PNGs) ───────────
const BUNDLED_IMAGES: Partial<Record<EmptyStateKey, ImageSourcePropType>> = {
  guests: require("@/assets/images/empty-guests.png"),
  schedule: require("@/assets/images/empty-schedule.png"),
  inspiration: require("@/assets/images/empty-inspiration.png"),
};

/**
 * Get image source for an empty state.
 * Custom URI (admin override) > bundled PNG > null (use EvendiIcon fallback).
 */
export function getEmptyStateImage(
  key: EmptyStateKey,
  customImages?: Record<string, string>,
): ImageSourcePropType | null {
  if (customImages?.[key]) {
    return { uri: customImages[key] };
  }
  return BUNDLED_IMAGES[key] ?? null;
}

/**
 * Get the default EvendiIcon name for an empty state key.
 */
export function getEmptyStateIcon(key: EmptyStateKey): string {
  const config = EMPTY_STATE_CONFIGS.find((c) => c.key === key);
  return config?.defaultIcon ?? "inbox";
}
