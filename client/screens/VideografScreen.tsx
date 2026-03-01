import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { EvendiIcon } from "@/components/EvendiIcon";
import { getCoupleProfile } from "@/lib/api-couples";
import {
  createVideographerDeliverable,
  createVideographerSession,
  deleteVideographerDeliverable,
  deleteVideographerSession,
  getVideographerData,
  updateVideographerDeliverable,
  updateVideographerSession,
  updateVideographerTimeline,
  VideographerDeliverable,
  VideographerSession,
  VideographerTimeline,
} from "@/lib/api-couple-data";
import { showToast } from "@/lib/toast";
import { VendorCategoryMarketplace } from "@/components/VendorCategoryMarketplace";
import { PersistentTextInput } from "@/components/PersistentTextInput";
import { SwipeableRow } from "@/components/SwipeableRow";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { BorderRadius, Colors, Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { PlanningStackParamList } from "../navigation/PlanningStackNavigator";

type TabType = "sessions" | "timeline";
type NavigationProp = NativeStackNavigationProp<PlanningStackParamList>;
type TimelineFlagKey = "videographerSelected" | "sessionBooked" | "contractSigned" | "depositPaid";

const TIMELINE_STEPS: { key: TimelineFlagKey; label: string; icon: "check-circle" | "calendar" | "file-text" | "credit-card" }[] = [
  { key: "videographerSelected", label: "Videograf valgt", icon: "check-circle" },
  { key: "sessionBooked", label: "Videosesjon booket", icon: "calendar" },
  { key: "contractSigned", label: "Kontrakt signert", icon: "file-text" },
  { key: "depositPaid", label: "Depositum betalt", icon: "credit-card" },
];

const COUPLE_STORAGE_KEY = "evendi_couple_session";

export function VideografScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>("sessions");
  const [refreshing, setRefreshing] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionDate, setNewSessionDate] = useState("");
  const [newSessionTime, setNewSessionTime] = useState("");
  const [newSessionLocation, setNewSessionLocation] = useState("");

  const [newDeliverableTitle, setNewDeliverableTitle] = useState("");
  const [newDeliverableDescription, setNewDeliverableDescription] = useState("");
  const [newDeliverableFormat, setNewDeliverableFormat] = useState("");
  const [budgetInput, setBudgetInput] = useState("0");

  React.useEffect(() => {
    const loadSession = async () => {
      const data = await AsyncStorage.getItem(COUPLE_STORAGE_KEY);
      if (!data) return;
      const parsed = JSON.parse(data);
      setSessionToken(parsed?.sessionToken || null);
    };
    loadSession();
  }, []);

  const { data: coupleProfile } = useQuery({
    queryKey: ["coupleProfile"],
    queryFn: async () => {
      if (!sessionToken) throw new Error("No session");
      return getCoupleProfile(sessionToken);
    },
    enabled: !!sessionToken,
  });

  const { data: videographerData, isLoading: loading, refetch } = useQuery({
    queryKey: ["videographer-data"],
    queryFn: getVideographerData,
  });

  const sessions = useMemo(
    () => [...(videographerData?.sessions ?? [])].sort((a, b) => `${a.date || ""}${a.time || ""}`.localeCompare(`${b.date || ""}${b.time || ""}`)),
    [videographerData?.sessions],
  );
  const deliverables = useMemo(
    () => [...(videographerData?.deliverables ?? [])].sort((a, b) => Number(a.isConfirmed) - Number(b.isConfirmed)),
    [videographerData?.deliverables],
  );
  const timeline: VideographerTimeline = videographerData?.timeline ?? {
    videographerSelected: false,
    sessionBooked: false,
    contractSigned: false,
    depositPaid: false,
    budget: 0,
  };

  React.useEffect(() => {
    setBudgetInput(String(timeline.budget || 0));
  }, [timeline.budget]);

  const createSessionMutation = useMutation({
    mutationFn: createVideographerSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videographer-data"] }),
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VideographerSession> }) => updateVideographerSession(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videographer-data"] }),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: deleteVideographerSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videographer-data"] }),
  });

  const createDeliverableMutation = useMutation({
    mutationFn: createVideographerDeliverable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videographer-data"] }),
  });

  const updateDeliverableMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VideographerDeliverable> }) => updateVideographerDeliverable(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videographer-data"] }),
  });

  const deleteDeliverableMutation = useMutation({
    mutationFn: deleteVideographerDeliverable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videographer-data"] }),
  });

  const updateTimelineMutation = useMutation({
    mutationFn: updateVideographerTimeline,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videographer-data"] }),
  });

  const duplicateSession = async (session: VideographerSession) => {
    try {
      await createSessionMutation.mutateAsync({
        title: `Kopi av ${session.title}`,
        date: session.date || "",
        time: session.time || "",
        location: session.location || "",
        completed: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke duplisere videosesjon";
      showToast(message);
    }
  };

  const duplicateDeliverable = async (deliverable: VideographerDeliverable) => {
    try {
      await createDeliverableMutation.mutateAsync({
        title: `Kopi av ${deliverable.title}`,
        description: deliverable.description || "",
        format: deliverable.format || "1080p",
        duration: deliverable.duration || "",
        deliveryDate: deliverable.deliveryDate || "",
        notes: deliverable.notes || "",
        isConfirmed: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke duplisere leveranse";
      showToast(message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleFindVideographer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("VendorMatching", { category: "videographer" });
  };

  const handleCreateSession = async () => {
    const title = newSessionTitle.trim();
    if (!title || !newSessionDate.trim()) {
      showToast("Legg inn tittel og dato for videosesjon.");
      return;
    }
    try {
      await createSessionMutation.mutateAsync({
        title,
        date: newSessionDate.trim(),
        time: newSessionTime.trim(),
        location: newSessionLocation.trim(),
        completed: false,
      });
      setNewSessionTitle("");
      setNewSessionDate("");
      setNewSessionTime("");
      setNewSessionLocation("");
      showToast("Videosesjon opprettet.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke opprette videosesjon";
      showToast(message);
    }
  };

  const handleCreateDeliverable = async () => {
    const title = newDeliverableTitle.trim();
    if (!title) {
      showToast("Legg inn navn på leveransen.");
      return;
    }
    try {
      await createDeliverableMutation.mutateAsync({
        title,
        description: newDeliverableDescription.trim(),
        format: newDeliverableFormat.trim() || "1080p",
        duration: "",
        deliveryDate: "",
        notes: "",
        isConfirmed: false,
      });
      setNewDeliverableTitle("");
      setNewDeliverableDescription("");
      setNewDeliverableFormat("");
      showToast("Videoleveranse lagt til.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke legge til leveranse";
      showToast(message);
    }
  };

  const toggleSessionCompletion = async (session: VideographerSession) => {
    try {
      await updateSessionMutation.mutateAsync({
        id: session.id,
        data: { completed: !session.completed },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke oppdatere videosesjon";
      showToast(message);
    }
  };

  const toggleDeliverableConfirmed = async (deliverable: VideographerDeliverable) => {
    try {
      await updateDeliverableMutation.mutateAsync({
        id: deliverable.id,
        data: { isConfirmed: !deliverable.isConfirmed },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke oppdatere leveranse";
      showToast(message);
    }
  };

  const toggleTimelineStep = async (key: TimelineFlagKey) => {
    const payload: Partial<Record<TimelineFlagKey, boolean>> = {
      [key]: !timeline[key],
    };
    try {
      await updateTimelineMutation.mutateAsync(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke oppdatere tidslinje";
      showToast(message);
    }
  };

  const saveBudget = async () => {
    const parsedBudget = Number.parseInt(budgetInput, 10);
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      showToast("Budsjett må være et gyldig tall.");
      return;
    }
    try {
      await updateTimelineMutation.mutateAsync({ budget: parsedBudget });
      showToast("Videobudsjett oppdatert.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke lagre budsjett";
      showToast(message);
    }
  };

  const isBusy =
    createSessionMutation.isPending ||
    updateSessionMutation.isPending ||
    deleteSessionMutation.isPending ||
    createDeliverableMutation.isPending ||
    updateDeliverableMutation.isPending ||
    deleteDeliverableMutation.isPending ||
    updateTimelineMutation.isPending;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={["bottom"]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <VendorCategoryMarketplace
          category="videographer"
          categoryName="Videograf"
          icon="video"
          subtitle="Finn videografen som fanger følelsene"
          selectedTraditions={coupleProfile?.selectedTraditions}
        />

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Videoplan</ThemedText>
          <ThemedText style={[styles.helperText, { color: theme.textSecondary }]}>
            Planlegg opptak og leveranser, og send tydelig brief før bryllupet.
          </ThemedText>
          <Button onPress={handleFindVideographer}>Finn videograf</Button>
        </View>

        <View style={[styles.tabBar, { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
          <Pressable
            style={[styles.tab, activeTab === "sessions" && styles.activeTab]}
            onPress={() => {
              setActiveTab("sessions");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <ThemedText style={[styles.tabText, activeTab === "sessions" && { color: Colors.dark.accent }]}>
              Økter
            </ThemedText>
            {activeTab === "sessions" ? <View style={[styles.tabIndicator, { backgroundColor: Colors.dark.accent }]} /> : null}
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "timeline" && styles.activeTab]}
            onPress={() => {
              setActiveTab("timeline");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <ThemedText style={[styles.tabText, activeTab === "timeline" && { color: Colors.dark.accent }]}>
              Tidslinje
            </ThemedText>
            {activeTab === "timeline" ? <View style={[styles.tabIndicator, { backgroundColor: Colors.dark.accent }]} /> : null}
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={theme.accent} />
            <ThemedText style={{ color: theme.textSecondary }}>Laster videografdata...</ThemedText>
          </View>
        ) : null}

        {activeTab === "sessions" ? (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.sectionStack}>
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Ny videosesjon</ThemedText>
              <PersistentTextInput
                draftKey="videographer-session-title"
                value={newSessionTitle}
                onChangeText={setNewSessionTitle}
                placeholder="Tittel (f.eks. Forberedelser)"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              />
              <View style={styles.inputRow}>
                <TextInput
                  value={newSessionDate}
                  onChangeText={setNewSessionDate}
                  placeholder="Dato (YYYY-MM-DD)"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, styles.halfInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSecondary }]}
                />
                <TextInput
                  value={newSessionTime}
                  onChangeText={setNewSessionTime}
                  placeholder="Tid (HH:MM)"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, styles.halfInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSecondary }]}
                />
              </View>
              <TextInput
                value={newSessionLocation}
                onChangeText={setNewSessionLocation}
                placeholder="Lokasjon"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              />
              <Button onPress={handleCreateSession} disabled={isBusy}>
                {createSessionMutation.isPending ? "Lagrer..." : "Legg til sesjon"}
              </Button>
            </View>

            <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Planlagte videosesjoner ({sessions.length})</ThemedText>
              {sessions.length === 0 ? (
                <View style={styles.emptyState}>
                  <EvendiIcon name="video" size={42} color={theme.textMuted} />
                  <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>Ingen videosesjoner registrert enda.</ThemedText>
                </View>
              ) : (
                sessions.map((session) => (
                  <SwipeableRow
                    key={session.id}
                    onDelete={() => deleteSessionMutation.mutate(session.id)}
                    onEdit={() => duplicateSession(session)}
                  >
                    <View style={[styles.row, { borderBottomColor: theme.border, backgroundColor: theme.backgroundSecondary }]}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.rowTitle, { color: theme.text }]}>{session.title}</ThemedText>
                        <ThemedText style={[styles.rowSub, { color: theme.textSecondary }]}>
                          {session.date || "Dato mangler"} {session.time ? `• ${session.time}` : ""} {session.location ? `• ${session.location}` : ""}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        onPress={() => toggleSessionCompletion(session)}
                        style={[styles.quickActionButton, { backgroundColor: session.completed ? `${theme.success}22` : `${theme.accent}22` }]}
                      >
                        <EvendiIcon name={session.completed ? "check-circle" : "circle"} size={16} color={session.completed ? theme.success : theme.accent} />
                      </TouchableOpacity>
                    </View>
                  </SwipeableRow>
                ))
              )}
            </View>

            <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Leveranser ({deliverables.length})</ThemedText>
              <PersistentTextInput
                draftKey="videographer-deliverable-title"
                value={newDeliverableTitle}
                onChangeText={setNewDeliverableTitle}
                placeholder="Leveranse (f.eks. Highlight film)"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              />
              <TextInput
                value={newDeliverableDescription}
                onChangeText={setNewDeliverableDescription}
                placeholder="Beskrivelse"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              />
              <TextInput
                value={newDeliverableFormat}
                onChangeText={setNewDeliverableFormat}
                placeholder="Format (f.eks. 4K, 1080p)"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              />
              <Button onPress={handleCreateDeliverable} disabled={isBusy}>
                {createDeliverableMutation.isPending ? "Lagrer..." : "Legg til leveranse"}
              </Button>

              {deliverables.map((deliverable) => (
                <SwipeableRow
                  key={deliverable.id}
                  onDelete={() => deleteDeliverableMutation.mutate(deliverable.id)}
                  onEdit={() => duplicateDeliverable(deliverable)}
                >
                  <View style={[styles.row, { borderBottomColor: theme.border, backgroundColor: theme.backgroundSecondary }]}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.rowTitle, { color: theme.text }]}>{deliverable.title}</ThemedText>
                      <ThemedText style={[styles.rowSub, { color: theme.textSecondary }]}>
                        {deliverable.format || "Format ikke satt"} {deliverable.description ? `• ${deliverable.description}` : ""}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleDeliverableConfirmed(deliverable)}
                      style={[styles.quickActionButton, { backgroundColor: deliverable.isConfirmed ? `${theme.success}22` : `${theme.accent}22` }]}
                    >
                      <EvendiIcon name={deliverable.isConfirmed ? "check-circle" : "circle"} size={16} color={deliverable.isConfirmed ? theme.success : theme.accent} />
                    </TouchableOpacity>
                  </View>
                </SwipeableRow>
              ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.sectionStack}>
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Videotidslinje</ThemedText>
              {TIMELINE_STEPS.map((step) => {
                const isDone = Boolean(timeline[step.key]);
                return (
                  <Pressable
                    key={step.key}
                    onPress={() => toggleTimelineStep(step.key)}
                    style={[styles.timelineRow, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
                  >
                    <View style={[styles.timelineIconCircle, { backgroundColor: isDone ? `${theme.success}22` : `${theme.accent}22` }]}>
                      <EvendiIcon name={step.icon} size={16} color={isDone ? theme.success : theme.accent} />
                    </View>
                    <ThemedText style={[styles.timelineLabel, { color: theme.text }]}>{step.label}</ThemedText>
                    <ThemedText style={{ color: isDone ? theme.success : theme.textSecondary, fontSize: 12 }}>
                      {isDone ? "Ferdig" : "Ikke ferdig"}
                    </ThemedText>
                  </Pressable>
                );
              })}

              <View style={styles.budgetRow}>
                <TextInput
                  value={budgetInput}
                  onChangeText={setBudgetInput}
                  placeholder="Budsjett (NOK)"
                  keyboardType="number-pad"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, styles.budgetInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSecondary }]}
                />
                <Button onPress={saveBudget} style={styles.budgetButton} disabled={isBusy}>
                  Lagre
                </Button>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: Spacing.xl },
  card: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  helperText: { fontSize: 13 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginTop: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    position: "relative",
  },
  activeTab: {},
  tabText: { fontSize: 15, fontWeight: "600" },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  loadingBox: {
    marginTop: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  sectionStack: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  row: {
    borderBottomWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  rowSub: {
    fontSize: 12,
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  timelineRow: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  timelineIconCircle: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  budgetInput: {
    flex: 1,
  },
  budgetButton: {
    minWidth: 90,
  },
});
