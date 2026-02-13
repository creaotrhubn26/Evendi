import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getWeddingDetails, getCoupleSession, getAppLanguage, type AppLanguage } from "./storage";
import { getApiUrl } from "@/lib/query-client";
import { getChecklistTasks } from "./api-checklist";
import { showToast as showToastNative } from "@/lib/toast";

const isWeb = Platform.OS === "web";

const NOTIFICATION_SETTINGS_KEY = "@evendi/notification_settings";
const COUNTDOWN_NOTIFICATIONS_KEY = "@evendi/countdown_notifications";
const CHECKLIST_NOTIFICATIONS_KEY = "@evendi/checklist_notifications";
const CUSTOM_REMINDERS_KEY = "@evendi/custom_reminders";

const NOTIFICATION_SETTINGS_CACHE_TTL = 5 * 60 * 1000;
let cachedAppSettings: Record<string, string> | null = null;
let cachedAppSettingsAt = 0;

const applyTemplate = (template: string, params: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      return String(params[key]);
    }
    return match;
  });

const parseLocalizedSetting = (
  raw: string | undefined,
  language: AppLanguage,
  fallback: string
): string => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<AppLanguage, string>>;
    if (parsed && typeof parsed === "object" && parsed[language]) {
      return parsed[language] as string;
    }
  } catch {
    // Ignore JSON parsing errors and fall back to raw string
  }
  return raw;
};

const getAppSettingsMap = async (): Promise<Record<string, string>> => {
  const now = Date.now();
  if (cachedAppSettings && now - cachedAppSettingsAt < NOTIFICATION_SETTINGS_CACHE_TTL) {
    return cachedAppSettings;
  }
  try {
    const url = new URL("/api/app-settings", getApiUrl());
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to fetch app settings");
    const data = (await res.json()) as Array<{ key: string; value: string }>;
    const map: Record<string, string> = {};
    data.forEach((setting) => {
      map[setting.key] = setting.value;
    });
    cachedAppSettings = map;
    cachedAppSettingsAt = now;
    return map;
  } catch {
    return cachedAppSettings ?? {};
  }
};

type NotificationCopy = {
  toastChecklistFailed: string;
  toastUpdated: string;
  toastPermissionGranted: string;
  checklistTitle: string;
  checklistBody: (taskTitle: string) => string;
  countdownTitle: (daysBefore: number) => string;
  countdownBody: (daysBefore: number) => string;
};

const NOTIFICATION_COPY: Record<AppLanguage, NotificationCopy> = {
  nb: {
    toastChecklistFailed: "Noen sjekkliste-varsler kunne ikke planlegges.",
    toastUpdated: "Varsler oppdatert.",
    toastPermissionGranted: "Varsler tillatt.",
    checklistTitle: "Påminnelse om gjøremål",
    checklistBody: (taskTitle) => `Husk: "${taskTitle}" bør gjøres snart!`,
    countdownTitle: (daysBefore) =>
      daysBefore === 1
        ? "Bryllupet er i morgen!"
        : daysBefore === 0
          ? "Gratulerer med dagen!"
          : `${daysBefore} dager til bryllupet!`,
    countdownBody: (daysBefore) =>
      daysBefore === 1
        ? "Siste sjekk av alle detaljer. Vi gleder oss med dere!"
        : daysBefore === 0
          ? "I dag er den store dagen. Nyt hvert øyeblikk!"
          : "Ikke glem å sjekke gjoremalsslisten din.",
  },
  en: {
    toastChecklistFailed: "Some checklist reminders could not be scheduled.",
    toastUpdated: "Notifications updated.",
    toastPermissionGranted: "Notifications allowed.",
    checklistTitle: "Checklist reminder",
    checklistBody: (taskTitle) => `Remember: "${taskTitle}" should be done soon!`,
    countdownTitle: (daysBefore) =>
      daysBefore === 1
        ? "The wedding is tomorrow!"
        : daysBefore === 0
          ? "Congratulations on your big day!"
          : `${daysBefore} days until the wedding!`,
    countdownBody: (daysBefore) =>
      daysBefore === 1
        ? "Final check of all details. We are excited for you!"
        : daysBefore === 0
          ? "Today is the big day. Enjoy every moment!"
          : "Don't forget to review your checklist.",
  },
};

const CATEGORY_LABELS_EN: Record<string, string> = {
  general: "General",
  vendor: "Vendor",
  budget: "Budget",
  guest: "Guests",
  planning: "Planning",
};

export interface NotificationSettings {
  enabled: boolean;
  checklistReminders: boolean;
  weddingCountdown: boolean;
  daysBefore: number[];
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  checklistReminders: true,
  weddingCountdown: true,
  daysBefore: [30, 7, 1],
};

// Avoid registering native notification handlers on web where expo-notifications
// push token listeners are not supported and emit noisy warnings.
if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isWeb) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return data ? JSON.parse(data) : DEFAULT_NOTIFICATION_SETTINGS;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  
  if (settings.enabled) {
    await scheduleAllNotifications(settings);
  } else {
    await cancelAllScheduledNotifications();
  }
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.multiRemove([COUNTDOWN_NOTIFICATIONS_KEY, CHECKLIST_NOTIFICATIONS_KEY]);
}

export async function cancelCountdownNotifications(): Promise<void> {
  try {
    const storedIds = await AsyncStorage.getItem(COUNTDOWN_NOTIFICATIONS_KEY);
    if (storedIds) {
      const ids: string[] = JSON.parse(storedIds);
      await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    }
    await AsyncStorage.removeItem(COUNTDOWN_NOTIFICATIONS_KEY);
  } catch {}
}

export async function cancelAllChecklistReminders(): Promise<void> {
  try {
    const storedIds = await AsyncStorage.getItem(CHECKLIST_NOTIFICATIONS_KEY);
    if (storedIds) {
      const ids: string[] = JSON.parse(storedIds);
      await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    }
    await AsyncStorage.removeItem(CHECKLIST_NOTIFICATIONS_KEY);
  } catch {}
}

export async function scheduleAllNotifications(settings: NotificationSettings): Promise<{ checklistFailed: number }> {
  if (!settings.enabled) return { checklistFailed: 0 };

  const language = await getAppLanguage();

  await scheduleCountdownNotifications(settings, language);

  let checklistFailed = 0;
  if (!settings.checklistReminders) {
    await cancelAllChecklistReminders();
  } else {
    const { failed } = await scheduleChecklistRemindersFromTasks(settings, language);
    checklistFailed = failed;
    if (failed > 0) {
      const copy = await getNotificationCopyAsync(language);
      showToast(copy.toastChecklistFailed);
    }
  }

  return { checklistFailed };
}

export async function rescheduleChecklistReminders(): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.checklistReminders) {
    await cancelAllChecklistReminders();
    return;
  }

  const language = await getAppLanguage();
  const { failed } = await scheduleChecklistRemindersFromTasks(settings, language);
  if (failed > 0) {
    const copy = await getNotificationCopyAsync(language);
    showToast(copy.toastChecklistFailed);
  }
}

export async function rescheduleAllNotifications(showSuccess = false): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled) {
    await cancelAllScheduledNotifications();
    return;
  }

  const language = await getAppLanguage();
  const result = await scheduleAllNotifications(settings);
  if (showSuccess && result?.checklistFailed === 0) {
    const copy = await getNotificationCopyAsync(language);
    showToast(copy.toastUpdated);
  }
}

async function scheduleChecklistRemindersFromTasks(
  settings: NotificationSettings,
  language: AppLanguage
): Promise<{ failed: number }> {
  await cancelAllChecklistReminders();

  if (!settings.enabled || !settings.checklistReminders || isWeb) return { failed: 0 };

  const session = await getCoupleSession();
  if (!session) return { failed: 0 };

  const wedding = await getWeddingDetails();
  if (!wedding?.weddingDate) return { failed: 0 };

  let tasks = [] as Awaited<ReturnType<typeof getChecklistTasks>>;
  try {
    tasks = await getChecklistTasks(session.token);
  } catch (error) {
    console.log("Failed to load checklist tasks for reminders:", error);
    return { failed: 0 };
  }

  const weddingDate = new Date(wedding.weddingDate);
  if (Number.isNaN(weddingDate.getTime())) return { failed: 0 };

  let failed = 0;

  for (const task of tasks) {
    if (task.completed) continue;

    const dueDate = new Date(weddingDate);
    dueDate.setMonth(dueDate.getMonth() - (task.monthsBefore ?? 0));
    dueDate.setHours(9, 0, 0, 0);

    const result = await scheduleChecklistReminder(task.title, dueDate, language);
    if (result.status === "failed") {
      failed += 1;
    }
  }

  return { failed };
}

async function scheduleCountdownNotifications(
  settings: NotificationSettings,
  language: AppLanguage
): Promise<void> {
  await cancelCountdownNotifications();

  if (!settings.weddingCountdown) return;

  const wedding = await getWeddingDetails();
  if (!wedding?.weddingDate) return;

  const weddingDate = new Date(wedding.weddingDate);
  const scheduledIds: string[] = [];

  const copy = await getNotificationCopyAsync(language);

  for (const daysBefore of settings.daysBefore) {
    const notificationDate = new Date(weddingDate);
    notificationDate.setDate(notificationDate.getDate() - daysBefore);
    notificationDate.setHours(9, 0, 0, 0);

    if (notificationDate > new Date()) {
      const title = copy.countdownTitle(daysBefore);
      const body = copy.countdownBody(daysBefore);

      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { type: "countdown", daysBefore },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: notificationDate,
          },
        });
        scheduledIds.push(id);
      } catch (error) {
        console.log("Failed to schedule notification:", error);
      }
    }
  }

  await AsyncStorage.setItem(COUNTDOWN_NOTIFICATIONS_KEY, JSON.stringify(scheduledIds));
}

export async function scheduleChecklistReminder(
  taskTitle: string,
  dueDate: Date,
  language?: AppLanguage
): Promise<{ status: "scheduled" | "skipped" | "failed"; id?: string }> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.checklistReminders) return { status: "skipped" };

  const copy = await getNotificationCopyAsync(language || (await getAppLanguage()));

  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - 7);
  reminderDate.setHours(10, 0, 0, 0);

  if (reminderDate <= new Date()) return { status: "skipped" };

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.checklistTitle,
        body: copy.checklistBody(taskTitle),
        data: { type: "checklist", task: taskTitle },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    const storedIds = await AsyncStorage.getItem(CHECKLIST_NOTIFICATIONS_KEY);
    const existingIds: string[] = storedIds ? JSON.parse(storedIds) : [];
    existingIds.push(id);
    await AsyncStorage.setItem(CHECKLIST_NOTIFICATIONS_KEY, JSON.stringify(existingIds));

    return { status: "scheduled", id };
  } catch {
    return { status: "failed" };
  }
}

export async function cancelChecklistReminder(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    const storedIds = await AsyncStorage.getItem(CHECKLIST_NOTIFICATIONS_KEY);
    if (storedIds) {
      const ids: string[] = JSON.parse(storedIds);
      const filteredIds = ids.filter((id) => id !== notificationId);
      await AsyncStorage.setItem(CHECKLIST_NOTIFICATIONS_KEY, JSON.stringify(filteredIds));
    }
  } catch {}
}

export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

export interface CustomReminder {
  id: string;
  title: string;
  description?: string | null;
  reminderDate: string | Date;
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "Generell",
  vendor: "Leverandør",
  budget: "Budsjett",
  guest: "Gjester",
  planning: "Planlegging",
};

const CATEGORY_ICONS: Record<string, string> = {
  general: "bell",
  vendor: "briefcase",
  budget: "dollar-sign",
  guest: "users",
  planning: "calendar",
};

export async function scheduleCustomReminder(
  reminder: CustomReminder
): Promise<string | null> {
  const settings = await getNotificationSettings();
  if (!settings.enabled) return null;

  if (Platform.OS === "web") return null;

  const reminderDate = new Date(reminder.reminderDate);
  reminderDate.setHours(9, 0, 0, 0);

  if (reminderDate <= new Date()) return null;

  try {
    const language = await getAppLanguage();
    const categoryLabel = getCategoryLabel(reminder.category, language);
    const body = reminder.description
      ? reminder.description
      : language === "en"
        ? `${categoryLabel} reminder`
        : `${categoryLabel} påminnelse`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body,
        data: { 
          type: "custom_reminder", 
          reminderId: reminder.id,
          category: reminder.category,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    const storedIds = await AsyncStorage.getItem(CUSTOM_REMINDERS_KEY);
    const existingIds: Record<string, string> = storedIds ? JSON.parse(storedIds) : {};
    existingIds[reminder.id] = notificationId;
    await AsyncStorage.setItem(CUSTOM_REMINDERS_KEY, JSON.stringify(existingIds));

    return notificationId;
  } catch (error) {
    console.log("Failed to schedule custom reminder:", error);
    return null;
  }
}

export async function cancelCustomReminder(reminderId: string): Promise<void> {
  try {
    const storedIds = await AsyncStorage.getItem(CUSTOM_REMINDERS_KEY);
    if (storedIds) {
      const ids: Record<string, string> = JSON.parse(storedIds);
      const notificationId = ids[reminderId];
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        delete ids[reminderId];
        await AsyncStorage.setItem(CUSTOM_REMINDERS_KEY, JSON.stringify(ids));
      }
    }
  } catch (error) {
    console.log("Failed to cancel custom reminder:", error);
  }
}

export async function cancelAllCustomReminders(): Promise<void> {
  try {
    const storedIds = await AsyncStorage.getItem(CUSTOM_REMINDERS_KEY);
    if (storedIds) {
      const ids: Record<string, string> = JSON.parse(storedIds);
      await Promise.all(
        Object.values(ids).map((notificationId) =>
          Notifications.cancelScheduledNotificationAsync(notificationId)
        )
      );
    }
    await AsyncStorage.removeItem(CUSTOM_REMINDERS_KEY);
  } catch (error) {
    console.log("Failed to cancel all custom reminders:", error);
  }
}

export { CATEGORY_LABELS, CATEGORY_ICONS };
export const getNotificationCopyAsync = async (language: AppLanguage): Promise<NotificationCopy> => {
  const defaults = NOTIFICATION_COPY[language] || NOTIFICATION_COPY.nb;
  const settings = await getAppSettingsMap();
  const toastChecklistFailed = parseLocalizedSetting(
    settings.notification_toast_checklist_failed,
    language,
    defaults.toastChecklistFailed
  );
  const toastUpdated = parseLocalizedSetting(
    settings.notification_toast_updated,
    language,
    defaults.toastUpdated
  );
  const toastPermissionGranted = parseLocalizedSetting(
    settings.notification_toast_permission_granted,
    language,
    defaults.toastPermissionGranted
  );
  const checklistTitle = parseLocalizedSetting(
    settings.notification_checklist_title,
    language,
    defaults.checklistTitle
  );
  const checklistBodyTemplate = parseLocalizedSetting(
    settings.notification_checklist_body_template,
    language,
    ""
  );
  const countdownTitleTemplate = parseLocalizedSetting(
    settings.notification_countdown_title_template,
    language,
    ""
  );
  const countdownBodyTemplate = parseLocalizedSetting(
    settings.notification_countdown_body_template,
    language,
    ""
  );

  return {
    ...defaults,
    toastChecklistFailed,
    toastUpdated,
    toastPermissionGranted,
    checklistTitle,
    checklistBody: (taskTitle) =>
      checklistBodyTemplate
        ? applyTemplate(checklistBodyTemplate, { task: taskTitle, taskTitle })
        : defaults.checklistBody(taskTitle),
    countdownTitle: (daysBefore) =>
      countdownTitleTemplate
        ? applyTemplate(countdownTitleTemplate, { days: daysBefore })
        : defaults.countdownTitle(daysBefore),
    countdownBody: (daysBefore) =>
      countdownBodyTemplate
        ? applyTemplate(countdownBodyTemplate, { days: daysBefore })
        : defaults.countdownBody(daysBefore),
  };
};
export const getCategoryLabel = (category: string, language: AppLanguage) => {
  if (language === "en") {
    return CATEGORY_LABELS_EN[category] || "General";
  }
  return CATEGORY_LABELS[category] || "Generell";
};

function showToast(message: string) {
  showToastNative(message);
}
