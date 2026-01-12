import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface VendorReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isAnonymous: boolean;
  createdAt: string;
  coupleName: string;
  vendorResponse: {
    id: string;
    body: string;
    createdAt: string;
  } | null;
}

interface VendorReviewsResponse {
  reviews: VendorReview[];
  googleReviewUrl: string | null;
  stats: {
    count: number;
    average: number;
  };
}

export default function VendorDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const { vendorId, vendorName, vendorDescription, vendorLocation, vendorPriceRange, vendorCategory } = route.params || {};

  const { data, isLoading, error } = useQuery<VendorReviewsResponse>({
    queryKey: [`/api/vendors/${vendorId}/reviews`],
    enabled: !!vendorId,
  });

  const handleOpenGoogle = async () => {
    if (!data?.googleReviewUrl) return;
    try {
      await Linking.openURL(data.googleReviewUrl);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Alert.alert("Kunne ikke åpne", "Vennligst prøv igjen senere");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      photographer: "Fotograf",
      videographer: "Videograf",
      dj: "DJ",
      florist: "Blomsterhandler",
      caterer: "Catering",
      venue: "Lokale",
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: string): keyof typeof Feather.glyphMap => {
    const icons: Record<string, keyof typeof Feather.glyphMap> = {
      photographer: "camera",
      videographer: "video",
      dj: "music",
      florist: "sun",
      caterer: "coffee",
      venue: "home",
    };
    return icons[category] || "briefcase";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <Card style={styles.headerCard}>
        <View style={[styles.vendorImage, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name={getCategoryIcon(vendorCategory)} size={32} color={theme.accent} />
        </View>
        <ThemedText style={Typography.h2}>{vendorName}</ThemedText>
        <View style={styles.categoryRow}>
          <Feather name="tag" size={14} color={theme.textSecondary} />
          <ThemedText style={[Typography.small, { color: theme.textSecondary, marginLeft: Spacing.xs }]}>
            {getCategoryLabel(vendorCategory)}
          </ThemedText>
        </View>
        {vendorLocation ? (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={theme.textSecondary} />
            <ThemedText style={[Typography.small, { color: theme.textSecondary, marginLeft: Spacing.xs }]}>
              {vendorLocation}
            </ThemedText>
          </View>
        ) : null}
        {vendorDescription ? (
          <ThemedText style={[Typography.body, { opacity: 0.8, marginTop: Spacing.md, textAlign: "center" }]}>
            {vendorDescription}
          </ThemedText>
        ) : null}
        {vendorPriceRange ? (
          <ThemedText style={[Typography.caption, { color: theme.accent, marginTop: Spacing.sm }]}>
            {vendorPriceRange}
          </ThemedText>
        ) : null}
      </Card>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: Spacing.xl }} />
      ) : error ? (
        <Card style={styles.errorCard}>
          <Feather name="alert-circle" size={24} color={theme.error} />
          <ThemedText style={[Typography.body, { marginTop: Spacing.sm }]}>
            Kunne ikke laste anmeldelser
          </ThemedText>
        </Card>
      ) : (
        <>
          <Card style={styles.ratingCard}>
            <View style={styles.ratingMain}>
              <ThemedText style={[Typography.h1, { color: theme.accent }]}>
                {data?.stats.average || 0}
              </ThemedText>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Feather
                    key={star}
                    name="star"
                    size={18}
                    color={star <= (data?.stats.average || 0) ? theme.accent : theme.border}
                  />
                ))}
              </View>
              <ThemedText style={[Typography.caption, { opacity: 0.6 }]}>
                {data?.stats.count || 0} anmeldelser
              </ThemedText>
            </View>
          </Card>

          {data?.googleReviewUrl ? (
            <Pressable
              style={[styles.googleButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
              onPress={handleOpenGoogle}
            >
              <Feather name="external-link" size={18} color={theme.accent} />
              <ThemedText style={[Typography.body, { marginLeft: Spacing.sm, color: theme.accent }]}>
                Se anmeldelser på Google
              </ThemedText>
            </Pressable>
          ) : null}

          <ThemedText style={[Typography.h3, { marginTop: Spacing.xl, marginBottom: Spacing.md }]}>
            Anmeldelser
          </ThemedText>

          {data?.reviews && data.reviews.length > 0 ? (
            data.reviews.map((review) => (
              <Card key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View>
                    <ThemedText style={Typography.body}>{review.coupleName}</ThemedText>
                    <ThemedText style={[Typography.caption, { opacity: 0.6 }]}>
                      {formatDate(review.createdAt)}
                    </ThemedText>
                  </View>
                  <View style={styles.ratingBadge}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Feather
                        key={star}
                        name="star"
                        size={14}
                        color={star <= review.rating ? theme.accent : theme.border}
                      />
                    ))}
                  </View>
                </View>
                {review.title ? (
                  <ThemedText style={[Typography.body, { fontWeight: "600", marginTop: Spacing.sm }]}>
                    {review.title}
                  </ThemedText>
                ) : null}
                {review.body ? (
                  <ThemedText style={[Typography.small, { opacity: 0.8, marginTop: Spacing.xs }]}>
                    {review.body}
                  </ThemedText>
                ) : null}
                {review.vendorResponse ? (
                  <View style={[styles.vendorResponse, { backgroundColor: theme.backgroundSecondary }]}>
                    <ThemedText style={[Typography.caption, { color: theme.accent, fontWeight: "600", marginBottom: Spacing.xs }]}>
                      Svar fra leverandør
                    </ThemedText>
                    <ThemedText style={Typography.small}>{review.vendorResponse.body}</ThemedText>
                  </View>
                ) : null}
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Feather name="star" size={32} color={theme.textSecondary} />
              <ThemedText style={[Typography.body, { opacity: 0.7, marginTop: Spacing.md, textAlign: "center" }]}>
                Ingen anmeldelser ennå
              </ThemedText>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  vendorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  ratingCard: {
    marginTop: Spacing.lg,
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  ratingMain: {
    alignItems: "center",
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: Spacing.xs,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
  reviewCard: {
    marginBottom: Spacing.md,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ratingBadge: {
    flexDirection: "row",
    gap: 2,
  },
  vendorResponse: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  errorCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
});
