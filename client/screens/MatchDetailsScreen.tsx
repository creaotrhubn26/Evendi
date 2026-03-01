import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  Easing,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { showToast } from "@/lib/toast";

const COUPLE_SESSION_KEY = "evendi_couple_session";

interface MatchDetail {
  vendor: {
    id: string;
    businessName: string;
    description: string;
    location: string;
    priceRange: string;
    yearsInBusiness: number;
    serviceArea: string;
  };
  userEvent: {
    eventType: string;
    eventCategory: string;
    guestCount: number;
    budget: { min: number; max: number };
    location: string;
    desiredVibe: string[];
  };
  matchAnalysis: {
    overallScore: number;
    eventTypeMatch: {
      score: number;
      reason: string;
    };
    budgetMatch: {
      score: number;
      reason: string;
      vendorPrice: string;
      userBudget: string;
    };
    capacityMatch: {
      score: number;
      reason: string;
      vendorCapacity: string;
      userGuestCount: number;
    };
    locationMatch: {
      score: number;
      reason: string;
      distance: string;
    };
    vibeMatch: {
      score: number;
      reason: string;
      matchedVibes: string[];
    };
    reviewScore: {
      score: number;
      count: number;
    };
  };
  recommendations: string[];
  warnings: string[];
}

export default function MatchDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();

  const { vendorId, match } = route.params || {};

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Animation shared values
  const scoreRingScale = useSharedValue(0);

  // Animate score ring on mount
  useEffect(() => {
    scoreRingScale.value = withSpring(1, { damping: 12, mass: 1 });
  }, []);

  const scoreRingAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreRingScale.value }],
  }));

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

  // Fetch match details
  const { data: details, isLoading, error } = useQuery<MatchDetail>({
    queryKey: ["/api/vendor/match-details", vendorId, coupleId],
    queryFn: async () => {
      if (!vendorId || !coupleId) return null;
      const response = await fetch(
        new URL(
          `/api/vendor/${vendorId}/match-details/${coupleId}`,
          getApiUrl()
        ).toString(),
        {
          headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
        }
      );
      if (response.ok) {
        return response.json();
      }
      throw new Error("Failed to fetch match details");
    },
    enabled: !!vendorId && !!coupleId && !!sessionToken,
  });

  // Contact vendor mutation
  const contactMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        new URL(`/api/vendor/${vendorId}/contact`, getApiUrl()).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            coupleId,
            message: `Jeg er interessert i dine tjenester for min ${details?.userEvent.eventType}`,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to contact vendor");
      return response.json();
    },
    onSuccess: () => {
      showToast("Kontaktforespørsel sendt!");
    },
    onError: () => {
      showToast("Kunne ikke sende kontaktforespørsel");
    },
  });

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        // Remove from favorites
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
        if (!response.ok) throw new Error("Failed to remove favorite");
        return response.json();
      } else {
        // Add to favorites
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
        if (!response.ok) throw new Error("Failed to add favorite");
        return response.json();
      }
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsFavorite(!isFavorite);
      showToast(
        isFavorite ? "Fjernet fra favoritter" : "Lagt til favoritter"
      );
    },
  });

  const renderScoreBar = (score: number | undefined, label: string) => {
    const value = score || 0;
    const percentage = Math.round(value);
    let barColor = theme.error;
    if (percentage >= 75) barColor = theme.success;
    else if (percentage >= 50) barColor = theme.warning;

    return (
      <View style={styles.scoreBarItem}>
        <View style={styles.scoreBarHeader}>
          <ThemedText style={styles.scoreBarLabel}>{label}</ThemedText>
          <ThemedText style={[styles.scoreBarValue, { color: barColor }]}>
            {percentage}%
          </ThemedText>
        </View>
        <View
          style={[
            styles.scoreBarBg,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View
            style={[
              styles.scoreBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
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
        <ThemedText style={styles.errorText}>Kunne ikke hente detaljer</ThemedText>
      </View>
    );
  }

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

  if (!details) return null;

  const overallScore = details.matchAnalysis.overallScore || 0;
  let scoreColor = theme.error;
  if (overallScore >= 75) scoreColor = theme.success;
  else if (overallScore >= 50) scoreColor = theme.warning;

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
          style={styles.headerButton}
          hitSlop={10}
        >
          <Feather name="chevron-left" size={24} color="#FFFFFF" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Detaljer om Match</ThemedText>
        <Pressable
          onPress={() => favoriteMutation.mutate()}
          style={styles.headerButton}
          disabled={favoriteMutation.isPending}
        >
          <Feather
            name={isFavorite ? "heart" : "heart"}
            size={24}
            color={isFavorite ? theme.error : "#FFFFFF"}
            fill={isFavorite ? theme.error : "none"}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Vendor card */}
        <View
          style={[
            styles.vendorSection,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <ThemedText style={styles.vendorName}>
            {details.vendor.businessName}
          </ThemedText>
          {details.vendor.description && (
            <ThemedText style={styles.vendorDescription}>
              {details.vendor.description}
            </ThemedText>
          )}
          <View style={styles.vendorDetailsGrid}>
            {details.vendor.location && (
              <View style={styles.vendorDetail}>
                <Feather name="map-pin" size={14} color={theme.primary} />
                <ThemedText style={styles.vendorDetailText}>
                  {details.vendor.location}
                </ThemedText>
              </View>
            )}
            {details.vendor.priceRange && (
              <View style={styles.vendorDetail}>
                <Feather name="credit-card" size={14} color={theme.primary} />
                <ThemedText style={styles.vendorDetailText}>
                  {details.vendor.priceRange}
                </ThemedText>
              </View>
            )}
            {details.vendor.yearsInBusiness > 0 && (
              <View style={styles.vendorDetail}>
                <Feather name="briefcase" size={14} color={theme.primary} />
                <ThemedText style={styles.vendorDetailText}>
                  {details.vendor.yearsInBusiness} år erfaring
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Overall score */}
        <Animated.View
          style={[
            styles.overallScoreSection,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
            },
            scoreRingAnimatedStyle,
          ]}
        >
          <View
            style={[
              styles.scoreCircle,
              {
                backgroundColor: scoreColor + "20",
                borderColor: scoreColor,
              },
            ]}
          >
            <ThemedText
              style={[styles.scoreCircleValue, { color: scoreColor }]}
            >
              {Math.round(overallScore)}%
            </ThemedText>
            <ThemedText style={styles.scoreCircleLabel}>Match</ThemedText>
          </View>
          <View style={styles.scoreContent}>
            <ThemedText style={styles.scoreTitle}>Perfekt match!</ThemedText>
            <ThemedText style={styles.scoreDescription}>
              Denne leverandøren passer godt med dine ønsker
            </ThemedText>
          </View>
        </Animated.View>

        {/* Match breakdown */}
        <View style={styles.breakdownSection}>
          <ThemedText style={styles.sectionTitle}>Detaljer om Match</ThemedText>

          {renderScoreBar(
            details.matchAnalysis.eventTypeMatch?.score,
            "Eventtype"
          )}
          {details.matchAnalysis.eventTypeMatch?.reason && (
            <ThemedText style={styles.scoreReason}>
              {details.matchAnalysis.eventTypeMatch.reason}
            </ThemedText>
          )}

          {renderScoreBar(
            details.matchAnalysis.budgetMatch?.score,
            "Budget"
          )}
          {details.matchAnalysis.budgetMatch?.reason && (
            <ThemedText style={styles.scoreReason}>
              {details.matchAnalysis.budgetMatch.reason}
            </ThemedText>
          )}

          {renderScoreBar(
            details.matchAnalysis.capacityMatch?.score,
            "Kapasitet"
          )}
          {details.matchAnalysis.capacityMatch?.reason && (
            <ThemedText style={styles.scoreReason}>
              {details.matchAnalysis.capacityMatch.reason}
            </ThemedText>
          )}

          {renderScoreBar(
            details.matchAnalysis.locationMatch?.score,
            "Lokasjon"
          )}
          {details.matchAnalysis.locationMatch?.reason && (
            <ThemedText style={styles.scoreReason}>
              {details.matchAnalysis.locationMatch.reason}
            </ThemedText>
          )}

          {renderScoreBar(
            details.matchAnalysis.vibeMatch?.score,
            "Følelse"
          )}
          {details.matchAnalysis.vibeMatch?.reason && (
            <ThemedText style={styles.scoreReason}>
              {details.matchAnalysis.vibeMatch.reason}
            </ThemedText>
          )}

          {details.matchAnalysis.reviewScore?.score !== undefined && (
            <>
              {renderScoreBar(
                details.matchAnalysis.reviewScore.score,
                "Vurderinger"
              )}
              <ThemedText style={styles.scoreReason}>
                {details.matchAnalysis.reviewScore.count} vurderinger
              </ThemedText>
            </>
          )}
        </View>

        {/* Recommendations */}
        {details.recommendations && details.recommendations.length > 0 && (
          <View
            style={[
              styles.section,
              { backgroundColor: theme.success + "10" },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Feather name="thumbs-up" size={18} color={theme.success} />
              <ThemedText style={styles.sectionTitle}>Anbefalinger</ThemedText>
            </View>
            {details.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Feather name="check" size={16} color={theme.success} />
                <ThemedText style={styles.recommendationText}>{rec}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Warnings */}
        {details.warnings && details.warnings.length > 0 && (
          <View
            style={[
              styles.section,
              { backgroundColor: theme.warning + "10" },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Feather name="alert-triangle" size={18} color={theme.warning} />
              <ThemedText style={styles.sectionTitle}>Merknader</ThemedText>
            </View>
            {details.warnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <Feather name="info" size={16} color={theme.warning} />
                <ThemedText style={styles.warningText}>{warning}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Event details comparison */}
        <View style={styles.comparisonSection}>
          <ThemedText style={styles.sectionTitle}>Din Begivenhet</ThemedText>
          <View
            style={[
              styles.comparisonBox,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <View style={styles.comparisonRow}>
              <ThemedText style={styles.comparisonLabel}>Type:</ThemedText>
              <ThemedText style={styles.comparisonValue}>
                {details.userEvent.eventType}
              </ThemedText>
            </View>
            <View style={styles.comparisonRow}>
              <ThemedText style={styles.comparisonLabel}>Kategori:</ThemedText>
              <ThemedText style={styles.comparisonValue}>
                {details.userEvent.eventCategory}
              </ThemedText>
            </View>
            <View style={styles.comparisonRow}>
              <ThemedText style={styles.comparisonLabel}>Gjester:</ThemedText>
              <ThemedText style={styles.comparisonValue}>
                {details.userEvent.guestCount}
              </ThemedText>
            </View>
            <View style={styles.comparisonRow}>
              <ThemedText style={styles.comparisonLabel}>Budget:</ThemedText>
              <ThemedText style={styles.comparisonValue}>
                {details.userEvent.budget.min} - {details.userEvent.budget.max} kr
              </ThemedText>
            </View>
            <View style={styles.comparisonRow}>
              <ThemedText style={styles.comparisonLabel}>Lokasjon:</ThemedText>
              <ThemedText style={styles.comparisonValue}>
                {details.userEvent.location}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Spacing */}
        <View style={{ height: Spacing.lg }} />
      </ScrollView>

      {/* Action buttons */}
      <View
        style={[
          styles.actionBar,
          { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <Pressable
          style={[styles.actionButton, styles.secondaryButton, { borderColor: theme.primary }]}
          onPress={() => (navigation as any).navigate("ReviewsList", { vendorId, vendorName: details?.vendor.businessName })}
        >
          <Feather name="star" size={16} color={theme.primary} />
          <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>
            Anmeldelser
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.secondaryButton, { borderColor: theme.primary }]}
          onPress={() => (navigation as any).navigate("Conversation", { conversationId: "new", vendorName: details?.vendor.businessName })}
        >
          <Feather name="message-circle" size={16} color={theme.primary} />
          <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>
            Melding
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => contactMutation.mutate()}
          disabled={contactMutation.isPending}
        >
          {contactMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Feather name="mail" size={16} color="white" />
              <ThemedText style={[styles.actionButtonText, { color: "white" }]}>
                Kontakt
              </ThemedText>
            </>
          )}
        </Pressable>
      </View>
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.md,
  },
  vendorSection: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  vendorDescription: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  vendorDetailsGrid: {
    gap: Spacing.md,
  },
  vendorDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  vendorDetailText: {
    fontSize: 13,
    flex: 1,
  },
  overallScoreSection: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreCircleValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  scoreCircleLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  scoreContent: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  scoreDescription: {
    fontSize: 13,
  },
  breakdownSection: {
    marginBottom: Spacing.lg,
  },
  scoreBarItem: {
    marginBottom: Spacing.lg,
  },
  scoreBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  scoreBarLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  scoreBarValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  scoreBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  scoreReason: {
    fontSize: 12,
    marginBottom: Spacing.md,
    marginTop: -Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  section: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  recommendationText: {
    fontSize: 13,
    flex: 1,
  },
  warningItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  warningText: {
    fontSize: 13,
    flex: 1,
  },
  comparisonSection: {
    marginBottom: Spacing.lg,
  },
  comparisonBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  comparisonLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  comparisonValue: {
    fontSize: 13,
  },
  actionBar: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  secondaryButton: {
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    marginTop: Spacing.md,
  },
});
