/**
 * useAppSettings — Shared hook giving any screen access to all public app settings.
 * Uses the same query key as useDesignSettings so a single fetch covers both.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";

interface RawSetting {
  key: string;
  value: string;
}

export function useAppSettings() {
  const { data: rawSettings, isLoading } = useQuery<RawSetting[]>({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const url = new URL("/api/app-settings", getApiUrl());
      const res = await fetch(url.toString());
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const settingsMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (rawSettings && Array.isArray(rawSettings)) {
      rawSettings.forEach((s) => {
        map[s.key] = s.value;
      });
    }
    return map;
  }, [rawSettings]);

  /** Get a setting value by key, with optional fallback. */
  const getSetting = (key: string, fallback = ""): string =>
    settingsMap[key] ?? fallback;

  return { getSetting, settingsMap, isLoading };
}
