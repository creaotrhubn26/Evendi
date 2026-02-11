import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";

const COUPLE_STORAGE_KEY = "evendi_couple_session";

export interface VendorSuggestion {
  id: string;
  businessName: string;
  categoryId: string | null;
  description: string | null;
  location: string | null;
  priceRange: string | null;
  imageUrl: string | null;
  matchScore?: number;
  matchReasons?: string[];
}

interface UseVendorSearchOptions {
  /** The vendor category to filter by (e.g., "florist", "catering", "beauty"). If omitted, searches all categories. */
  category?: string;
  /** Minimum characters before triggering search */
  minChars?: number;
  /** Debounce delay in ms */
  debounceMs?: number;
}

/**
 * Hook that searches registered vendors by name within a category.
 * Couples type a vendor name and get autocomplete suggestions from the system.
 */
export function useVendorSearch({
  category,
  minChars = 2,
  debounceMs = 300,
}: UseVendorSearchOptions) {
  const [searchText, setSearchText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorSuggestion | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load couple session token
  useEffect(() => {
    (async () => {
      try {
        const sessionData = await AsyncStorage.getItem(COUPLE_STORAGE_KEY);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          setSessionToken(session.sessionToken);
        }
      } catch {
        // Ignore
      }
    })();
  }, []);

  // Debounce the search text
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedText(searchText);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchText, debounceMs]);

  const shouldSearch = debouncedText.length >= minChars && !selectedVendor;

  const { data: suggestions = [], isLoading } = useQuery<VendorSuggestion[]>({
    queryKey: ["/api/vendors/matching", "search", category, debouncedText],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      params.append("search", debouncedText);

      const response = await fetch(
        new URL(`/api/vendors/matching?${params.toString()}`, getApiUrl()).toString()
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((v: VendorSuggestion) => ({
        id: v.id,
        businessName: v.businessName,
        categoryId: v.categoryId,
        description: v.description,
        location: v.location,
        priceRange: v.priceRange,
        imageUrl: v.imageUrl,
        matchScore: v.matchScore,
        matchReasons: v.matchReasons,
      }));
    },
    enabled: shouldSearch,
    staleTime: 30_000,
  });

  /** Called when the user types into the vendor name field */
  const onChangeText = useCallback(
    (text: string) => {
      setSearchText(text);
      // If the user edits after selecting, clear the selection
      if (selectedVendor && text !== selectedVendor.businessName) {
        setSelectedVendor(null);
      }
    },
    [selectedVendor]
  );

  /** Called when the user picks a vendor from the suggestion list */
  const onSelectVendor = useCallback((vendor: VendorSuggestion) => {
    setSelectedVendor(vendor);
    setSearchText(vendor.businessName);
  }, []);

  /** Clear the selection */
  const clearSelection = useCallback(() => {
    setSelectedVendor(null);
    setSearchText("");
  }, []);

  return {
    /** Current text value for the TextInput */
    searchText,
    /** Bind this to TextInput onChangeText */
    onChangeText,
    /** List of matching vendors (empty when nothing typed or vendor selected) */
    suggestions: shouldSearch ? suggestions : [],
    /** Whether the search query is loading */
    isLoading: shouldSearch && isLoading,
    /** The vendor the user picked from suggestions (null if freeform text) */
    selectedVendor,
    /** Call when user taps a suggestion */
    onSelectVendor,
    /** Clear everything */
    clearSelection,
    /** Set text programmatically (e.g., when editing an existing appointment) */
    setSearchText,
    /** Set a pre-selected vendor (e.g., when loading saved data) */
    setSelectedVendor,
  };
}
