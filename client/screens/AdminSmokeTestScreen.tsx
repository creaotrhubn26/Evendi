import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouteProp } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { EvendiIcon } from "@/components/EvendiIcon";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

interface SmokeTestCheckResult {
  name: string;
  status: "passed" | "failed" | "skipped";
  durationMs: number;
  error?: string;
}

interface SmokeTestJob {
  id: string;
  mode: "light" | "full";
  status: "queued" | "running" | "passed" | "failed";
  startedAt?: string;
  finishedAt?: string;
  results: SmokeTestCheckResult[];
  logs: string[];
}

type Props = {
  route: RouteProp<RootStackParamList, "AdminSmokeTest">;
};

export default function AdminSmokeTestScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const adminKey = route.params?.adminKey || "";
  const [mode, setMode] = useState<"light" | "full">("full");

  const smokeQuery = useQuery<{ latest: SmokeTestJob | null }>({
    queryKey: ["/api/admin/smoke-test", adminKey],
    queryFn: async () => {
      const url = new URL("/api/admin/smoke-test", getApiUrl());
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) throw new Error("Kunne ikke hente smoke test-status");
      return res.json();
    },
    enabled: adminKey.length > 0,
    refetchInterval: (query) => (query.state.data?.latest?.status === "running" ? 3000 : false),
  });

  const startMutation = useMutation({
    mutationFn: async (selectedMode: "light" | "full") => {
      const url = new URL("/api/admin/smoke-test", getApiUrl());
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({ mode: selectedMode }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Kunne ikke starte smoke test");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smoke-test", adminKey] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error(error);
    },
  });

  const latest = smokeQuery.data?.latest || null;
  const isRunning = latest?.status === "running";
  const logs = useMemo(() => {
    if (!latest?.logs?.length) return [];
    return latest.logs.slice(-200);
  }, [latest?.logs]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <View>
            <ThemedText style={styles.title}>Smoke test</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>Kjor raske helsesjekker og typecheck</ThemedText>
          </View>
          {isRunning ? <ActivityIndicator color={theme.accent} /> : null}
        </View>

        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode("light")}
            style={[
              styles.modeButton,
              { borderColor: mode === "light" ? theme.accent : theme.border },
              mode === "light" && { backgroundColor: theme.accent + "15" },
            ]}
          >
            <ThemedText style={[styles.modeText, { color: mode === "light" ? theme.accent : theme.text }]}>Light</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setMode("full")}
            style={[
              styles.modeButton,
              { borderColor: mode === "full" ? theme.accent : theme.border },
              mode === "full" && { backgroundColor: theme.accent + "15" },
            ]}
          >
            <ThemedText style={[styles.modeText, { color: mode === "full" ? theme.accent : theme.text }]}>Full</ThemedText>
          </Pressable>
        </View>

        <Pressable
          onPress={() => startMutation.mutate(mode)}
          disabled={isRunning || startMutation.isPending}
          style={[
            styles.runButton,
            { backgroundColor: Colors.dark.accent },
            (isRunning || startMutation.isPending) && { opacity: 0.6 },
          ]}
        >
          <EvendiIcon name="check-circle" size={18} color="#000" />
          <ThemedText style={styles.runButtonText}>
            {isRunning ? "Kjorer..." : "Start smoke test"}
          </ThemedText>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <ThemedText style={styles.sectionTitle}>Siste kjøring</ThemedText>
        {smokeQuery.isLoading ? (
          <ActivityIndicator color={theme.accent} />
        ) : latest ? (
          <>
            <View style={styles.statusRow}>
              <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>Status</ThemedText>
              <ThemedText style={[styles.statusValue, { color: statusColor(latest.status, theme) }]}>
                {latest.status}
              </ThemedText>
            </View>
            <View style={styles.statusRow}>
              <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>Mode</ThemedText>
              <ThemedText style={styles.statusValue}>{latest.mode}</ThemedText>
            </View>
            {latest.startedAt ? (
              <View style={styles.statusRow}>
                <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>Start</ThemedText>
                <ThemedText style={styles.statusValue}>{new Date(latest.startedAt).toLocaleString("nb-NO")}</ThemedText>
              </View>
            ) : null}
            {latest.finishedAt ? (
              <View style={styles.statusRow}>
                <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>Slutt</ThemedText>
                <ThemedText style={styles.statusValue}>{new Date(latest.finishedAt).toLocaleString("nb-NO")}</ThemedText>
              </View>
            ) : null}

            <View style={styles.resultsList}>
              {latest.results.map((result) => (
                <View key={result.name} style={styles.resultRow}>
                  <ThemedText style={styles.resultName}>{result.name}</ThemedText>
                  <View style={styles.resultMeta}>
                    <ThemedText style={[styles.resultStatus, { color: statusColor(result.status, theme) }]}>
                      {result.status}
                    </ThemedText>
                    <ThemedText style={[styles.resultDuration, { color: theme.textMuted }]}>@ {result.durationMs}ms</ThemedText>
                  </View>
                </View>
              ))}
            </View>

            {logs.length > 0 ? (
              <View style={[styles.logBox, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                {logs.map((line, index) => (
                  <ThemedText key={`${line}-${index}`} style={[styles.logLine, { color: theme.textSecondary }]}>
                    {line}
                  </ThemedText>
                ))}
              </View>
            ) : (
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>Ingen logger ennå.</ThemedText>
            )}
          </>
        ) : (
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>Ingen smoke test er kjørt ennå.</ThemedText>
        )}
      </View>
    </ScrollView>
  );
}

const statusColor = (status: string, theme: any) => {
  if (status === "passed") return theme.success;
  if (status === "failed") return theme.error;
  if (status === "running") return theme.accent;
  return theme.textSecondary;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 4 },
  modeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modeButton: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  modeText: { fontSize: 14, fontWeight: "600" },
  runButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
  },
  runButtonText: { fontSize: 14, fontWeight: "700", color: "#000" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: Spacing.sm },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  statusLabel: { fontSize: 12, fontWeight: "500" },
  statusValue: { fontSize: 12, fontWeight: "600" },
  resultsList: { marginTop: Spacing.md },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  resultName: { fontSize: 13, fontWeight: "600" },
  resultMeta: { flexDirection: "row", gap: Spacing.xs, alignItems: "center" },
  resultStatus: { fontSize: 12, fontWeight: "700" },
  resultDuration: { fontSize: 11 },
  logBox: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  logLine: { fontSize: 11, marginBottom: 4 },
  emptyText: { fontSize: 12, marginTop: Spacing.sm },
});
