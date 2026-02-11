import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  WeddingDetails,
  ScheduleEvent,
  Guest,
  Table,
  Speech,
  ImportantPerson,
  PhotoShot,
  BudgetItem,
} from "./types";

const KEYS = {
  WEDDING_DETAILS: "@evendi/wedding_details",
  SCHEDULE: "@evendi/schedule",
  TIMELINE_CULTURE: "@evendi/timeline_culture",
  GUESTS: "@evendi/guests",
  TABLES: "@evendi/tables",
  SPEECHES: "@evendi/speeches",
  IMPORTANT_PEOPLE: "@evendi/important_people",
  PHOTO_SHOTS: "@evendi/photo_shots",
  BUDGET_ITEMS: "@evendi/budget_items",
  TOTAL_BUDGET: "@evendi/total_budget",
  COUPLE_SESSION: "evendi_couple_session",
  APP_LANGUAGE: "@evendi/app_language",
};

export type AppLanguage = "nb" | "en";

export async function getCoupleSession(): Promise<{ token: string; sessionToken?: string; coupleId?: string } | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.COUPLE_SESSION);
    if (!data) return null;
    const parsed = JSON.parse(data);
    // Login stores sessionToken, normalize to token
    const token = parsed.token || parsed.sessionToken;
    return token ? { token, sessionToken: parsed.sessionToken, coupleId: parsed.coupleId } : null;
  } catch {
    return null;
  }
}

export async function saveCoupleSession(token: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.COUPLE_SESSION, JSON.stringify({ token }));
}

export async function clearCoupleSession(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.COUPLE_SESSION);
}

export async function getWeddingDetails(): Promise<WeddingDetails | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.WEDDING_DETAILS);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function saveWeddingDetails(details: WeddingDetails): Promise<void> {
  await AsyncStorage.setItem(KEYS.WEDDING_DETAILS, JSON.stringify(details));
}

export async function getSchedule(): Promise<ScheduleEvent[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SCHEDULE);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveSchedule(events: ScheduleEvent[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.SCHEDULE, JSON.stringify(events));
}

export async function getTimelineCulture(): Promise<string | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.TIMELINE_CULTURE);
    return data || null;
  } catch {
    return null;
  }
}

export async function saveTimelineCulture(cultureKey: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.TIMELINE_CULTURE, cultureKey);
}

export async function getGuests(): Promise<Guest[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.GUESTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveGuests(guests: Guest[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.GUESTS, JSON.stringify(guests));
}

export async function getTables(): Promise<Table[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.TABLES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveTables(tables: Table[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.TABLES, JSON.stringify(tables));
}

export async function getSpeeches(): Promise<Speech[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SPEECHES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveSpeeches(speeches: Speech[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.SPEECHES, JSON.stringify(speeches));
}

export async function getImportantPeople(): Promise<ImportantPerson[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.IMPORTANT_PEOPLE);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveImportantPeople(people: ImportantPerson[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.IMPORTANT_PEOPLE, JSON.stringify(people));
}

export async function getPhotoShots(): Promise<PhotoShot[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.PHOTO_SHOTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function savePhotoShots(shots: PhotoShot[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.PHOTO_SHOTS, JSON.stringify(shots));
}

export async function getBudgetItems(): Promise<BudgetItem[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.BUDGET_ITEMS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveBudgetItems(items: BudgetItem[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.BUDGET_ITEMS, JSON.stringify(items));
}

export async function getTotalBudget(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(KEYS.TOTAL_BUDGET);
    return data ? JSON.parse(data) : 300000;
  } catch {
    return 300000;
  }
}

export async function saveTotalBudget(budget: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.TOTAL_BUDGET, JSON.stringify(budget));
}

export async function getAppLanguage(): Promise<AppLanguage> {
  try {
    const data = await AsyncStorage.getItem(KEYS.APP_LANGUAGE);
    return data === "en" ? "en" : "nb";
  } catch {
    return "nb";
  }
}

export async function saveAppLanguage(language: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(KEYS.APP_LANGUAGE, language);
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// ── Legacy key migration (Wedflow → Evendi) ──────────────────────────
// Maps old @wedflow/* AsyncStorage keys to new @evendi/* keys.
// Run once on app startup to preserve existing user data.
const LEGACY_KEYS: Record<string, string> = {
  "@wedflow/wedding_details": "@evendi/wedding_details",
  "@wedflow/schedule": "@evendi/schedule",
  "@wedflow/timeline_culture": "@evendi/timeline_culture",
  "@wedflow/guests": "@evendi/guests",
  "@wedflow/tables": "@evendi/tables",
  "@wedflow/speeches": "@evendi/speeches",
  "@wedflow/important_people": "@evendi/important_people",
  "@wedflow/photo_shots": "@evendi/photo_shots",
  "@wedflow/budget_items": "@evendi/budget_items",
  "@wedflow/total_budget": "@evendi/total_budget",
  "@wedflow/app_language": "@evendi/app_language",
  "@wedflow/checklist": "@evendi/checklist",
  "@wedflow/checklist_notifications": "@evendi/checklist_notifications",
  "@wedflow/countdown_notifications": "@evendi/countdown_notifications",
  "@wedflow/custom_reminders": "@evendi/custom_reminders",
  "@wedflow/notification_settings": "@evendi/notification_settings",
  "wedflow_couple_session": "evendi_couple_session",
  "wedflow_vendor_session": "evendi_vendor_session",
  "wedflow_admin_key": "evendi_admin_key",
  "wedflow_seating": "evendi_seating",
  "wedflow_scouting_travel_cache": "evendi_scouting_travel_cache",
  "wedflow_vendor_coords_cache": "evendi_vendor_coords_cache",
  "wedflow_vendor_travel_cache": "evendi_vendor_travel_cache",
  "wedflow_guests_quick_filter": "evendi_guests_quick_filter",
  "wedflow_guests_rsvp_filter": "evendi_guests_rsvp_filter",
  "wedflow_guests_search_query": "evendi_guests_search_query",
  "wedflow_stress_tracker_affirmation": "evendi_stress_tracker_affirmation",
  "wedflow_stress_tracker_countdown": "evendi_stress_tracker_countdown",
  "wedflow_stress_tracker_haptics": "evendi_stress_tracker_haptics",
  "wedflow_stress_tracker_session_minutes": "evendi_stress_tracker_session_minutes",
  "wedflow_stress_tracker_total_breaths": "evendi_stress_tracker_total_breaths",
  "wedflow_vendor_custom_quick_templates": "evendi_vendor_custom_quick_templates",
  "wedflow_whats_new_category": "evendi_whats_new_category",
};

const MIGRATION_FLAG = "@evendi/migrated_from_wedflow";

/**
 * One-time migration: copies data from old @wedflow/* keys to @evendi/* keys.
 * Only runs once — subsequent calls are a no-op.
 * Does NOT delete old keys (safe rollback).
 */
export async function migrateFromWedflow(): Promise<void> {
  try {
    const alreadyMigrated = await AsyncStorage.getItem(MIGRATION_FLAG);
    if (alreadyMigrated) return;

    let migrated = 0;
    for (const [oldKey, newKey] of Object.entries(LEGACY_KEYS)) {
      const value = await AsyncStorage.getItem(oldKey);
      if (value !== null) {
        // Only copy if new key doesn't already have data
        const existing = await AsyncStorage.getItem(newKey);
        if (existing === null) {
          await AsyncStorage.setItem(newKey, value);
          migrated++;
        }
      }
    }

    await AsyncStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
    if (migrated > 0) {
      console.log(`[Evendi] Migrated ${migrated} keys from legacy storage`);
    }
  } catch (err) {
    console.warn("[Evendi] Legacy key migration failed:", err);
  }
}
