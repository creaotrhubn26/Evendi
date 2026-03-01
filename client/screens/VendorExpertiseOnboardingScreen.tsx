import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
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
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { showToast } from "@/lib/toast";
import { EVENT_TYPES } from "@shared/event-types";

const VENDOR_SESSION_KEY = "evendi_vendor_session";

interface VendorExpertise {
  id?: string;
  vendorId: string;
  eventType: string;
  yearsExperience: number;
  completedEvents: number;
  isSpecialized: boolean;
  notes: string;
}

interface FormData {
  eventType: string;
  yearsExperience: number;
  completedEvents: number;
  isSpecialized: boolean;
  notes: string;
}

export default function VendorExpertiseOnboardingScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [expertise, setExpertise] = useState<VendorExpertise[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    eventType: "",
    yearsExperience: 0,
    completedEvents: 0,
    isSpecialized: false,
    notes: "",
  });

  // Load vendor session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem(VENDOR_SESSION_KEY);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          setSessionToken(session.token);
          setVendorId(session.vendorId);
        }
      } catch (error) {
        console.error("Error loading vendor session:", error);
      }
    };
    loadSession();
  }, []);

  // Fetch existing expertise
  const { data: existingExpertise, isLoading } = useQuery({
    queryKey: ["/api/vendor/expertise", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(
        new URL(`/api/vendor/expertise/${vendorId}`, getApiUrl()).toString(),
        {
          headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    },
    enabled: !!vendorId && !!sessionToken,
  });

  useEffect(() => {
    if (existingExpertise) {
      setExpertise(existingExpertise);
    }
  }, [existingExpertise]);

  // Add expertise mutation
  const addExpertiseMutation = useMutation({
    mutationFn: async (data: VendorExpertise) => {
      const response = await fetch(
        new URL("/api/vendor/expertise", getApiUrl()).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add expertise");
      }
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Ekspertise lagt til!");
      setShowForm(false);
      setFormData({
        eventType: "",
        yearsExperience: 0,
        completedEvents: 0,
        isSpecialized: false,
        notes: "",
      });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Feil ved lagring");
    },
  });

  // Delete expertise mutation
  const deleteExpertiseMutation = useMutation({
    mutationFn: async (expertiseId: string) => {
      const response = await fetch(
        new URL(`/api/vendor/expertise/${expertiseId}`, getApiUrl()).toString(),
        {
          method: "DELETE",
          headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
        }
      );
      if (!response.ok) throw new Error("Failed to delete expertise");
      return response.json();
    },
    onSuccess: () => {
      showToast("Ekspertise slettet");
    },
  });

  const handleAddExpertise = () => {
    if (!formData.eventType) {
      showToast("Velg en arrangementtype");
      return;
    }

    const newExpertise: VendorExpertise = {
      vendorId: vendorId || "",
      ...formData,
    };

    addExpertiseMutation.mutate(newExpertise);
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
        <ThemedText style={styles.headerTitle}>Min Ekspertise</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Existing Expertise */}
          {expertise.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Registrert Ekspertise</ThemedText>
              {expertise.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.expertiseCard,
                    { borderColor: theme.border, backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <View style={styles.expertiseHeader}>
                    <ThemedText style={styles.expertiseType}>
                      {getEventTypeLabel(item.eventType)}
                    </ThemedText>
                    {item.isSpecialized && (
                      <View
                        style={[
                          styles.specializedBadge,
                          { backgroundColor: theme.success },
                        ]}
                      >
                        <ThemedText style={styles.badgeText}>Spesialisert</ThemedText>
                      </View>
                    )}
                  </View>

                  <View style={styles.expertiseDetails}>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>År erfaring:</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {item.yearsExperience} år
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Gjennomførte arrangementer:</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {item.completedEvents}
                      </ThemedText>
                    </View>
                    {item.notes && (
                      <View style={styles.notesRow}>
                        <ThemedText style={styles.detailLabel}>Notat:</ThemedText>
                        <ThemedText style={styles.notesText}>{item.notes}</ThemedText>
                      </View>
                    )}
                  </View>

                  <Pressable
                    style={[
                      styles.deleteButton,
                      { backgroundColor: theme.error },
                    ]}
                    onPress={() => {
                      if (item.id) {
                        deleteExpertiseMutation.mutate(item.id);
                      }
                    }}
                  >
                    <Feather name="trash-2" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.deleteButtonText}>Slett</ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Onboarding Completion */}
          {expertise.length > 0 && !showForm && (
            <View style={styles.section}>
              <View
                style={[
                  styles.completionCard,
                  { backgroundColor: theme.primary + "10", borderColor: theme.primary },
                ]}
              >
                <Feather name="check-circle" size={24} color={theme.primary} />
                <ThemedText style={styles.completionTitle}>
                  Ekspertise registrert!
                </ThemedText>
                <ThemedText style={styles.completionSubtitle}>
                  Vil du aktivere tilgjengelighetssystemet?
                </ThemedText>
                <ThemedText style={styles.completionDescription}>
                  La par se når du er tilgjengelig for arrangement. Du kan alltid endre dette senere.
                </ThemedText>

                <View style={styles.completionActions}>
                  <Pressable
                    style={[
                      styles.completionButton,
                      styles.skipButton,
                      { borderColor: theme.border },
                    ]}
                    onPress={() => navigation.goBack()}
                  >
                    <ThemedText style={styles.skipButtonText}>Hoppa over</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.completionButton,
                      styles.activateButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => (navigation as any).navigate("VendorAvailabilitySettings")}
                  >
                    <Feather name="calendar" size={18} color="white" />
                    <ThemedText style={styles.activateButtonText}>
                      Aktiver Tilgjengelighet
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* Add New Expertise Form */}
          {!showForm ? (
            <Pressable
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowForm(true)}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText style={styles.addButtonText}>Legg til Ekspertise</ThemedText>
            </Pressable>
          ) : (
            <View
              style={[
                styles.formCard,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <ThemedText style={styles.formTitle}>Ny Ekspertise</ThemedText>

              {/* Event Type Selection */}
              <ThemedText style={styles.label}>Arrangementtype *</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.eventTypeScroll}
              >
                {EVENT_TYPES.map((eventType) => (
                  <Pressable
                    key={eventType}
                    style={[
                      styles.eventTypeButton,
                      {
                        backgroundColor:
                          formData.eventType === eventType
                            ? theme.primary
                            : theme.background,
                        borderColor:
                          formData.eventType === eventType
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, eventType })}
                  >
                    <ThemedText
                      style={[
                        styles.eventTypeButtonText,
                        {
                          color:
                            formData.eventType === eventType
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

              {/* Years of Experience */}
              <ThemedText style={styles.label}>År erfaring</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text },
                ]}
                placeholder="0"
                keyboardType="number-pad"
                value={formData.yearsExperience.toString()}
                onChangeText={(value) =>
                  setFormData({
                    ...formData,
                    yearsExperience: parseInt(value) || 0,
                  })
                }
                placeholderTextColor={theme.textSecondary}
              />

              {/* Completed Events */}
              <ThemedText style={styles.label}>Gjennomførte arrangementer</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text },
                ]}
                placeholder="0"
                keyboardType="number-pad"
                value={formData.completedEvents.toString()}
                onChangeText={(value) =>
                  setFormData({
                    ...formData,
                    completedEvents: parseInt(value) || 0,
                  })
                }
                placeholderTextColor={theme.textSecondary}
              />

              {/* Specialized Toggle */}
              <View style={styles.toggleRow}>
                <ThemedText style={styles.label}>Spesialisert i denne typen</ThemedText>
                <Switch
                  value={formData.isSpecialized}
                  onValueChange={(value) =>
                    setFormData({ ...formData, isSpecialized: value })
                  }
                  trackColor={{
                    false: theme.border,
                    true: theme.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Notes */}
              <ThemedText style={styles.label}>Notat (f.eks. størrelsesspenn)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.notesInput,
                  { borderColor: theme.border, color: theme.text },
                ]}
                placeholder="F.eks.: Vi spesialiserer oss på intim bryllup (20-80 gjester)"
                multiline
                numberOfLines={3}
                value={formData.notes}
                onChangeText={(value) =>
                  setFormData({ ...formData, notes: value })
                }
                placeholderTextColor={theme.textSecondary}
              />

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <Pressable
                  style={[
                    styles.cancelButton,
                    { borderColor: theme.border },
                  ]}
                  onPress={() => setShowForm(false)}
                >
                  <ThemedText style={styles.cancelButtonText}>Avbryt</ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: theme.primary,
                      opacity: addExpertiseMutation.isPending ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleAddExpertise}
                  disabled={addExpertiseMutation.isPending}
                >
                  {addExpertiseMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <ThemedText style={styles.submitButtonText}>Lagre Ekspertise</ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  expertiseCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  expertiseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  expertiseType: {
    fontSize: 16,
    fontWeight: "600",
  },
  specializedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  expertiseDetails: {
    marginVertical: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  notesRow: {
    marginTop: Spacing.sm,
  },
  notesText: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: "italic",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  formCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  eventTypeScroll: {
    marginBottom: Spacing.md,
  },
  eventTypeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  eventTypeButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
  },
  notesInput: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  completionCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  completionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  completionDescription: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  completionActions: {
    width: "100%",
    gap: Spacing.md,
  },
  completionButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  skipButton: {
    borderWidth: 1,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activateButton: {
    flexDirection: "row",
  },
  activateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
});
