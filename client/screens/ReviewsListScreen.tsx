import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

const COUPLE_SESSION_KEY = "evendi_couple_session";

interface Review {
  id: string;
  vendorId: string;
  coupleId: string;
  rating: number;
  title: string;
  description: string;
  createdAt: string;
  coupleName?: string;
}

interface ReviewStats {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function ReviewsListScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();

  const { vendorId, vendorName } = route.params || {};

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "helpful" | "rating">("recent");

  // Load couple session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem(COUPLE_SESSION_KEY);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          setSessionToken(session.sessionToken);
        }
      } catch (error) {
        console.error("Error loading couple session:", error);
      }
    };
    loadSession();
  }, []);

  // Fetch reviews
  const { data: reviews = [], isLoading, error } = useQuery<Review[]>({
    queryKey: ["/api/vendor/reviews", vendorId],
    queryFn: async () => {
      const response = await fetch(
        new URL(
          `/api/vendor/${vendorId}/reviews`,
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
  });

  // Fetch review stats
  const { data: stats } = useQuery<ReviewStats>({
    queryKey: ["/api/vendor/review-stats", vendorId],
    queryFn: async () => {
      const response = await fetch(
        new URL(
          `/api/vendor/${vendorId}/review-stats`,
          getApiUrl()
        ).toString(),
        {
          headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
        }
      );

      if (response.ok) {
        return response.json();
      }
      return { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    },
  });

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "recent":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsDisplay}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Feather
            key={star}
            name="star"
            size={14}
            color={star <= rating ? theme.warning : theme.textSecondary}
            fill={star <= rating ? theme.warning : "none"}
          />
        ))}
      </View>
    );
  };

  const renderReview = ({ item }: { item: Review }) => {
    const date = new Date(item.createdAt);
    const formattedDate = date.toLocaleDateString("no-NO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return (
      <View
        style={[
          styles.reviewCard,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
        ]}
      >
        {/* Header */}
        <View style={styles.reviewHeader}>
          <View style={styles.reviewMeta}>
            <View style={styles.ratingBadge}>
              {renderStars(item.rating)}
              <ThemedText style={styles.ratingValue}>{item.rating}</ThemedText>
            </View>
            <View style={styles.reviewInfo}>
              <ThemedText style={styles.reviewDate}>{formattedDate}</ThemedText>
            </View>
          </View>
        </View>

        {/* Title */}
        <ThemedText style={styles.reviewTitle}>{item.title}</ThemedText>

        {/* Description */}
        <ThemedText style={styles.reviewDescription} numberOfLines={4}>
          {item.description}
        </ThemedText>

        {/* Footer */}
        <View style={styles.reviewFooter}>
          <Pressable style={styles.helpfulButton}>
            <Feather name="thumbs-up" size={14} color={theme.primary} />
            <ThemedText style={[styles.helpfulText, { color: theme.primary }]}>
              Nyttig
            </ThemedText>
          </Pressable>
          <Pressable style={styles.helpfulButton}>
            <Feather name="flag" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.helpfulText, { color: theme.textSecondary }]}>
              Rapporter
            </ThemedText>
          </Pressable>
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
        <ThemedText style={styles.errorText}>Kunne ikke hente anmeldelser</ThemedText>
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
          <Feather name="chevron-left" size={24} color={"#FFFFFF"} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Anmeldelser</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats Section */}
      {stats && (
        <View
          style={[
            styles.statsSection,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <View style={styles.overallScore}>
            <ThemedText style={styles.scoreValue}>{stats.average.toFixed(1)}</ThemedText>
            {renderStars(Math.round(stats.average))}
            <ThemedText style={styles.scoreCount}>
              ({stats.total} {stats.total === 1 ? "anmeldelse" : "anmeldelser"})
            </ThemedText>
          </View>

          {/* Rating Distribution */}
          <View style={styles.distributionContainer}>
            {[5, 4, 3, 2, 1].map((rating) => (
              <View key={rating} style={styles.distributionRow}>
                <ThemedText style={styles.distributionLabel}>{rating}★</ThemedText>
                <View
                  style={[
                    styles.distributionBar,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <View
                    style={[
                      styles.distributionFill,
                      {
                        width: `${stats.total > 0 ? ((stats.distribution[rating as keyof typeof stats.distribution] || 0) / stats.total) * 100 : 0}%`,
                        backgroundColor: theme.primary,
                      },
                    ]}
                  />
                </View>
                <ThemedText style={styles.distributionCount}>
                  {stats.distribution[rating as keyof typeof stats.distribution] || 0}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Sort Options */}
      <View style={[styles.sortBar, { backgroundColor: theme.backgroundDefault }]}>
        <Pressable
          style={[
            styles.sortButton,
            {
              backgroundColor: sortBy === "recent" ? theme.primary : "transparent",
            },
          ]}
          onPress={() => setSortBy("recent")}
        >
          <ThemedText
            style={[
              styles.sortButtonText,
              {
                color: sortBy === "recent" ? "#FFFFFF" : theme.text,
              },
            ]}
          >
            Nyeste
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
            Høyeste vurdering
          </ThemedText>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : sortedReviews.length === 0 ? (
        <View style={[styles.container, styles.centerContent]}>
          <Feather name="inbox" size={48} color={theme.textSecondary} />
          <ThemedText style={styles.emptyText}>Ingen anmeldelser ennå</ThemedText>
        </View>
      ) : (
        <FlatList
          data={sortedReviews}
          renderItem={renderReview}
          keyExtractor={(item) => item.id}
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
  statsSection: {
    borderBottomWidth: 1,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  overallScore: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  starsDisplay: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  scoreCount: {
    fontSize: 12,
  },
  distributionContainer: {
    gap: Spacing.sm,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  distributionLabel: {
    width: 30,
    fontSize: 12,
    fontWeight: "600",
  },
  distributionBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  distributionFill: {
    height: "100%",
    borderRadius: 4,
  },
  distributionCount: {
    width: 30,
    fontSize: 12,
    textAlign: "right",
  },
  sortBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
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
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  reviewHeader: {
    marginBottom: Spacing.md,
  },
  reviewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  ratingBadge: {
    alignItems: "center",
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  reviewDescription: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  reviewFooter: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  helpfulButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  helpfulText: {
    fontSize: 12,
    fontWeight: "500",
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
