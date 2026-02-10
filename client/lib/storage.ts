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
  WEDDING_DETAILS: "@wedflow/wedding_details",
  SCHEDULE: "@wedflow/schedule",
  TIMELINE_CULTURE: "@wedflow/timeline_culture",
  GUESTS: "@wedflow/guests",
  TABLES: "@wedflow/tables",
  SPEECHES: "@wedflow/speeches",
  IMPORTANT_PEOPLE: "@wedflow/important_people",
  PHOTO_SHOTS: "@wedflow/photo_shots",
  BUDGET_ITEMS: "@wedflow/budget_items",
  TOTAL_BUDGET: "@wedflow/total_budget",
  COUPLE_SESSION: "wedflow_couple_session",
  APP_LANGUAGE: "@wedflow/app_language",
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
