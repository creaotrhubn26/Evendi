import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getWeddingDetails } from "./storage";

const NOTIFICATION_SETTINGS_KEY = "@wedflow/notification_settings";
const COUNTDOWN_NOTIFICATIONS_KEY = "@wedflow/countdown_notifications";
const CHECKLIST_NOTIFICATIONS_KEY = "@wedflow/checklist_notifications";

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

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
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

export async function scheduleAllNotifications(settings: NotificationSettings): Promise<void> {
  if (!settings.enabled) return;

  await scheduleCountdownNotifications(settings);

  if (!settings.checklistReminders) {
    await cancelAllChecklistReminders();
  }
}

async function scheduleCountdownNotifications(settings: NotificationSettings): Promise<void> {
  await cancelCountdownNotifications();

  if (!settings.weddingCountdown) return;

  const wedding = await getWeddingDetails();
  if (!wedding?.weddingDate) return;

  const weddingDate = new Date(wedding.weddingDate);
  const scheduledIds: string[] = [];

  for (const daysBefore of settings.daysBefore) {
    const notificationDate = new Date(weddingDate);
    notificationDate.setDate(notificationDate.getDate() - daysBefore);
    notificationDate.setHours(9, 0, 0, 0);

    if (notificationDate > new Date()) {
      const title = daysBefore === 1 
        ? "Bryllupet er i morgen!" 
        : daysBefore === 0 
          ? "Gratulerer med dagen!" 
          : `${daysBefore} dager til bryllupet!`;

      const body = daysBefore === 1
        ? "Siste sjekk av alle detaljer. Vi gleder oss med dere!"
        : daysBefore === 0
          ? "I dag er den store dagen. Nyt hvert øyeblikk!"
          : `Ikke glem å sjekke gjøremålslisten din.`;

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
  dueDate: Date
): Promise<string | null> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.checklistReminders) return null;

  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - 7);
  reminderDate.setHours(10, 0, 0, 0);

  if (reminderDate <= new Date()) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Påminnelse om gjøremål",
        body: `Husk: "${taskTitle}" bør gjøres snart!`,
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

    return id;
  } catch {
    return null;
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
