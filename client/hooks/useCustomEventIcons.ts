/**
 * useCustomEventIcons — Persists admin-customized event type icons & colors.
 *
 * Stored in AsyncStorage so the couple's custom overrides survive app restarts.
 * Works independently of the couple profile so any admin can tweak locally.
 */
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "evendi_custom_event_icons";

export interface CustomEventIconSettings {
  /** event type → custom image URI */
  icons: Record<string, string>;
  /** event type → custom hex color */
  colors: Record<string, string>;
}

const EMPTY: CustomEventIconSettings = { icons: {}, colors: {} };

export function useCustomEventIcons() {
  const [settings, setSettings] = useState<CustomEventIconSettings>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setSettings(JSON.parse(raw)); } catch { /* ignore */ }
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback(async (next: CustomEventIconSettings) => {
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setIcon = useCallback(async (eventType: string, uri: string | undefined) => {
    const next = { ...settings, icons: { ...settings.icons } };
    if (uri) {
      next.icons[eventType] = uri;
    } else {
      delete next.icons[eventType];
    }
    await persist(next);
  }, [settings, persist]);

  const setColor = useCallback(async (eventType: string, color: string | undefined) => {
    const next = { ...settings, colors: { ...settings.colors } };
    if (color) {
      next.colors[eventType] = color;
    } else {
      delete next.colors[eventType];
    }
    await persist(next);
  }, [settings, persist]);

  const resetAll = useCallback(async () => {
    await persist(EMPTY);
  }, [persist]);

  return {
    customIcons: settings.icons,
    customColors: settings.colors,
    setIcon,
    setColor,
    resetAll,
    loaded,
  };
}
