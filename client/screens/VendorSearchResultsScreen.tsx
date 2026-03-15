import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { showToast } from "@/lib/toast";

const COUPLE_SESSION_KEY = "evendi_couple_session";
const SORT_FILTER_KEY = "vendor_search_sort_filter";

interface VendorMatch {
  vendor: {
    id: string;
    businessName: string;
    description: string;
    location: string;
    priceRange: string;
    imageUrl: string;
    status: string;
  };
  overallScore: number;
  eventTypeMatch: number;
  budgetMatch: number;
  capacityMatch: number;
  locationMatch: number;
  vibeMatch: number;
  reviewScore: number;
  matchReasons: string[];
  warnings: string[];
}

export default function VendorSearchResultsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "rating" | "price">("score");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filterAvailability, setFilterAvailability] = useState(false);
  const [eventDate, setEventDate] = useState<string | null>(null);

  // Save sort/filter preferences
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await AsyncStorage.setItem(
          SORT_FILTER_KEY,
          JSON.stringify({
            sortBy,
            filterAvailability,
          })
        );
      } catch (error) {
        console.error("Error saving preferences:", error);
      }
    };
    savePreferences();
  }, [sortBy, filterAvailability]);

  // Load couple session and preferences
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem(COUPLE_SESSION_KEY);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          setSessionToken(session.sessionToken);
          setCoupleId(session.coupleId);
        }

        // Load sort/filter preferences
        const savedPrefs = await AsyncStorage.getItem(SORT_FILTER_KEY);
        if (savedPrefs) {
          const prefs = JSON.parse(savedPrefs);
          setSortBy(prefs.sortBy || "score");
          setFilterAvailability(prefs.filterAvailability || false);
        }
      } catch (error) {
        console.error("Error loading session:", error);
      }
    };
    loadSession();
  }, []);

  // Fetch vendor matches
  const { data: matches = [], isLoading, error } = useQuery<VendorMatch[]>({
    queryKey: ["/api/user/vendor-matches", coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const params = new URLSearchParams({
        userId: coupleId,
        limit: "50",
      });
      const response = await fetch(
        new URL(
          `/api/user/vendor-matches?${params.toString()}`,
          getApiUrl()
        ).toString(),
        {
          headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    },
    enabled: !!coupleId && !!sessionToken,
  });

  // Fetch favorites
  useQuery({
    queryKey: ["/api/couple/favorites", coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const response = await fetch(
        new URL(
          `/api/couple/${coupleId}/favorites`,
          getApiUrl()
        ).toString(),
        {
          headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
        }
      );
      if (response.ok) {
        const data = await response.json();
        const favoriteIds = new Set<string>((data.favorites || []).map((f: any) => String(f.vendorId)));
        setFavorites(favoriteIds);
      }
    },
    enabled: !!coupleId && !!sessionToken,
  });

  // Fetch couple preferences (event date)
  useQuery({
    queryKey: ["/api/couple/preferences", coupleId],
    queryFn: async () => {
      if (!coupleId) return null;
      const response = await fetch(
        new URL(
          `/api/couple/preferences/${coupleId}`,
          getApiUrl()
        ).toString(),
        {
          headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.eventDate) {
          setEventDate(data.eventDate);
        }
      }
    },
    enabled: !!coupleId && !!sessionToken,
  });

  // Add to favorites mutation
  const addToFavoriteMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      if (!coupleId) throw new Error("No couple ID");
      const response = await fetch(
        new URL(
          `/api/couple/${coupleId}/favorites/add`,
          getApiUrl()
        ).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ vendorId }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Could not add favorite");
      }
      return response.json();
    },
    onSuccess: (data, vendorId) => {
      if (data?.success !== false) {
        setFavorites((prev) => new Set([...prev, vendorId]));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Lagt til favoritter");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Kunne ikke legge til favoritt"
      );
    },
  });

  // Remove from favorites mutation
  const removeFromFavoriteMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      if (!coupleId) throw new Error("No couple ID");
      const response = await fetch(
        new URL(
          `/api/couple/${coupleId}/favorites/${vendorId}`,
          getApiUrl()
        ).toString(),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Could not remove favorite");
      }
      return response.json();
    },
    onSuccess: (data, vendorId) => {
      if (data?.success !== false) {
        setFavorites((prev) => {
          const updated = new Set(prev);
          updated.delete(vendorId);
          return updated;
        });
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast("Fjernet fra favoritter");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Kunne ikke fjerne favoritt"
      );
    },
  });

  const handleToggleFavorite = (vendorId: string) => {
    const isFavorite = favorites.has(vendorId);
    if (isFavorite) {
      removeFromFavoriteMutation.mutate(vendorId);
    } else {
      addToFavoriteMutation.mutate(vendorId);
    }
  };

  // Sort matches
  const sortedMatches = [...matches].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return (b.reviewScore || 0) - (a.reviewScore || 0);
      case "price": {
        const aStart = Number((a.vendor.priceRange?.split("-")[0] ?? "0").replace(/[^0-9.]/g, ""));
        const bStart = Number((b.vendor.priceRange?.split("-")[0] ?? "0").replace(/[^0-9.]/g, ""));
        return aStart - bStart;
      }
      case "score":
      default:
        return (b.overallScore || 0) - (a.overallScore || 0);
    }
  });

  // Apply availability filter if enabled
  const filteredMatches = sortedMatches.filter((match) => {
    if (!filterAvailability) return true;
    // If availability filter is on but no event date, show all
    if (!eventDate) return true;
    const hasUnavailableWarning = (match.warnings || []).some((warning) =>
      /ikke tilgjengelig|unavailable|opptatt/i.test(warning)
    );
    return !hasUnavailableWarning;
  });

  const handleVendorPress = (vendor: VendorMatch) => {
    (navigation as any).navigate("VendorMatchDetails", {
      vendorId: vendor.vendor.id,
      match: vendor,
    });
  };

  const renderMatchScore = (score: number | undefined) => {
    const value = score || 0;
    const percentage = Math.round(value);
    let color = theme.error;
    if (percentage >= 75) color = theme.success;
    else if (percentage >= 50) color = theme.warning;
    return { percentage, color };
  };

  const renderScoreRing = (score: number | undefined) => {
    const { percentage, color } = renderMatchScore(score);
    return (
      <View
        style={[
          styles.scoreRing,
          {
            backgroundColor: color + "20",
            borderColor: color,
          },
        ]}
      >
        <ThemedText style={[styles.scoreText, { color }]}>
          {percentage}%
        </ThemedText>
      </View>
    );
  };

  const renderVendorCard = ({ item }: { item: VendorMatch }) => {
    const isFavorite = favorites.has(item.vendor.id);

    return (
      <View
        style={[
          styles.vendorCard,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
        ]}
      >
        {/* Header with image and score */}
        <Pressable
          style={styles.cardHeaderPressable}
          onPress={() => handleVendorPress(item)}
        >
          <View style={styles.cardHeader}>
            {item.vendor.imageUrl && (
              <Image
                source={{ uri: item.vendor.imageUrl }}
                style={styles.vendorImage}
              />
            )}
            <View style={styles.scoreOverlay}>{renderScoreRing(item.overallScore)}</View>
            <Pressable
              style={[
                styles.favoriteButton,
                {
                  backgroundColor: isFavorite
                    ? theme.error
                    : theme.backgroundDefault,
                },
              ]}
              onPress={() => handleToggleFavorite(item.vendor.id)}
              hitSlop={10}
            >
              <Feather
                name="heart"
                size={18}
                color={isFavorite ? "#FFFFFF" : theme.textSecondary}
                fill={isFavorite ? "#FFFFFF" : "none"}
              />
            </Pressable>
          </View>
        </Pressable>

        {/* Vendor info */}
        <Pressable onPress={() => handleVendorPress(item)}>
          <View style={styles.vendorInfo}>
            <ThemedText style={styles.vendorName} numberOfLines={1}>
              {item.vendor.businessName}
            </ThemedText>
            {item.vendor.location && (
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={14} color={theme.textSecondary} />
                <ThemedText style={styles.locationText}>
                  {item.vendor.location}
                </ThemedText>
              </View>
            )}
            {item.vendor.priceRange && (
              <ThemedText style={styles.priceText}>{item.vendor.priceRange}</ThemedText>
            )}
          </View>

        {/* Match reasons */}
        {item.matchReasons && item.matchReasons.length > 0 && (
          <View style={styles.reasonsSection}>
            <ThemedText style={styles.reasonsLabel}>Hvorfor pass:</ThemedText>
            {item.matchReasons.slice(0, 2).map((reason, index) => (
              <View key={index} style={styles.reasonItem}>
                <Feather name="check" size={14} color={theme.success} />
                <ThemedText style={styles.reasonText}>{reason}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Match breakdown */}
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownItem}>
            <ThemedText style={styles.breakdownLabel}>Type</ThemedText>
            <ThemedText style={styles.breakdownValue}>
              {Math.round(item.eventTypeMatch || 0)}%
            </ThemedText>
          </View>
          <View style={styles.breakdownItem}>
            <ThemedText style={styles.breakdownLabel}>Budget</ThemedText>
            <ThemedText style={styles.breakdownValue}>
              {Math.round(item.budgetMatch || 0)}%
            </ThemedText>
          </View>
          <View style={styles.breakdownItem}>
            <ThemedText style={styles.breakdownLabel}>Kapasitet</ThemedText>
            <ThemedText style={styles.breakdownValue}>
              {Math.round(item.capacityMatch || 0)}%
            </ThemedText>
          </View>
          <View style={styles.breakdownItem}>
            <ThemedText style={styles.breakdownLabel}>Lokasjon</ThemedText>
            <ThemedText style={styles.breakdownValue}>
              {Math.round(item.locationMatch || 0)}%
            </ThemedText>
          </View>
        </View>

        {/* Action button */}
        <Pressable
          style={[styles.detailsButton, { backgroundColor: theme.primary }]}
          onPress={() => handleVendorPress(item)}
        >
          <ThemedText style={styles.detailsButtonText}>Se Detaljer</ThemedText>
          <Feather name="chevron-right" size={18} color="#FFFFFF" />
        </Pressable>
        </Pressable>
      </View>
    );
  };

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background },
          styles.centerContent,
        ]}
      >
        <Feather name="alert-circle" size={48} color={theme.error} />
        <ThemedText style={styles.errorText}>Kunne ikke hente resultater</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.md, backgroundColor: theme.primary },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={10}
        >
          <Feather name="chevron-left" size={24} color="#FFFFFF" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Matchende Leverandører</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Sort and filter options */}
      <View style={[styles.sortBar, { backgroundColor: theme.backgroundDefault }]}> 
        <View style={styles.sortButtonsRow}>
          <Pressable
            style={[
              styles.sortButton,
              {
                backgroundColor: sortBy === "score" ? theme.primary : "transparent",
              },
            ]}
            onPress={() => setSortBy("score")}
          >
            <ThemedText
              style={[
                styles.sortButtonText,
                {
                  color: sortBy === "score" ? "#FFFFFF" : theme.text,
                },
              ]}
            >
              Match
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.sortButton,
              {
                backgroundColor: sortBy === "rating" ? theme.primary : "transparent",
              },
            ]}
            onPress={() => setSortBy("rating")}
          >
            <ThemedText
              style={[
                styles.sortButtonText,
                {
                  color: sortBy === "rating" ? "#FFFFFF" : theme.text,
                },
              ]}
            >
              Vurdering
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.sortButton,
              {
                backgroundColor: sortBy === "price" ? theme.primary : "transparent",
              },
            ]}
            onPress={() => setSortBy("price")}
          >
            <ThemedText
              style={[
                styles.sortButtonText,
                {
                  color: sortBy === "price" ? "#FFFFFF" : theme.text,
                },
              ]}
            >
              Pris
            </ThemedText>
          </Pressable>
        </View>

        {/* Availability filter button */}
        <Pressable
          style={[
            styles.filterButton,
            {
              backgroundColor: filterAvailability ? theme.primary : "transparent",
              borderColor: theme.primary,
            },
          ]}
          onPress={() => setFilterAvailability(!filterAvailability)}
        >
          <Feather
            name="calendar"
            size={16}
            color={filterAvailability ? "#FFFFFF" : theme.primary}
          />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredMatches.length === 0 ? (
        <View style={[styles.container, styles.centerContent]}>
          <Feather name="inbox" size={48} color={theme.textSecondary} />
          <ThemedText style={styles.emptyText}>
            {filterAvailability ? "Ingen ledige leverandører for denne datoen" : "Ingen matchende leverandører"}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          renderItem={renderVendorCard}
          keyExtractor={(item) => item.vendor.id}
          contentContainerStyle={styles.listContent}
          scrollIndicatorInsets={{ right: 1 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  headerSpacer: {
    width: 40,
  },
  sortBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    alignItems: "center",
  },
  sortButtonsRow: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sortButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  vendorCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  cardHeaderPressable: {
    width: "100%",
  },
  cardHeader: {
    position: "relative",
    height: 140,
    backgroundColor: "#f0f0f0",
  },
  vendorImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  scoreOverlay: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreOverlayText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  favoriteButton: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  vendorInfo: {
    padding: Spacing.md,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  locationText: {
    fontSize: 13,
    flex: 1,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  reasonsSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  reasonsLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  reasonText: {
    fontSize: 12,
    flex: 1,
  },
  breakdownGrid: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  breakdownItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#f5f5f5",
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  scoreRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 16,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    marginTop: Spacing.md,
  },
});
