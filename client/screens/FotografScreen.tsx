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
import { EmptyStateIllustration } from "@/components/EmptyStateIllustration";
import { getCoupleProfile } from "@/lib/api-couples";
import {
  createPhotographerSession,
  createPhotographerShot,
  deletePhotographerSession,
  deletePhotographerShot,
  getPhotographerData,
  PhotographerSession,
  PhotographerShot,
  PhotographerTimeline,
  updatePhotographerSession,
  updatePhotographerShot,
  updatePhotographerTimeline,
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
type TimelineFlagKey = "photographerSelected" | "sessionBooked" | "contractSigned" | "depositPaid";

const TIMELINE_STEPS: { key: TimelineFlagKey; label: string; icon: "check-circle" | "calendar" | "file-text" | "credit-card" }[] = [
  { key: "photographerSelected", label: "Fotograf valgt", icon: "check-circle" },
  { key: "sessionBooked", label: "Fotosesjon booket", icon: "calendar" },
  { key: "contractSigned", label: "Kontrakt signert", icon: "file-text" },
  { key: "depositPaid", label: "Depositum betalt", icon: "credit-card" },
];

const COUPLE_STORAGE_KEY = "evendi_couple_session";

export function FotografScreen() {
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

  const [newShotTitle, setNewShotTitle] = useState("");
  const [newShotDescription, setNewShotDescription] = useState("");
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

  const { data: photographerData, isLoading: loading, refetch } = useQuery({
    queryKey: ["photographer-data"],
    queryFn: getPhotographerData,
  });

  const sessions = useMemo(
    () => [...(photographerData?.sessions ?? [])].sort((a, b) => `${a.date || ""}${a.time || ""}`.localeCompare(`${b.date || ""}${b.time || ""}`)),
    [photographerData?.sessions],
  );
  const shots = useMemo(
    () => [...(photographerData?.shots ?? [])].sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0)),
    [photographerData?.shots],
  );
  const timeline: PhotographerTimeline = photographerData?.timeline ?? {
    photographerSelected: false,
    sessionBooked: false,
    contractSigned: false,
    depositPaid: false,
    budget: 0,
  };

  React.useEffect(() => {
    setBudgetInput(String(timeline.budget || 0));
  }, [timeline.budget]);

  const createSessionMutation = useMutation({
    mutationFn: createPhotographerSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["photographer-data"] }),
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PhotographerSession> }) => updatePhotographerSession(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["photographer-data"] }),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: deletePhotographerSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["photographer-data"] }),
  });

  const createShotMutation = useMutation({
    mutationFn: createPhotographerShot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["photographer-data"] }),
  });

  const updateShotMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PhotographerShot> }) => updatePhotographerShot(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["photographer-data"] }),
  });

  const deleteShotMutation = useMutation({
    mutationFn: deletePhotographerShot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["photographer-data"] }),
  });

  const updateTimelineMutation = useMutation({
    mutationFn: updatePhotographerTimeline,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["photographer-data"] }),
  });

  const duplicateSession = async (session: PhotographerSession) => {
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
      const message = error instanceof Error ? error.message : "Kunne ikke duplisere sesjon";
      showToast(message);
    }
  };

  const duplicateShot = async (shot: PhotographerShot) => {
    try {
      await createShotMutation.mutateAsync({
        title: `Kopi av ${shot.title}`,
        description: shot.description || "",
        category: shot.category || "general",
        priority: shot.priority || 1,
        isSelected: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke duplisere bilde";
      showToast(message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleFindPhotographer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("VendorMatching", { category: "photographer" });
  };

  const handleCreateSession = async () => {
    const title = newSessionTitle.trim();
    if (!title || !newSessionDate.trim()) {
      showToast("Legg inn tittel og dato for økten.");
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
      showToast("Fotoøkt opprettet.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke opprette fotoøkt";
      showToast(message);
    }
  };

  const handleCreateShot = async () => {
    const title = newShotTitle.trim();
    if (!title) {
      showToast("Legg inn navn på ønsket bilde.");
      return;
    }
    try {
      await createShotMutation.mutateAsync({
        title,
        description: newShotDescription.trim(),
        category: "must-have",
        priority: 2,
        isSelected: true,
      });
      setNewShotTitle("");
      setNewShotDescription("");
      showToast("Bildeønske lagt til.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke legge til bildeønske";
      showToast(message);
    }
  };

  const toggleSessionCompletion = async (session: PhotographerSession) => {
    try {
      await updateSessionMutation.mutateAsync({
        id: session.id,
        data: { completed: !session.completed },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke oppdatere økten";
      showToast(message);
    }
  };

  const toggleShotSelection = async (shot: PhotographerShot) => {
    try {
      await updateShotMutation.mutateAsync({
        id: shot.id,
        data: { isSelected: !shot.isSelected },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke oppdatere bildeønske";
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
      showToast("Fotobudsjett oppdatert.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke lagre budsjett";
      showToast(message);
    }
  };

  const isBusy =
    createSessionMutation.isPending ||
    updateSessionMutation.isPending ||
    deleteSessionMutation.isPending ||
    createShotMutation.isPending ||
    updateShotMutation.isPending ||
    deleteShotMutation.isPending ||
    updateTimelineMutation.isPending;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={["bottom"]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <VendorCategoryMarketplace
          category="photographer"
          categoryName="Fotograf"
          icon="camera"
          subtitle="Finn og book den perfekte fotografen"
          selectedTraditions={coupleProfile?.selectedTraditions}
        />

        <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Fotografplan</ThemedText>
          <ThemedText style={[styles.helperText, { color: theme.textSecondary }]}>
            Legg inn økter og bildeønsker før du deler briefen med fotograf.
          </ThemedText>
          <Button onPress={handleFindPhotographer}>Finn fotograf</Button>
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
            <ThemedText style={{ color: theme.textSecondary }}>Laster fotografdata...</ThemedText>
          </View>
        ) : null}

        {activeTab === "sessions" ? (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.sectionStack}>
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Ny fotoøkt</ThemedText>
              <PersistentTextInput
                draftKey="photographer-session-title"
                value={newSessionTitle}
                onChangeText={setNewSessionTitle}
                placeholder="Tittel (f.eks. Portrett ved solnedgang)"
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
                {createSessionMutation.isPending ? "Lagrer..." : "Legg til økt"}
              </Button>
            </View>

            <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Planlagte fotoøkter ({sessions.length})</ThemedText>
              {sessions.length === 0 ? (
                <View style={styles.emptyState}>
                  <EmptyStateIllustration stateKey="photographer" />
                  <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>Ingen fotoøkter registrert enda.</ThemedText>
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
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Shotlist ({shots.length})</ThemedText>
              <PersistentTextInput
                draftKey="photographer-shot-title"
                value={newShotTitle}
                onChangeText={setNewShotTitle}
                placeholder="Bildeønske (f.eks. Familieportrett)"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              />
              <TextInput
                value={newShotDescription}
                onChangeText={setNewShotDescription}
                placeholder="Beskrivelse / ønsket stemning"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              />
              <Button onPress={handleCreateShot} disabled={isBusy}>
                {createShotMutation.isPending ? "Lagrer..." : "Legg til bildeønske"}
              </Button>

              {shots.map((shot) => (
                <SwipeableRow
                  key={shot.id}
                  onDelete={() => deleteShotMutation.mutate(shot.id)}
                  onEdit={() => duplicateShot(shot)}
                >
                  <View style={[styles.row, { borderBottomColor: theme.border, backgroundColor: theme.backgroundSecondary }]}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.rowTitle, { color: theme.text }]}>{shot.title}</ThemedText>
                      <ThemedText style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={2}>
                        {shot.description || "Ingen beskrivelse"}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleShotSelection(shot)}
                      style={[styles.quickActionButton, { backgroundColor: shot.isSelected ? `${theme.success}22` : `${theme.accent}22` }]}
                    >
                      <EvendiIcon name={shot.isSelected ? "check-circle" : "circle"} size={16} color={shot.isSelected ? theme.success : theme.accent} />
                    </TouchableOpacity>
                  </View>
                </SwipeableRow>
              ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.sectionStack}>
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Fototidslinje</ThemedText>
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
