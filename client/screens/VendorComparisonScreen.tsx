import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Dimensions,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ComparisonVendor {
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

interface RouteParams {
  vendors: ComparisonVendor[];
}

const { width } = Dimensions.get("window");

export default function VendorComparisonScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { vendors = [] } = (route.params as RouteParams) || {};

  const [activeTab, setActiveTab] = useState<"info" | "details">("info");

  if (vendors.length < 2) {
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
          <ThemedText style={styles.headerTitle}>Sammenligning</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyState}>
          <Feather name="alert-circle" size={48} color={theme.error} />
          <ThemedText style={styles.emptyStateTitle}>Utilstrekkelig data</ThemedText>
          <ThemedText style={styles.emptyStateDescription}>
            Du må velge minst 2 leverandører for sammenligning
          </ThemedText>
          <Pressable
            style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText style={styles.emptyStateButtonText}>Tilbake</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  const columnWidth = (width - Spacing.md * 3) / vendors.length;

  const ComparisonRow = ({
    label,
    items,
    highlight = false,
  }: {
    label: string;
    items: string[];
    highlight?: boolean;
  }) => (
    <View
      style={[
        styles.comparisonRow,
        {
          backgroundColor: highlight ? theme.primary + "05" : "transparent",
          borderBottomColor: theme.border,
        },
      ]}
    >
      {/* Label Column */}
      <View style={[styles.labelColumn, { width: columnWidth + Spacing.md }]}>
        <ThemedText style={styles.labelText}>{label}</ThemedText>
      </View>

      {/* Value Columns */}
      {items.map((item, index) => (
        <View key={index} style={[styles.valueColumn, { width: columnWidth }]}>
          <ThemedText style={styles.valueText}>{item}</ThemedText>
        </View>
      ))}
    </View>
  );

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
        <ThemedText style={styles.headerTitle}>
          Sammenligner {vendors.length} leverandører
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View
        style={[
          styles.tabContainer,
          { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border },
        ]}
      >
        {["info", "details"].map((tab) => (
          <Pressable
            key={tab}
            style={[
              styles.tab,
              {
                borderBottomWidth: activeTab === tab ? 2 : 0,
                borderBottomColor:
                  activeTab === tab ? theme.primary : "transparent",
              },
            ]}
            onPress={() => {
              setActiveTab(tab as "info" | "details");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === tab ? theme.primary : theme.textSecondary },
              ]}
            >
              {tab === "info" ? "Informasjon" : "Detaljer"}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView
        horizontal
        scrollEnabled={vendors.length > 2}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.comparisonTable}>
          {/* Header - Vendor Names */}
          <View
            style={[
              styles.headerRow,
              {
                backgroundColor: theme.primary,
              },
            ]}
          >
            {/* Label Column Header */}
            <View
              style={[
                styles.labelColumn,
                { width: columnWidth + Spacing.md },
              ]}
            />

            {/* Vendor Name Headers */}
            {vendors.map((vendor, index) => (
              <View
                key={vendor.vendorId}
                style={[styles.valueColumn, { width: columnWidth }]}
              >
                <ThemedText
                  style={styles.headerText}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {vendor.vendorName}
                </ThemedText>
                {index < vendors.length - 1 && (
                  <View
                    style={[
                      styles.divider,
                      { borderRightColor: theme.primary },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          {activeTab === "info" ? (
            <>
              {/* Category */}
              <ComparisonRow
                label="Kategori"
                items={vendors.map((v) => v.vendorCategory)}
                highlight
              />

              {/* Location */}
              <ComparisonRow
                label="Lokasjon"
                items={vendors.map((v) => v.vendorLocation || "Uvisst")}
              />

              {/* Price Range */}
              <ComparisonRow
                label="Pris"
                items={vendors.map((v) => v.vendorPriceRange || "N/A")}
                highlight
              />

              {/* Rating */}
              <ComparisonRow
                label="Vurdering"
                items={vendors.map((v) =>
                  v.averageRating
                    ? `${v.averageRating.toFixed(1)}⭐ (${v.reviewCount || 0})`
                    : "Ingen"
                )}
              />

              {/* Description */}
              <ComparisonRow
                label="Beskrivelse"
                items={vendors.map(
                  (v) => v.vendorDescription?.substring(0, 30) + "..." || "Ingen"
                )}
                highlight
              />
            </>
          ) : (
            <>
              {/* Created Date */}
              <ComparisonRow
                label="Opprettet"
                items={vendors.map((v) =>
                  new Date(v.createdAt).toLocaleDateString("no-NO")
                )}
                highlight
              />

              {/* Contact Action */}
              <View style={styles.actionRow}>
                <View
                  style={[
                    styles.labelColumn,
                    { width: columnWidth + Spacing.md },
                  ]}
                />
                {vendors.map((vendor, index) => (
                  <View
                    key={vendor.vendorId}
                    style={[styles.valueColumn, { width: columnWidth }]}
                  >
                    <Pressable
                      style={[
                        styles.contactButton,
                        { backgroundColor: theme.primary },
                      ]}
                      onPress={() => {
                        (navigation as any).navigate("Conversation", {
                          vendorId: vendor.vendorId,
                          vendorName: vendor.vendorName,
                        });
                      }}
                    >
                      <Feather name="message-square" size={14} color="white" />
                      <ThemedText style={styles.contactButtonText}>
                        Kontakt
                      </ThemedText>
                    </Pressable>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Legend */}
      <View
        style={[
          styles.legend,
          { backgroundColor: theme.backgroundDefault, borderTopColor: theme.border },
        ]}
      >
        <Feather name="info" size={16} color={theme.primary} />
        <ThemedText style={styles.legendText}>
          {vendors.length === 3
            ? "Du sammenligner 3 leverandører"
            : "Du sammenligner 2 leverandører"}
        </ThemedText>
      </View>

      {/* Action Bar */}
      <View
        style={[
          styles.actionBar,
          { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <Pressable
          style={styles.backActionButton}
          onPress={() => navigation.goBack()}
        >
          <ThemedText style={styles.backActionButtonText}>Tilbake</ThemedText>
        </Pressable>

        <Pressable
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Could add save comparison feature here
            (navigation as any).navigate("VendorShortlist");
          }}
        >
          <Feather name="check" size={18} color="white" />
          <ThemedText style={styles.saveButtonText}>Lagre valg</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 16,
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
  tabContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: 200,
  },
  comparisonTable: {
    minWidth: width - Spacing.md * 2,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  labelColumn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    justifyContent: "center",
  },
  valueColumn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },
  divider: {
    position: "absolute",
    right: 0,
    height: 40,
    borderRightWidth: 1,
  },
  comparisonRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    minHeight: 60,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "600",
  },
  valueText: {
    fontSize: 12,
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    minHeight: 60,
    backgroundColor: "#f5f5f5",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  contactButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  legendText: {
    fontSize: 12,
  },
  actionBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    flexDirection: "row",
    gap: Spacing.md,
  },
  backActionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  backActionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
});
