import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { showToast } from "@/lib/toast";

const COUPLE_SESSION_KEY = "evendi_couple_session";

interface FavoriteVendor {
  vendorId: string;
  vendorName: string;
  vendorDescription?: string;
  vendorLocation?: string;
  vendorPriceRange?: string;
  vendorCategory: string;
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
}

const { width } = Dimensions.get("window");

export default function VendorShortlistScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());

  // Load couple session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem(COUPLE_SESSION_KEY);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          setSessionToken(session.sessionToken);
          setCoupleId(session.coupleId);
        }
      } catch (error) {
        console.error("Error loading couple session:", error);
      }
    };
    loadSession();
  }, []);

  // Fetch favorite vendors
  const { data: favorites = [], isLoading } = useQuery<FavoriteVendor[]>({
    queryKey: ["/api/couple/favorites", coupleId],
    queryFn: async () => {
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
        return data.data || [];
      }
      return [];
    },
    enabled: !!coupleId && !!sessionToken,
  });

  // Remove from favorites mutation
  const removeMutation = useMutation({
    mutationFn: async (vendorId: string) => {
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
        throw new Error(error.error || "Kunne ikke fjerne fra favoritter");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/couple/favorites", coupleId],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Fjernet fra favoritter");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Feil ved fjerning"
      );
    },
  });

  const handleToggleSelect = (vendorId: string) => {
    const newSelected = new Set(selectedVendors);
    if (newSelected.has(vendorId)) {
      newSelected.delete(vendorId);
    } else {
      if (newSelected.size >= 3) {
        showToast("Du kan velge maksimalt 3 leverandører for sammenligning");
        return;
      }
      newSelected.add(vendorId);
    }
    setSelectedVendors(newSelected);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemove = (vendorId: string, vendorName: string) => {
    Alert.alert(
      "Fjern fra favoritter?",
      `Vil du fjerne ${vendorName} fra dine favoritter?`,
      [
        { text: "Avbryt", onPress: () => {}, style: "cancel" },
        {
          text: "Fjern",
          onPress: () => {
            removeMutation.mutate(vendorId);
            setSelectedVendors((prev) => {
              const newSet = new Set(prev);
              newSet.delete(vendorId);
              return newSet;
            });
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleCompare = () => {
    if (selectedVendors.size < 2) {
      showToast("Velg minst 2 leverandører for sammenligning");
      return;
    }

    const vendorsToCompare = favorites.filter((v) =>
      selectedVendors.has(v.vendorId)
    );

    (navigation as any).navigate("VendorComparison", {
      vendors: vendorsToCompare,
    });
  };

  const handleViewDetails = (vendor: FavoriteVendor) => {
    (navigation as any).navigate("VendorMatchDetails", {
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      vendorDescription: vendor.vendorDescription,
      vendorLocation: vendor.vendorLocation,
      vendorPriceRange: vendor.vendorPriceRange,
      vendorCategory: vendor.vendorCategory,
    });
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background },
          styles.centerContent,
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
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
        <ThemedText style={styles.headerTitle}>Favoritter ({favorites.length})</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="heart" size={48} color={theme.textSecondary} />
          <ThemedText style={styles.emptyStateTitle}>Ingen favoritter ennå</ThemedText>
          <ThemedText style={styles.emptyStateDescription}>
            Legg til leverandører i favoritter fra søkeresultater eller matchdetaljer
          </ThemedText>
          <Pressable
            style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText style={styles.emptyStateButtonText}>Tilbake</ThemedText>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Selection Info */}
          {selectedVendors.size > 0 && (
            <View
              style={[
                styles.selectionInfo,
                { backgroundColor: theme.primary + "10", borderColor: theme.primary },
              ]}
            >
              <Feather name="info" size={16} color={theme.primary} />
              <ThemedText style={styles.selectionInfoText}>
                {selectedVendors.size} valgt • {3 - selectedVendors.size} igjen
              </ThemedText>
            </View>
          )}

          <FlatList
            data={favorites}
            keyExtractor={(item) => item.vendorId}
            contentContainerStyle={styles.listContent}
            scrollIndicatorInsets={{ right: 1 }}
            renderItem={({ item: vendor }) => {
              const isSelected = selectedVendors.has(vendor.vendorId);
              return (
                <Pressable
                  style={[
                    styles.vendorCard,
                    {
                      maxWidth: width - Spacing.lg * 2,
                      backgroundColor: theme.backgroundDefault,
                      borderColor: isSelected ? theme.primary : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleToggleSelect(vendor.vendorId)}
                >
                  {/* Checkbox */}
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isSelected ? theme.primary : theme.border,
                        backgroundColor: isSelected ? theme.primary : "transparent",
                      },
                    ]}
                  >
                    {isSelected && (
                      <Feather name="check" size={14} color="white" />
                    )}
                  </View>

                  {/* Content */}
                  <View style={styles.vendorContent}>
                    <ThemedText style={styles.vendorName}>
                      {vendor.vendorName}
                    </ThemedText>

                    {vendor.vendorDescription && (
                      <ThemedText
                        style={styles.vendorDescription}
                        numberOfLines={1}
                      >
                        {vendor.vendorDescription}
                      </ThemedText>
                    )}

                    <View style={styles.vendorMeta}>
                      {vendor.vendorLocation && (
                        <View style={styles.metaItem}>
                          <Feather
                            name="map-pin"
                            size={12}
                            color={theme.textSecondary}
                          />
                          <ThemedText style={styles.metaText}>
                            {vendor.vendorLocation}
                          </ThemedText>
                        </View>
                      )}

                      {vendor.vendorPriceRange && (
                        <View style={styles.metaItem}>
                          <Feather
                            name="dollar-sign"
                            size={12}
                            color={theme.textSecondary}
                          />
                          <ThemedText style={styles.metaText}>
                            {vendor.vendorPriceRange}
                          </ThemedText>
                        </View>
                      )}

                      {vendor.averageRating !== undefined && (
                        <View style={styles.metaItem}>
                          <Feather
                            name="star"
                            size={12}
                            color={theme.warning}
                          />
                          <ThemedText style={styles.metaText}>
                            {vendor.averageRating.toFixed(1)} ({vendor.reviewCount || 0})
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.vendorActions}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handleViewDetails(vendor)}
                      hitSlop={8}
                    >
                      <Feather
                        name="external-link"
                        size={18}
                        color={theme.primary}
                      />
                    </Pressable>

                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handleRemove(vendor.vendorId, vendor.vendorName)}
                      hitSlop={8}
                    >
                      <Feather
                        name="trash-2"
                        size={18}
                        color={theme.error}
                      />
                    </Pressable>
                  </View>
                </Pressable>
              );
            }}
          />
        </>
      )}

      {/* Comparison Button */}
      {favorites.length > 0 && selectedVendors.size >= 2 && (
        <View
          style={[
            styles.actionBar,
            { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.md },
          ]}
        >
          <Pressable
            style={[styles.compareButton, { backgroundColor: theme.primary }]}
            onPress={handleCompare}
          >
            <Feather name="git-branch" size={18} color="white" />
            <ThemedText style={styles.compareButtonText}>
              Sammenlign ({selectedVendors.size})
            </ThemedText>
          </Pressable>
        </View>
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  emptyStateButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyStateButtonText: {
    color: "white",
    fontWeight: "600",
  },
  selectionInfo: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  selectionInfoText: {
    fontSize: 13,
    fontWeight: "500",
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.md,
  },
  vendorCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 24,
  },
  vendorContent: {
    flex: 1,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  vendorDescription: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  vendorMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  vendorActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  compareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  compareButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
});
