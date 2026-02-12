import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "evendi_custom_empty_images";

/**
 * Persists admin-customised empty state illustration overrides in AsyncStorage.
 */
export function useCustomEmptyImages() {
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setCustomImages(JSON.parse(raw));
        } catch { /* ignore */ }
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback(async (next: Record<string, string>) => {
    setCustomImages(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setImage = useCallback(
    async (key: string, uri: string | undefined) => {
      const next = { ...customImages };
      if (uri) {
        next[key] = uri;
      } else {
        delete next[key];
      }
      await persist(next);
    },
    [customImages, persist],
  );

  const resetAll = useCallback(async () => {
    setCustomImages({});
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { customImages, setImage, resetAll, loaded };
}
