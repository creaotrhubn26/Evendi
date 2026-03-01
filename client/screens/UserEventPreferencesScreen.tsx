import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation, useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { showToast } from "@/lib/toast";
import { EVENT_TYPES, EVENT_CATEGORIES } from "@shared/event-types";

const COUPLE_SESSION_KEY = "evendi_couple_session";

interface UserPreferences {
  coupleId: string;
  eventType: string;
  eventCategory: "personal" | "corporate";
  guestCount?: number;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  eventLocation?: string;
  eventLocationRadius?: number;
  desiredEventVibe?: string[];
  specialRequirements?: string;
  vendorPreferences?: {
    categories?: string[];
    languages?: string[];
  };
}

export default function UserEventPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    eventCategory: "personal",
    currency: "NOK",
    desiredEventVibe: [],
  });

  const [vibeOptions] = useState([
    "Intim",
    "Luxuriøs",
    "Lekfull",
    "Profesjonell",
    "Rustikk",
    "Moderne",
    "Klassisk",
    "Kreativ",
  ]);

  // Load couple session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem(COUPLE_SESSION_KEY);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          setSessionToken(session.sessionToken);
          setCoupleId(session.coupleId);
        }
      } catch (error) {
        console.error("Error loading couple session:", error);
      }
    };
    loadSession();
  }, []);

  // Fetch existing preferences
  const { data: existingPreferences, isLoading: isFetching } = useQuery({
    queryKey: ["/api/user/preferences", coupleId],
    queryFn: async () => {
      if (!coupleId) return null;
      const response = await fetch(
        new URL(`/api/user/preferences/${coupleId}`, getApiUrl()).toString(),
        {
          headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return null;
    },
    enabled: !!coupleId && !!sessionToken,
  });

  useEffect(() => {
    if (existingPreferences) {
      setPreferences(existingPreferences);
    }
  }, [existingPreferences]);

  // Save preferences mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      if (!coupleId) throw new Error("No couple ID");
      const response = await fetch(
        new URL("/api/user/preferences", getApiUrl()).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          },
          body: JSON.stringify({ coupleId, ...data }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save preferences");
      }
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Preferanser lagret!");
      // Navigate to vendor search results
      (navigation as any).navigate("VendorSearchResults");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Feil ved lagring");
    },
  });

  const handleSave = () => {
    if (!preferences.eventType) {
      showToast("Velg en arrangementtype");
      return;
    }
    if (!preferences.eventCategory) {
      showToast("Velg kategori");
      return;
    }
    saveMutation.mutate(preferences);
  };

  const getEventTypeLabel = (eventType: string): string => {
    const labels: Record<string, string> = {
      wedding: "Bryllup",
      confirmation: "Konfirmasjon",
      birthday: "Bursdager",
      anniversary: "Jubileum",
      engagement: "Forlovelse",
      baby_shower: "Baby shower",
      conference: "Konferanse",
      seminar: "Seminar",
      kickoff: "Kickoff",
      summer_party: "Sommerfest",
      christmas_party: "Julefest",
      team_building: "Teambuilding",
      product_launch: "Produktlansering",
      trade_fair: "Handelsmesse",
      corporate_anniversary: "Bedriftsjubileum",
      awards_night: "Prisutdeling",
      employee_day: "Ansattdag",
      onboarding_day: "Oppstartdag",
      corporate_event: "Bedriftsarrangement",
    };
    return labels[eventType] || eventType;
  };

  const toggleVibe = (vibe: string) => {
    setPreferences((prev) => ({
      ...prev,
      desiredEventVibe: (prev.desiredEventVibe || []).includes(vibe)
        ? (prev.desiredEventVibe || []).filter((v) => v !== vibe)
        : [...(prev.desiredEventVibe || []), vibe],
    }));
  };

  if (isFetching) {
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
        <ThemedText style={styles.headerTitle}>Min Arrangement</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Type */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Arrangementtype *</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typeScroll}
          >
            {EVENT_TYPES.map((eventType) => (
              <Pressable
                key={eventType}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      preferences.eventType === eventType
                        ? theme.primary
                        : theme.background,
                    borderColor:
                      preferences.eventType === eventType
                        ? theme.primary
                        : theme.border,
                  },
                ]}
                onPress={() => setPreferences({ ...preferences, eventType })}
              >
                <ThemedText
                  style={[
                    styles.typeButtonText,
                    {
                      color:
                        preferences.eventType === eventType
                          ? "#FFFFFF"
                          : theme.text,
                    },
                  ]}
                >
                  {getEventTypeLabel(eventType)}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Event Category */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Kategori *</ThemedText>
          <View style={styles.categoryRow}>
            {EVENT_CATEGORIES.map((category) => (
              <Pressable
                key={category}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor:
                      preferences.eventCategory === category
                        ? theme.primary
                        : theme.background,
                    borderColor:
                      preferences.eventCategory === category
                        ? theme.primary
                        : theme.border,
                  },
                ]}
                onPress={() =>
                  setPreferences({ ...preferences, eventCategory: category as any })
                }
              >
                <ThemedText
                  style={[
                    styles.categoryButtonText,
                    {
                      color:
                        preferences.eventCategory === category
                          ? "#FFFFFF"
                          : theme.text,
                    },
                  ]}
                >
                  {category === "personal" ? "Privat" : "Bedrift"}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Guest Count */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Antall gjester</ThemedText>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            placeholder="f.eks. 100"
            keyboardType="number-pad"
            value={preferences.guestCount?.toString() || ""}
            onChangeText={(value) =>
              setPreferences({
                ...preferences,
                guestCount: parseInt(value) || undefined,
              })
            }
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Budget</ThemedText>
          <View style={styles.budgetRow}>
            <View style={styles.budgetInput}>
              <ThemedText style={styles.budgetLabel}>Fra</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text },
                ]}
                placeholder="Min"
                keyboardType="number-pad"
                value={preferences.budgetMin?.toString() || ""}
                onChangeText={(value) =>
                  setPreferences({
                    ...preferences,
                    budgetMin: parseInt(value) || undefined,
                  })
                }
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <View style={styles.budgetInput}>
              <ThemedText style={styles.budgetLabel}>Til</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text },
                ]}
                placeholder="Maks"
                keyboardType="number-pad"
                value={preferences.budgetMax?.toString() || ""}
                onChangeText={(value) =>
                  setPreferences({
                    ...preferences,
                    budgetMax: parseInt(value) || undefined,
                  })
                }
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Sted</ThemedText>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            placeholder="f.eks. Oslo, Bergen"
            value={preferences.eventLocation || ""}
            onChangeText={(value) =>
              setPreferences({ ...preferences, eventLocation: value })
            }
            placeholderTextColor={theme.textSecondary}
          />
          <ThemedText style={styles.label}>Radius (km)</ThemedText>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text },
            ]}
            placeholder="Reiseavstand"
            keyboardType="number-pad"
            value={preferences.eventLocationRadius?.toString() || ""}
            onChangeText={(value) =>
              setPreferences({
                ...preferences,
                eventLocationRadius: parseInt(value) || undefined,
              })
            }
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* Event Vibe */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Ønsket stil</ThemedText>
          <View style={styles.vibeGrid}>
            {vibeOptions.map((vibe) => (
              <Pressable
                key={vibe}
                style={[
                  styles.vibeButton,
                  {
                    backgroundColor: (preferences.desiredEventVibe || []).includes(vibe)
                      ? theme.primary
                      : theme.background,
                    borderColor: (preferences.desiredEventVibe || []).includes(vibe)
                      ? theme.primary
                      : theme.border,
                  },
                ]}
                onPress={() => toggleVibe(vibe)}
              >
                <ThemedText
                  style={[
                    styles.vibeButtonText,
                    {
                      color: (preferences.desiredEventVibe || []).includes(vibe)
                        ? "#FFFFFF"
                        : theme.text,
                    },
                  ]}
                >
                  {vibe}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Special Requirements */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Spesielle krav</ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { borderColor: theme.border, color: theme.text },
            ]}
            placeholder="f.eks. Vegetarmat, allergier, spesielle ønsker..."
            multiline
            numberOfLines={3}
            value={preferences.specialRequirements || ""}
            onChangeText={(value) =>
              setPreferences({ ...preferences, specialRequirements: value })
            }
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* Save Button */}
        <Pressable
          style={[
            styles.saveButton,
            {
              backgroundColor: theme.primary,
              opacity: saveMutation.isPending ? 0.6 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="save" size={18} color="#FFFFFF" />
              <ThemedText style={styles.saveButtonText}>Lagre Preferanser</ThemedText>
            </>
          )}
        </Pressable>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  typeScroll: {
    marginBottom: Spacing.md,
  },
  typeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  categoryRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  categoryButton: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  budgetRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  budgetInput: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  vibeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  vibeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  vibeButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  textArea: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
