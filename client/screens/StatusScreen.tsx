import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, ActivityIndicator, Linking, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { getAppLanguage, type AppLanguage } from "@/lib/storage";
import { showToast } from "@/lib/toast";

interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

export default function StatusScreen() {
  const { theme } = useTheme();
  const [appLanguage, setAppLanguage] = useState<AppLanguage>("nb");

  useEffect(() => {
    async function loadLanguage() {
      const language = await getAppLanguage();
      setAppLanguage(language);
    }
    loadLanguage();
  }, []);

  const t = useMemo(() => (nb: string, en: string) => (appLanguage === "en" ? en : nb), [appLanguage]);
  const locale = appLanguage === "en" ? "en-US" : "nb-NO";

  const { data: settings = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const url = new URL("/api/app-settings", getApiUrl());
      const res = await fetch(url);
      if (!res.ok) throw new Error(t("Kunne ikke hente status", "Could not fetch status"));
      return res.json() as Promise<AppSetting[]>;
    },
  });

  const getSetting = (key: string, fallback = "") => settings.find(s => s.key === key)?.value || fallback;

  const maintenanceMode = getSetting("maintenance_mode") === "true";
  const maintenanceMessage = getSetting("maintenance_message");
  const appVersion = getSetting("app_version");
  const minAppVersion = getSetting("min_app_version");
  const statusMessage = getSetting("status_message");
  const statusType = getSetting("status_type") || "info"; // info, warning, error, success
  const lastUpdated = settings.find(s => s.key === "maintenance_mode")?.updatedAt;

  const getStatusColor = () => {
    if (maintenanceMode) return "#FF6B6B";
    if (statusType === "error") return "#FF6B6B";
    if (statusType === "warning") return "#FFA500";
    if (statusType === "success") return "#51CF66";
    return Colors.dark.accent;
  };

  const getStatusIcon = (): keyof typeof Feather.glyphMap => {
    if (maintenanceMode) return "tool";
    if (statusType === "error") return "alert-circle";
    if (statusType === "warning") return "alert-triangle";
    if (statusType === "success") return "check-circle";
    return "activity";
  };

  const getStatusText = () => {
    if (maintenanceMode) return t("Vedlikehold pågår", "Maintenance in progress");
    if (statusMessage) return statusMessage;
    return t("Alt fungerer normalt", "All systems operational");
  };

  const hasActiveStatus = maintenanceMode || (statusMessage && statusMessage.trim().length > 0);

  const updatedLabel = useMemo(() => {
    if (!lastUpdated) return "";
    return new Date(lastUpdated).toLocaleString(locale);
  }, [lastUpdated]);

  const handleOpenLink = async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        showToast(t("Enheten din kan ikke åpne denne lenken.", "Your device cannot open this link."));
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      showToast(t("Kunne ikke åpne lenken akkurat nå.", "Could not open the link right now."));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={theme.accent}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[styles.header, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <Feather name="activity" size={32} color={getStatusColor()} />
            <ThemedText style={styles.headerTitle}>{t("Wedflow Status", "Wedflow Status")}</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {t("Sanntidsstatus for tjenesten", "Real-time service status")}
            </ThemedText>
            {isRefetching && (
              <View style={styles.refreshRow}>
                <ActivityIndicator size="small" color={theme.accent} />
                <ThemedText style={[styles.refreshText, { color: theme.textMuted }]}>{t("Oppdaterer...", "Refreshing...")}</ThemedText>
              </View>
            )}
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
                    <Feather name={getStatusIcon()} size={24} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.statusTitle, { color: getStatusColor() }]}>
                      {getStatusText()}
                    </ThemedText>
                    {lastUpdated && (
                      <ThemedText style={[styles.statusTime, { color: theme.textMuted }]}>
                        {t("Sist oppdatert", "Last updated")}: {updatedLabel}
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
                <ThemedText style={styles.sectionTitle}>{t("Systeminformasjon", "System information")}</ThemedText>

                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.accent + "15" }]}>
                    <Feather name="smartphone" size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.infoLabel}>{t("Gjeldende versjon", "Current version")}</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: theme.textSecondary }]}>
                      {appVersion || t("Ikke satt", "Not set")}
                    </ThemedText>
                  </View>
                </View>

                {minAppVersion && (
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, { backgroundColor: theme.accent + "15" }]}>
                      <Feather name="alert-circle" size={18} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.infoLabel}>{t("Minimum versjon", "Minimum version")}</ThemedText>
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
                    <ThemedText style={styles.infoLabel}>{t("Status", "Status")}</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: theme.textSecondary }]}>
                      {maintenanceMode ? t("Under vedlikehold", "Under maintenance") : t("Operativ", "Operational")}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Quick Links */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <ThemedText style={styles.sectionTitle}>{t("Trenger du hjelp?", "Need help?")}</ThemedText>

                <Pressable
                  onPress={() => {
                    handleOpenLink("https://github.com/creaotrhubn26/wedflow/blob/main/VENDOR_DOCUMENTATION.md");
                  }}
                  style={[styles.link, { borderColor: theme.border }]}
                >
                  <View style={[styles.linkIcon, { backgroundColor: theme.accent + "15" }]}>
                    <Feather name="book-open" size={18} color={theme.accent} />
                  </View>
                  <ThemedText style={styles.linkText}>{t("Dokumentasjon", "Documentation")}</ThemedText>
                  <Feather name="external-link" size={16} color={theme.textMuted} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    handleOpenLink("mailto:support@wedflow.no");
                  }}
                  style={[styles.link, { borderColor: theme.border }]}
                >
                  <View style={[styles.linkIcon, { backgroundColor: theme.accent + "15" }]}>
                    <Feather name="mail" size={18} color={theme.accent} />
                  </View>
                  <ThemedText style={styles.linkText}>{t("Kontakt Support", "Contact support")}</ThemedText>
                  <Feather name="external-link" size={16} color={theme.textMuted} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    handleOpenLink("https://norwedfilm.no");
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
                    {t("Alle systemer kjører som normalt. Vi overvåker tjenesten kontinuerlig.", "All systems are operating normally. We monitor the service continuously.")}
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
  refreshRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: Spacing.sm },
  refreshText: { fontSize: 12 },
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
