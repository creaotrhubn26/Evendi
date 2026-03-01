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
import { useIsFocused, type RouteProp } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { EvendiIcon } from "@/components/EvendiIcon";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

/* ─── Types ─────────────────────────────────────────────────────── */

interface PlaywrightTestResult {
  title: string;
  fullTitle: string;
  project: string;
  status: "passed" | "failed" | "skipped" | "timedOut";
  duration: number;
  error?: string;
}

interface PlaywrightRun {
  id: string;
  status: "queued" | "running" | "passed" | "failed";
  startedAt?: string;
  finishedAt?: string;
  summary: { passed: number; failed: number; skipped: number; total: number };
  results: PlaywrightTestResult[];
  logs: string[];
  project?: string;
}

type Props = {
  route: RouteProp<RootStackParamList, "AdminPlaywright">;
};

const PROJECTS = [
  { key: undefined as string | undefined, label: "Alle" },
  { key: "evendi-api", label: "Evendi" },
  { key: "creatorhub-api", label: "CreatorHub" },
  { key: "bridge-api", label: "Bridge" },
];

/* ─── Component ─────────────────────────────────────────────────── */

export default function AdminPlaywrightScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const adminKey = route.params?.adminKey || "";

  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "failed" | "passed" | "skipped">("all");

  /* ── Query: poll latest run ─────────────────────────────── */
  const pwQuery = useQuery<{ latest: PlaywrightRun | null }>({
    queryKey: ["/api/admin/playwright", adminKey],
    queryFn: async () => {
      const url = new URL("/api/admin/playwright", getApiUrl());
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) throw new Error("Kunne ikke hente Playwright-status");
      return res.json();
    },
    enabled: adminKey.length > 0 && isFocused,
    refetchInterval: (query) =>
      isFocused && query.state.data?.latest?.status === "running" ? 3000 : false,
    refetchIntervalInBackground: false,
  });

  /* ── Mutation: start run ────────────────────────────────── */
  const startMutation = useMutation({
    mutationFn: async (project: string | undefined) => {
      const url = new URL("/api/admin/playwright", getApiUrl());
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({ project }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Kunne ikke starte Playwright");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/playwright", adminKey] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const latest = pwQuery.data?.latest || null;
  const isRunning = latest?.status === "running";

  /* ── Filtered results ───────────────────────────────────── */
  const filteredResults = useMemo(() => {
    if (!latest?.results) return [];
    let r = latest.results;
    if (filterStatus !== "all") {
      r = r.filter((t) =>
        filterStatus === "failed"
          ? t.status === "failed" || t.status === "timedOut"
          : t.status === filterStatus,
      );
    }
    return r;
  }, [latest?.results, filterStatus]);

  const logs = useMemo(() => {
    if (!latest?.logs?.length) return [];
    return latest.logs.slice(-300);
  }, [latest?.logs]);

  /* ── Helpers ────────────────────────────────────────────── */
  const statusIcon = (s: string) => {
    if (s === "passed") return "check-circle";
    if (s === "failed" || s === "timedOut") return "x-circle";
    if (s === "skipped") return "minus-circle";
    return "clock";
  };

  const badgeColor = (s: string) => {
    if (s === "passed") return theme.success || "#22c55e";
    if (s === "failed" || s === "timedOut") return theme.error || "#ef4444";
    if (s === "skipped") return theme.textMuted || "#888";
    return theme.accent;
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      {/* ── Header card ─────────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <View>
            <ThemedText style={styles.title}>Playwright E2E</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Kjør og overvåk alle API-tester
            </ThemedText>
          </View>
          {isRunning ? <ActivityIndicator color={theme.accent} /> : null}
        </View>

        {/* Project selector */}
        <View style={styles.projectRow}>
          {PROJECTS.map((p) => (
            <Pressable
              key={p.label}
              onPress={() => setSelectedProject(p.key)}
              style={[
                styles.projectButton,
                { borderColor: selectedProject === p.key ? theme.accent : theme.border },
                selectedProject === p.key && { backgroundColor: theme.accent + "15" },
              ]}
            >
              <ThemedText
                style={[styles.projectText, { color: selectedProject === p.key ? theme.accent : theme.text }]}
              >
                {p.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Run button */}
        <Pressable
          onPress={() => startMutation.mutate(selectedProject)}
          disabled={isRunning || startMutation.isPending}
          style={[
            styles.runButton,
            { backgroundColor: Colors.dark.accent },
            (isRunning || startMutation.isPending) && { opacity: 0.6 },
          ]}
        >
          <EvendiIcon name="play" size={18} color="#000" />
          <ThemedText style={styles.runButtonText}>
            {isRunning ? "Kjører tester…" : "Start Playwright"}
          </ThemedText>
        </Pressable>
      </View>

      {/* ── Summary card ────────────────────────────────────── */}
      {latest && latest.status !== "running" ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>Oppsummering</ThemedText>
          <View style={styles.summaryRow}>
            <SummaryBadge label="Bestått" count={latest.summary.passed} color={theme.success || "#22c55e"} />
            <SummaryBadge label="Feilet" count={latest.summary.failed} color={theme.error || "#ef4444"} />
            <SummaryBadge label="Hoppet" count={latest.summary.skipped} color={theme.textMuted || "#888"} />
            <SummaryBadge label="Totalt" count={latest.summary.total} color={theme.text} />
          </View>
          {latest.startedAt ? (
            <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
              Startet: {new Date(latest.startedAt).toLocaleString("nb-NO")}
            </ThemedText>
          ) : null}
          {latest.finishedAt ? (
            <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
              Ferdig: {new Date(latest.finishedAt).toLocaleString("nb-NO")}
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      {/* ── Results card ────────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <ThemedText style={styles.sectionTitle}>Testresultater</ThemedText>

        {/* Status filter tabs */}
        <View style={styles.filterRow}>
          {(["all", "failed", "passed", "skipped"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilterStatus(f)}
              style={[
                styles.filterButton,
                { borderColor: filterStatus === f ? theme.accent : theme.border },
                filterStatus === f && { backgroundColor: theme.accent + "15" },
              ]}
            >
              <ThemedText style={[styles.filterText, { color: filterStatus === f ? theme.accent : theme.text }]}>
                {f === "all" ? "Alle" : f === "failed" ? "Feilet" : f === "passed" ? "Bestått" : "Hoppet"}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {pwQuery.isLoading ? (
          <ActivityIndicator color={theme.accent} />
        ) : filteredResults.length > 0 ? (
          <View style={styles.resultsList}>
            {filteredResults.map((result, idx) => {
              const key = `${result.project}-${result.fullTitle}-${idx}`;
              const isExpanded = expandedTest === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setExpandedTest(isExpanded ? null : key)}
                  style={[styles.resultRow, { borderColor: theme.border }]}
                >
                  <View style={styles.resultHeader}>
                    <EvendiIcon name={statusIcon(result.status)} size={16} color={badgeColor(result.status)} />
                    <View style={styles.resultTextWrap}>
                      <ThemedText style={styles.resultTitle} numberOfLines={isExpanded ? undefined : 1}>
                        {result.title}
                      </ThemedText>
                      <ThemedText style={[styles.resultProject, { color: theme.textMuted }]}>
                        {result.project} · {result.duration}ms
                      </ThemedText>
                    </View>
                  </View>
                  {isExpanded && result.error ? (
                    <View style={[styles.errorBox, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                      <ThemedText style={[styles.errorText, { color: theme.error || "#ef4444" }]}>
                        {result.error}
                      </ThemedText>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : latest ? (
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            {filterStatus !== "all" ? "Ingen tester med dette filteret." : "Ingen resultater ennå."}
          </ThemedText>
        ) : (
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Ingen Playwright-kjøring er startet ennå.
          </ThemedText>
        )}
      </View>

      {/* ── Log card ────────────────────────────────────────── */}
      {logs.length > 0 ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>Logger</ThemedText>
          <View style={[styles.logBox, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
            {logs.map((line, i) => (
              <ThemedText key={`log-${i}`} style={[styles.logLine, { color: theme.textSecondary }]}>
                {line}
              </ThemedText>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

/* ─── Summary badge helper ──────────────────────────────────────── */

function SummaryBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={styles.summaryBadge}>
      <ThemedText style={[styles.summaryCount, { color }]}>{count}</ThemedText>
      <ThemedText style={[styles.summaryLabel, { color }]}>{label}</ThemedText>
    </View>
  );
}

/* ─── Status helpers ────────────────────────────────────────────── */

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

  /* Project selector */
  projectRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    flexWrap: "wrap",
  },
  projectButton: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  projectText: { fontSize: 13, fontWeight: "600" },

  /* Run button */
  runButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
  },
  runButtonText: { fontSize: 14, fontWeight: "700", color: "#000" },

  /* Summary */
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.sm,
  },
  summaryBadge: { alignItems: "center" },
  summaryCount: { fontSize: 24, fontWeight: "800" },
  summaryLabel: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  metaText: { fontSize: 11, marginTop: 2 },

  /* Filter tabs */
  filterRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  filterButton: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  filterText: { fontSize: 12, fontWeight: "600" },

  /* Results list */
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: Spacing.sm },
  resultsList: { marginTop: Spacing.xs },
  resultRow: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  resultTextWrap: { flex: 1 },
  resultTitle: { fontSize: 13, fontWeight: "600" },
  resultProject: { fontSize: 11, marginTop: 2 },

  /* Error detail */
  errorBox: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  errorText: { fontSize: 11, fontFamily: "monospace" },

  /* Logs */
  logBox: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.sm,
    maxHeight: 300,
  },
  logLine: { fontSize: 11, marginBottom: 3 },

  emptyText: { fontSize: 12, marginTop: Spacing.sm },
});
