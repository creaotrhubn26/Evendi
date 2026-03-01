import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Switch,
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

const VENDOR_SESSION_KEY = "evendi_vendor_session";

interface AvailabilitySettings {
  vendorId: string;
  isEnabled: boolean;
  leadTimeMinDays: number;
  leadTimeMaxDays: number;
  blockedDateRanges: Array<{
    startDate: string;
    endDate: string;
  }>;
}

export default function VendorAvailabilitySettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [isEnabled, setIsEnabled] = useState(false);
  const [leadTimeMin, setLeadTimeMin] = useState(7);
  const [leadTimeMax, setLeadTimeMax] = useState(90);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);

  // Load vendor session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem(VENDOR_SESSION_KEY);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          setSessionToken(session.sessionToken);
          setVendorId(session.vendorId);
        }
      } catch (error) {
        console.error("Error loading vendor session:", error);
      }
    };
    loadSession();
  }, []);

  // Fetch availability settings
  const { data: settings, isLoading } = useQuery<AvailabilitySettings>({
    queryKey: ["/api/vendor/availability/settings", vendorId],
    queryFn: async () => {
      const response = await fetch(
        new URL(
          `/api/vendor/availability/settings/${vendorId}`,
          getApiUrl()
        ).toString(),
        {
          headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsEnabled(data.isEnabled);
        setLeadTimeMin(data.leadTimeMinDays);
        setLeadTimeMax(data.leadTimeMaxDays);
        return data;
      }
      return null;
    },
    enabled: !!vendorId && !!sessionToken,
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        new URL(
          `/api/vendor/availability/settings`,
          getApiUrl()
        ).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            vendorId,
            isEnabled,
            leadTimeMinDays: leadTimeMin,
            leadTimeMaxDays: leadTimeMax,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kunne ikke lagre innstillinger");
      }
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Innstillinger lagret!");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Feil ved lagring"
      );
    },
  });

  const handleToggleAvailability = () => {
    setIsEnabled(!isEnabled);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        <ThemedText style={styles.headerTitle}>Tilgjengelighet</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Main Toggle */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <View style={styles.toggleHeader}>
            <View>
              <ThemedText style={styles.toggleTitle}>
                Aktiver tilgjengelighetssystem
              </ThemedText>
              <ThemedText style={styles.toggleDescription}>
                Tillat par å se når du er tilgjengelig
              </ThemedText>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggleAvailability}
              trackColor={{
                false: theme.textSecondary + "30",
                true: theme.primary + "50",
              }}
              thumbColor={isEnabled ? theme.primary : theme.textSecondary}
            />
          </View>
        </View>

        {isEnabled && (
          <>
            {/* Lead Time Info */}
            <View
              style={[
                styles.infoBox,
                { backgroundColor: theme.primary + "10", borderColor: theme.primary },
              ]}
            >
              <Feather name="info" size={18} color={theme.primary} />
              <ThemedText style={styles.infoText}>
                Angi hvor langt i forveien arrangementene må bookes for å sikre din tilgjengelighet
              </ThemedText>
            </View>

            {/* Lead Time Settings */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <ThemedText style={styles.sectionTitle}>Bookevindu</ThemedText>

              {/* Minimum Lead Time */}
              <View style={styles.settingItem}>
                <ThemedText style={styles.settingLabel}>
                  Minimum dager på forhånd
                </ThemedText>
                <View style={styles.inputGroup}>
                  <Pressable
                    style={[styles.stepper, { backgroundColor: theme.background }]}
                    onPress={() => {
                      if (leadTimeMin > 1) setLeadTimeMin(leadTimeMin - 1);
                    }}
                  >
                    <Feather name="minus" size={16} color={theme.primary} />
                  </Pressable>
                  <ThemedText style={styles.stepperValue}>{leadTimeMin}</ThemedText>
                  <Pressable
                    style={[styles.stepper, { backgroundColor: theme.background }]}
                    onPress={() => {
                      if (leadTimeMin < leadTimeMax) setLeadTimeMin(leadTimeMin + 1);
                    }}
                  >
                    <Feather name="plus" size={16} color={theme.primary} />
                  </Pressable>
                </View>
                <ThemedText style={styles.settingHelper}>
                  Arrangement må bookes minst {leadTimeMin} dager på forhånd
                </ThemedText>
              </View>

              {/* Maximum Lead Time */}
              <View style={[styles.settingItem, styles.settingItemLast]}>
                <ThemedText style={styles.settingLabel}>
                  Maksimum dager på forhånd
                </ThemedText>
                <View style={styles.inputGroup}>
                  <Pressable
                    style={[styles.stepper, { backgroundColor: theme.background }]}
                    onPress={() => {
                      if (leadTimeMax > leadTimeMin) setLeadTimeMax(leadTimeMax - 1);
                    }}
                  >
                    <Feather name="minus" size={16} color={theme.primary} />
                  </Pressable>
                  <ThemedText style={styles.stepperValue}>{leadTimeMax}</ThemedText>
                  <Pressable
                    style={[styles.stepper, { backgroundColor: theme.background }]}
                    onPress={() => setLeadTimeMax(leadTimeMax + 1)}
                  >
                    <Feather name="plus" size={16} color={theme.primary} />
                  </Pressable>
                </View>
                <ThemedText style={styles.settingHelper}>
                  Du kan godta arrangement opptil {leadTimeMax} dager på forhånd
                </ThemedText>
              </View>
            </View>

            {/* Calendar Management */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <View style={styles.calendarHeader}>
                <ThemedText style={styles.sectionTitle}>Kalender</ThemedText>
                <Pressable
                  style={[styles.calendarButton, { backgroundColor: theme.primary }]}
                  onPress={() => (navigation as any).navigate("VendorAvailabilityCalendar")}
                >
                  <Feather name="calendar" size={16} color="white" />
                  <ThemedText style={styles.calendarButtonText}>Administrer</ThemedText>
                </Pressable>
              </View>
              <ThemedText style={styles.calendarDescription}>
                Velg hvilke datoer du er tilgjengelig for arrangement
              </ThemedText>
            </View>

            {/* Blocked Dates Preview */}
            {settings?.blockedDateRanges && settings.blockedDateRanges.length > 0 && (
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                ]}
              >
                <ThemedText style={styles.sectionTitle}>Utilgjengelighetstider</ThemedText>
                {settings.blockedDateRanges.map((range, index) => (
                  <View key={index} style={styles.blockedDateItem}>
                    <Feather name="x-circle" size={16} color={theme.error} />
                    <ThemedText style={styles.blockedDateText}>
                      {new Date(range.startDate).toLocaleDateString("no-NO")} -{" "}
                      {new Date(range.endDate).toLocaleDateString("no-NO")}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Info Section */}
        <View
          style={[
            styles.infoSection,
            { backgroundColor: theme.primary + "05" },
          ]}
        >
          <Feather name="info" size={18} color={theme.primary} />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>Tips:</ThemedText>
            <ThemedText style={styles.infoItem}>
              • Aktivere gir potensielle kunder høy tillit
            </ThemedText>
            <ThemedText style={styles.infoItem}>
              • Oppdater kalender jevnlig
            </ThemedText>
            <ThemedText style={styles.infoItem}>
              • Sett realistiske ledertider for planlegging
            </ThemedText>
          </View>
        </View>

        <View style={{ height: Spacing.lg }} />
      </ScrollView>

      {/* Save Button */}
      <View
        style={[
          styles.actionBar,
          { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <Pressable
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Feather name="check" size={18} color="white" />
              <ThemedText style={styles.saveButtonText}>Lagre innstillinger</ThemedText>
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
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  toggleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  toggleDescription: {
    fontSize: 13,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  settingItem: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  settingItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  stepper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "center",
  },
  settingHelper: {
    fontSize: 12,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  calendarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  calendarButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },
  calendarDescription: {
    fontSize: 13,
  },
  blockedDateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  blockedDateText: {
    fontSize: 13,
  },
  infoSection: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  infoItem: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  actionBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
});
