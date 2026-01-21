import React from "react";
import { ScrollView, StyleSheet, View, ActivityIndicator, Linking, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

export default function StatusScreen() {
  const { theme } = useTheme();

  const { data: settings = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const url = new URL("/api/app-settings", getApiUrl());
      const res = await fetch(url);
      if (!res.ok) throw new Error("Kunne ikke hente status");
      return res.json() as Promise<AppSetting[]>;
    },
  });

  const getSetting = (key: string) => settings.find(s => s.key === key)?.value || "";

  const maintenanceMode = getSetting("maintenance_mode") === "true";
  const maintenanceMessage = getSetting("maintenance_message");
  const appVersion = getSetting("app_version");
  const minAppVersion = getSetting("min_app_version");
  const statusMessage = getSetting("status_message");
  const statusType = getSetting("status_type"); // info, warning, error, success
  const lastUpdated = settings.find(s => s.key === "maintenance_mode")?.updatedAt;

  const getStatusColor = () => {
    if (maintenanceMode) return "#FF6B6B";
    if (statusType === "error") return "#FF6B6B";
    if (statusType === "warning") return "#FFA500";
    if (statusType === "success") return "#51CF66";
    return Colors.dark.accent;
  };

  const getStatusIcon = () => {
    if (maintenanceMode) return "tool";
    if (statusType === "error") return "alert-circle";
    if (statusType === "warning") return "alert-triangle";
    if (statusType === "success") return "check-circle";
    return "activity";
  };

  const getStatusText = () => {
    if (maintenanceMode) return "Vedlikehold pågår";
    if (statusMessage) return statusMessage;
    return "Alt fungerer normalt";
  };

  const hasActiveStatus = maintenanceMode || (statusMessage && statusMessage.trim().length > 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <Pressable onPress={() => refetch()}>
            {isRefetching && <ActivityIndicator color={theme.accent} />}
          </Pressable>
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[styles.header, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <Feather name="activity" size={32} color={getStatusColor()} />
            <ThemedText style={styles.headerTitle}>Wedflow Status</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Sanntidsstatus for tjenesten
            </ThemedText>
          </View>
        </Animated.View>

        {/* Loading */}
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: Spacing.xl }} color={theme.accent} />
        ) : (
          <>
            {/* Current Status */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <View
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: getStatusColor() + "15",
                    borderColor: getStatusColor(),
                  },
                ]}
              >
                <View style={styles.statusHeader}>
                  <View style={[styles.statusIconCircle, { backgroundColor: getStatusColor() }]}>
                    <Feather name={getStatusIcon() as any} size={24} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.statusTitle, { color: getStatusColor() }]}>
                      {getStatusText()}
                    </ThemedText>
                    {lastUpdated && (
                      <ThemedText style={[styles.statusTime, { color: theme.textMuted }]}>
                        Sist oppdatert: {new Date(lastUpdated).toLocaleString("no-NO")}
                      </ThemedText>
                    )}
                  </View>
                </View>

                {maintenanceMode && maintenanceMessage && (
                  <View style={[styles.messageBox, { backgroundColor: theme.backgroundSecondary }]}>
                    <ThemedText style={[styles.messageText, { color: theme.text }]}>
                      {maintenanceMessage}
                    </ThemedText>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* System Info */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <ThemedText style={styles.sectionTitle}>Systeminformasjon</ThemedText>

                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.accent + "15" }]}>
                    <Feather name="smartphone" size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.infoLabel}>Gjeldende versjon</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: theme.textSecondary }]}>
                      {appVersion || "Ikke satt"}
                    </ThemedText>
                  </View>
                </View>

                {minAppVersion && (
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, { backgroundColor: theme.accent + "15" }]}>
                      <Feather name="alert-circle" size={18} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.infoLabel}>Minimum versjon</ThemedText>
                      <ThemedText style={[styles.infoValue, { color: theme.textSecondary }]}>
                        {minAppVersion}
                      </ThemedText>
                    </View>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: "#51CF66" + "15" }]}>
                    <Feather name="check-circle" size={18} color="#51CF66" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.infoLabel}>Status</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: theme.textSecondary }]}>
                      {maintenanceMode ? "Under vedlikehold" : "Operativ"}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Quick Links */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <ThemedText style={styles.sectionTitle}>Trenger du hjelp?</ThemedText>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL("https://github.com/creaotrhubn26/wedflow/blob/main/VENDOR_DOCUMENTATION.md");
                  }}
                  style={[styles.link, { borderColor: theme.border }]}
                >
                  <View style={[styles.linkIcon, { backgroundColor: theme.accent + "15" }]}>
                    <Feather name="book-open" size={18} color={theme.accent} />
                  </View>
                  <ThemedText style={styles.linkText}>Dokumentasjon</ThemedText>
                  <Feather name="external-link" size={16} color={theme.textMuted} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL("mailto:support@wedflow.no");
                  }}
                  style={[styles.link, { borderColor: theme.border }]}
                >
                  <View style={[styles.linkIcon, { backgroundColor: theme.accent + "15" }]}>
                    <Feather name="mail" size={18} color={theme.accent} />
                  </View>
                  <ThemedText style={styles.linkText}>Kontakt Support</ThemedText>
                  <Feather name="external-link" size={16} color={theme.textMuted} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL("https://norwedfilm.no");
                  }}
                  style={[styles.link, { borderColor: theme.border }]}
                >
                  <View style={[styles.linkIcon, { backgroundColor: theme.accent + "15" }]}>
                    <Feather name="globe" size={18} color={theme.accent} />
                  </View>
                  <ThemedText style={styles.linkText}>Norwedfilm.no</ThemedText>
                  <Feather name="external-link" size={16} color={theme.textMuted} />
                </Pressable>
              </View>
            </Animated.View>

            {!hasActiveStatus && (
              <Animated.View entering={FadeInDown.delay(400).duration(400)}>
                <View style={[styles.infoBox, { backgroundColor: theme.accent + "15", borderColor: theme.accent }]}>
                  <Feather name="info" size={18} color={theme.accent} />
                  <ThemedText style={[styles.infoText, { color: theme.text }]}>
                    Alle systemer kjører som normalt. Vi overvåker tjenesten kontinuerlig.
                  </ThemedText>
                </View>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md },
  header: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", marginTop: Spacing.sm },
  headerSubtitle: { fontSize: 14, marginTop: Spacing.xs, textAlign: "center" },
  statusCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
  },
  statusIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: { fontSize: 18, fontWeight: "700" },
  statusTime: { fontSize: 12, marginTop: 2 },
  messageBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: Spacing.md },
  infoRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: 14, fontWeight: "600" },
  infoValue: { fontSize: 13, marginTop: 2 },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: { flex: 1, fontSize: 15, fontWeight: "500" },
  infoBox: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
