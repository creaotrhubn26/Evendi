import React, { useState } from "react";
import { ScrollView, StyleSheet, View, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

const SETTINGS_CONFIG = [
  {
    key: "app_version",
    label: "App-versjon",
    description: "Gjeldende versjon av appen (f.eks. 1.0.0)",
    icon: "smartphone" as const,
  },
  {
    key: "min_app_version",
    label: "Minimum app-versjon",
    description: "Minimum versjon som støttes (tvinger oppdatering)",
    icon: "alert-circle" as const,
  },
  {
    key: "maintenance_mode",
    label: "Vedlikeholdsmodus",
    description: "true/false - Aktiver vedlikeholdsmodus (vises på status-siden)",
    icon: "tool" as const,
  },
  {
    key: "maintenance_message",
    label: "Vedlikeholdsmelding",
    description: "Melding som vises under vedlikehold på status-siden",
    icon: "message-square" as const,
  },
  {
    key: "status_message",
    label: "Statusmelding",
    description: "Generell statusmelding (tom = alt normalt)",
    icon: "info" as const,
  },
  {
    key: "status_type",
    label: "Statustype",
    description: "info, warning, error, success",
    icon: "alert-triangle" as const,
  },
  {
    key: "support_email",
    label: "Support e-post",
    description: "E-postadresse for support",
    icon: "mail" as const,
  },
  {
    key: "support_phone",
    label: "Support telefon",
    description: "Telefonnummer for support",
    icon: "phone" as const,
  },
  {
    key: "help_show_documentation",
    label: "Vis Fullstendig Dokumentasjon",
    description: "true/false - Vis lenke til dokumentasjon i Wedflow Support",
    icon: "book-open" as const,
  },
  {
    key: "help_show_faq",
    label: "Vis Hjelp & FAQ",
    description: "true/false - Vis lenke til FAQ i Wedflow Support",
    icon: "help-circle" as const,
  },
  {
    key: "help_show_videoguides",
    label: "Vis Videoguider",
    description: "true/false - Vis lenke til videoguider i Wedflow Support (standard: skjult)",
    icon: "video" as const,
  },
  {
    key: "help_show_whatsnew",
    label: "Vis Hva er nytt",
    description: "true/false - Vis lenke til Hva er nytt-funksjonen i Wedflow Support",
    icon: "star" as const,
  },
  {
    key: "help_show_status",
    label: "Vis Systemstatus",
    description: "true/false - Vis lenke til systemstatus i Wedflow Support",
    icon: "activity" as const,
  },
  {
    key: "help_show_email_support",
    label: "Vis E-post Support",
    description: "true/false - Vis lenke til e-post support i Wedflow Support (standard: skjult)",
    icon: "mail" as const,
  },
  {
    key: "help_show_norwedfilm",
    label: "Vis Norwedfilm.no",
    description: "true/false - Vis lenke til Norwedfilm i Wedflow Support",
    icon: "globe" as const,
  },
];

export default function AdminAppSettingsScreen({ route }: { route: { params: { adminKey: string } } }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { adminKey } = route.params;

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["admin-app-settings", adminKey],
    queryFn: async () => {
      const url = new URL("/api/admin/app-settings", getApiUrl());
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) throw new Error("Kunne ikke hente innstillinger");
      return res.json() as Promise<AppSetting[]>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const url = new URL(`/api/admin/app-settings/${key}`, getApiUrl());
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error("Kunne ikke oppdatere innstilling");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-app-settings"] });
      setEditingKey(null);
      setEditValue("");
      Alert.alert("Suksess", "Innstilling oppdatert");
    },
    onError: (error) => {
      Alert.alert("Feil", error.message);
    },
  });

  const handleEdit = (key: string, currentValue: string) => {
    setEditingKey(key);
    setEditValue(currentValue);
  };

  const handleSave = () => {
    if (!editingKey) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateMutation.mutate({ key: editingKey, value: editValue });
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const getSettingValue = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    return setting?.value || "";
  };

  const getSettingUpdatedAt = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    return setting?.updatedAt ? new Date(setting.updatedAt).toLocaleString("no-NO") : "Aldri oppdatert";
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.header, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <Feather name="settings" size={32} color={theme.accent} />
          <ThemedText style={styles.headerTitle}>App-innstillinger</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Administrer app-versjon og globale innstillinger
          </ThemedText>
        </View>

        {isLoading ? (
          <ActivityIndicator style={{ marginTop: Spacing.xl }} color={theme.accent} />
        ) : (
          SETTINGS_CONFIG.map((config) => {
            const currentValue = getSettingValue(config.key);
            const isEditing = editingKey === config.key;
            const updatedAt = getSettingUpdatedAt(config.key);

            return (
              <View
                key={config.key}
                style={[styles.settingCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
              >
                <View style={styles.settingHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.accent + "15" }]}>
                    <Feather name={config.icon} size={20} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.settingLabel}>{config.label}</ThemedText>
                    <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
                      {config.description}
                    </ThemedText>
                  </View>
                </View>

                {isEditing ? (
                  <>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                      value={editValue}
                      onChangeText={setEditValue}
                      placeholder="Skriv verdi..."
                      placeholderTextColor={theme.textMuted}
                      multiline={config.key === "maintenance_message"}
                      numberOfLines={config.key === "maintenance_message" ? 3 : 1}
                    />
                    <View style={styles.buttonRow}>
                      <Pressable
                        onPress={handleCancel}
                        style={[styles.btnSecondary, { borderColor: theme.border }]}
                      >
                        <ThemedText style={{ color: theme.textSecondary }}>Avbryt</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={handleSave}
                        style={[styles.btnPrimary, { backgroundColor: theme.accent }]}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <ThemedText style={{ color: "#FFF", fontWeight: "600" }}>Lagre</ThemedText>
                        )}
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.valueBox, { backgroundColor: theme.backgroundSecondary }]}>
                      <ThemedText style={styles.valueText}>
                        {currentValue || <ThemedText style={{ color: theme.textMuted }}>Ikke satt</ThemedText>}
                      </ThemedText>
                    </View>
                    <View style={styles.footer}>
                      <ThemedText style={[styles.updatedText, { color: theme.textMuted }]}>
                        Sist oppdatert: {updatedAt}
                      </ThemedText>
                      <Pressable
                        onPress={() => handleEdit(config.key, currentValue)}
                        style={[styles.editBtn, { borderColor: theme.accent }]}
                      >
                        <Feather name="edit-2" size={14} color={theme.accent} />
                        <ThemedText style={[styles.editBtnText, { color: theme.accent }]}>Rediger</ThemedText>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}

        <View style={[styles.infoBox, { backgroundColor: theme.accent + "15", borderColor: theme.accent }]}>
          <Feather name="info" size={18} color={theme.accent} />
          <ThemedText style={[styles.infoText, { color: theme.text }]}>
            <ThemedText style={{ fontWeight: "600" }}>Tips: </ThemedText>
            Endringer i app-versjon og statusmeldinger vises for alle brukere umiddelbart. Vedlikeholdsmodus og statusmeldinger vises på Status-siden.
          </ThemedText>
        </View>
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
  settingCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  settingHeader: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: { fontSize: 16, fontWeight: "600" },
  settingDescription: { fontSize: 13, marginTop: 2 },
  valueBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  valueText: { fontSize: 14, lineHeight: 20 },
  input: {
    minHeight: 44,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  updatedText: { fontSize: 12 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  editBtnText: { fontSize: 13, fontWeight: "500" },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  btnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondary: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  infoBox: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "flex-start",
    marginTop: Spacing.md,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
