/**
 * VendorCategoryMarketplace – Full marketplace section for vendor category screens.
 *
 * Provides a VendorsScreen-style experience inside each category screen:
 * • Gradient hero header with category icon & title
 * • Vendor search (VendorSearchField)
 * • Featured vendor card listing (from API)
 * • Smart match CTA → VendorMatchingScreen
 *
 * Usage:
 * ```tsx
 * <VendorCategoryMarketplace
 *   category="photographer"
 *   categoryName="Fotograf"
 *   icon="camera"
 *   subtitle="Finn og book den perfekte fotografen"
 *   gradientColors={["#667eea", "#764ba2"]}
 * />
 * ```
 */
import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
  FlatList,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { EvendiIcon, type EvendiIconName } from "@/components/EvendiIcon";
import { ThemedText } from "@/components/ThemedText";
import { VendorSearchField } from "@/components/VendorSearchField";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { PlanningStackParamList } from "@/navigation/PlanningStackNavigator";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { getVendorCategoryGradient } from "@shared/event-types";

// ── Gradient colors per category (backed by shared registry) ────
export const CATEGORY_GRADIENTS: Record<string, [string, string]> = (() => {
  // Build from shared registry, add default fallback
  const { VENDOR_CATEGORIES } = require("@shared/event-types");
  const map: Record<string, [string, string]> = { default: ["#667eea", "#764ba2"] };
  for (const [slug, info] of Object.entries(VENDOR_CATEGORIES)) {
    map[slug] = (info as any).gradient;
  }
  return map;
})();

// ── API vendor shape ─────────────────────────────────────────
interface ApiVendor {
  id: string;
  businessName: string;
  categoryId: string | null;
  categoryName?: string;
  description: string | null;
  location: string | null;
  priceRange: string | null;
  imageUrl: string | null;
  isFeatured?: boolean;
}

type NavigationProp = NativeStackNavigationProp<PlanningStackParamList>;

export interface VendorCategoryMarketplaceProps {
  /** Vendor category slug (e.g., "photographer", "florist") */
  category: string;
  /** Display name for the category (e.g., "Fotograf", "Blomster") */
  categoryName: string;
  /** EvendiIcon name */
  icon: EvendiIconName;
  /** Subtitle under category name */
  subtitle: string;
  /** Two-color gradient for the hero header */
  gradientColors?: [string, string];
  /** Traditions for smart matching */
  selectedTraditions?: string[] | null;
  /** Extra content below the marketplace section (existing screen content) */
  children?: React.ReactNode;
}

export function VendorCategoryMarketplace({
  category,
  categoryName,
  icon,
  subtitle,
  gradientColors,
  selectedTraditions = [],
}: VendorCategoryMarketplaceProps) {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const CARD_WIDTH = useMemo(() => SCREEN_WIDTH * 0.62, [SCREEN_WIDTH]);
  const colors = gradientColors ?? CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.default;
  const traditions = selectedTraditions ?? [];

  // Fetch all vendors (shared cache with VendorsScreen)
  const { data: apiVendors = [] } = useQuery<ApiVendor[]>({
    queryKey: ["/api/vendors"],
  });

  // Filter to this category
  const categoryVendors = useMemo(() => {
    const catLower = category.toLowerCase();
    const nameLower = categoryName.toLowerCase();
    return apiVendors
      .filter(
        (v) =>
          (v.categoryId ?? "").toLowerCase() === catLower ||
          (v.categoryName ?? "").toLowerCase() === nameLower ||
          (v.categoryName ?? "").toLowerCase().includes(nameLower)
      )
      .slice(0, 4);
  }, [apiVendors, category, categoryName]);

  const handleVendorPress = (vendor: ApiVendor) => {
    navigation.navigate("VendorDetail", {
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      vendorDescription: vendor.description || "",
      vendorLocation: vendor.location || "",
      vendorPriceRange: vendor.priceRange || "",
      vendorCategory: category,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSmartMatch = () => {
    navigation.navigate("VendorMatching", {
      category,
      selectedTraditions: traditions,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View>
      {/* ── Gradient Hero Header ─────────────────────────────── */}
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroOverlay}>
          <View style={styles.heroIconCircle}>
            <EvendiIcon name={icon} size={32} color="#fff" />
          </View>
          <ThemedText style={styles.heroTitle}>{categoryName}</ThemedText>
          <ThemedText style={styles.heroSubtitle}>{subtitle}</ThemedText>
        </View>
      </LinearGradient>

      {/* ── Search Section ────────────────────────────────────── */}
      <View style={[styles.searchSection, { backgroundColor: theme.backgroundRoot }]}>
        <VendorSearchField
          category={category}
          icon={icon}
          label={`Søk etter ${categoryName.toLowerCase()}`}
          placeholder={`Søk etter registrert ${categoryName.toLowerCase()}...`}
        />
      </View>

      {/* ── Smart Match CTA ──────────────────────────────────── */}
      <Pressable onPress={handleSmartMatch} style={styles.smartMatchBanner}>
        <LinearGradient
          colors={[colors[0] + "30", colors[1] + "15"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.smartMatchContent}
        >
          <View style={[styles.smartMatchIcon, { backgroundColor: colors[0] + "30" }]}>
            <EvendiIcon name="zap" size={20} color={colors[0]} />
          </View>
          <View style={styles.smartMatchTextWrap}>
            <ThemedText style={[styles.smartMatchTitle, { color: theme.text }]}>
              Finn din perfekte {categoryName.toLowerCase()}
            </ThemedText>
            <ThemedText style={[styles.smartMatchSub, { color: theme.textSecondary }]}>
              Smart matching basert på preferanser og budsjett
            </ThemedText>
          </View>
          <EvendiIcon name="chevron-right" size={18} color={colors[0]} />
        </LinearGradient>
      </Pressable>

      {/* ── Featured Vendor Cards ─────────────────────────────── */}
      {categoryVendors.length > 0 && (
        <View style={styles.vendorSection}>
          <View style={styles.vendorSectionHeader}>
            <ThemedText style={[styles.vendorSectionTitle, { color: theme.text }]}>
              Populære leverandører
            </ThemedText>
            <Pressable onPress={handleSmartMatch}>
              <ThemedText style={[styles.seeAllText, { color: colors[0] }]}>
                Se alle →
              </ThemedText>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vendorCardsScroll}
          >
            {categoryVendors.map((vendor, index) => (
              <Animated.View
                key={vendor.id}
                entering={FadeInDown.delay(index * 80).duration(400)}
              >
                <Pressable
                  style={[
                    styles.vendorCard,
                    {
                      width: CARD_WIDTH,
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => handleVendorPress(vendor)}
                >
                  {/* Card image / gradient placeholder */}
                  <View style={styles.vendorCardImage}>
                    {vendor.imageUrl ? (
                      <Image
                        source={{ uri: vendor.imageUrl }}
                        style={styles.vendorCardImageFill}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.vendorCardImageFill}
                      >
                        <EvendiIcon name={icon} size={28} color="#fff" />
                      </LinearGradient>
                    )}
                    {vendor.isFeatured && (
                      <View style={[styles.featuredBadge, { backgroundColor: colors[0] }]}>
                        <EvendiIcon name="star" size={10} color="#fff" />
                        <ThemedText style={styles.featuredBadgeText}>Anbefalt</ThemedText>
                      </View>
                    )}
                  </View>

                  {/* Card content */}
                  <View style={styles.vendorCardContent}>
                    <ThemedText
                      style={[styles.vendorCardName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {vendor.businessName}
                    </ThemedText>
                    {vendor.location && (
                      <View style={styles.vendorCardLocation}>
                        <EvendiIcon name="map-pin" size={12} color={theme.textSecondary} />
                        <ThemedText
                          style={[styles.vendorCardLocationText, { color: theme.textSecondary }]}
                          numberOfLines={1}
                        >
                          {vendor.location}
                        </ThemedText>
                      </View>
                    )}
                    {vendor.priceRange && (
                      <ThemedText
                        style={[styles.vendorCardPrice, { color: theme.textMuted }]}
                        numberOfLines={1}
                      >
                        {vendor.priceRange}
                      </ThemedText>
                    )}
                    <Pressable
                      style={[styles.vendorCardCta, { backgroundColor: colors[0] }]}
                      onPress={() => handleVendorPress(vendor)}
                    >
                      <ThemedText style={styles.vendorCardCtaText}>Se detaljer</ThemedText>
                    </Pressable>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────
//  Styles
// ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Hero ──
  hero: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing["2xl"],
    alignItems: "center",
  },
  heroOverlay: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    maxWidth: 260,
  },

  // ── Search ──
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  // ── Smart match CTA ──
  smartMatchBanner: {
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  smartMatchContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  smartMatchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  smartMatchTextWrap: { flex: 1 },
  smartMatchTitle: { fontSize: 14, fontWeight: "600" },
  smartMatchSub: { fontSize: 12, marginTop: 1 },

  // ── Vendor section ──
  vendorSection: {
    paddingBottom: Spacing.md,
  },
  vendorSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  vendorSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  vendorCardsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },

  // ── Vendor card (horizontal scroll) ──
  vendorCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  vendorCardImage: {
    width: "100%",
    height: 120,
    position: "relative",
  },
  vendorCardImageFill: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  featuredBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  vendorCardContent: {
    padding: Spacing.sm,
    gap: 4,
  },
  vendorCardName: {
    fontSize: 15,
    fontWeight: "700",
  },
  vendorCardLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  vendorCardLocationText: {
    fontSize: 12,
  },
  vendorCardPrice: {
    fontSize: 12,
  },
  vendorCardCta: {
    marginTop: 6,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: "center",
  },
  vendorCardCtaText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
