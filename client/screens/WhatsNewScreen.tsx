import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { WhatsNewItem } from "../../shared/schema";

type WhatsNewScreenRouteProp = RouteProp<{ WhatsNew: { category?: "vendor" | "couple" } }, "WhatsNew">;

export default function WhatsNewScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const route = useRoute<WhatsNewScreenRouteProp>();
  
  // Default to vendor if not specified
  const category = route.params?.category || "vendor";

  const {
    data: items = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<WhatsNewItem[]>({
    queryKey: ["whats-new", category],
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/whats-new/${category}`);
      if (!res.ok) throw new Error("Kunne ikke hente hva som er nytt");
      return res.json();
    },
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          gap: Spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={theme.accent}
          />
        }
      >
        <View>
          <ThemedText style={styles.title}>Hva er nytt</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>
            Se de siste oppdateringene og nye funksjoner
          </ThemedText>
        </View>

        {items.length === 0 && !isLoading ? (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="inbox" size={48} color={theme.accent} />
            <ThemedText style={[styles.emptyTitle, { marginTop: Spacing.md }]}>
              Ingen nyheter ennå
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textMuted, marginTop: Spacing.sm }]}>
              Vi jobber konstant med å forbedre Wedflow. Kom tilbake snart for nyheter!
            </ThemedText>
          </View>
        ) : (
          items.map((item, index) => (
            <View key={item.id}>
              <View
                style={[
                  styles.item,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.itemIcon,
                    {
                      backgroundColor: theme.accent + "20",
                    },
                  ]}
                >
                  <Feather name={item.icon as any} size={24} color={theme.accent} />
                </View>

                <View style={styles.itemContent}>
                  <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
                  <ThemedText
                    style={[
                      styles.itemDescription,
                      {
                        color: theme.textMuted,
                        marginVertical: Spacing.sm,
                      },
                    ]}
                  >
                    {item.description}
                  </ThemedText>
                  <View style={styles.itemFooter}>
                    <View
                      style={[
                        styles.versionBadge,
                        {
                          backgroundColor: theme.accent + "15",
                        },
                      ]}
                    >
                      <Feather name="package" size={12} color={theme.accent} />
                      <ThemedText style={[styles.versionText, { color: theme.accent }]}>
                        v{item.minAppVersion}+
                      </ThemedText>
                    </View>
                    {index === 0 && (
                      <View
                        style={[
                          styles.newBadge,
                          {
                            backgroundColor: theme.accent,
                          },
                        ]}
                      >
                        <ThemedText style={styles.newBadgeText}>NYT</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={[styles.infoBox, { backgroundColor: theme.accent + "15", borderColor: theme.accent }]}>
          <Feather name="info" size={16} color={theme.accent} />
          <ThemedText style={[styles.infoText, { color: theme.text }]}>
            <ThemedText style={{ fontWeight: "600" }}>Tips: </ThemedText>
            Disse nyhetene vises også som en modal når du oppgraderer appen.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  emptyState: {
    borderRadius: BorderRadius.lg,
    paddingVertical: 60,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  item: {
    flexDirection: "row",
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  itemFooter: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  versionBadge: {
    flexDirection: "row",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: "center",
  },
  versionText: {
    fontSize: 11,
    fontWeight: "600",
  },
  newBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoBox: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "flex-start",
    marginTop: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
