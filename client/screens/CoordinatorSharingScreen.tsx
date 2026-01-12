import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  TextInput,
  Switch,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getApiUrl, apiRequest } from "@/lib/query-client";

const COUPLE_STORAGE_KEY = "wedflow_couple_session";

interface CoordinatorInvitation {
  id: string;
  name: string;
  email: string | null;
  roleLabel: string;
  accessToken: string;
  accessCode: string | null;
  canViewSpeeches: boolean;
  canViewSchedule: boolean;
  canEditSpeeches: boolean;
  canEditSchedule: boolean;
  status: string;
  lastAccessedAt: string | null;
  createdAt: string;
}

export default function CoordinatorSharingScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Toastmaster");
  const [canViewSpeeches, setCanViewSpeeches] = useState(true);
  const [canViewSchedule, setCanViewSchedule] = useState(true);
  const [canEditSpeeches, setCanEditSpeeches] = useState(false);
  const [canEditSchedule, setCanEditSchedule] = useState(false);

  const { data: coordinators = [], isLoading, isRefetching, refetch } = useQuery<CoordinatorInvitation[]>({
    queryKey: ["/api/couple/coordinators"],
    queryFn: async () => {
      const sessionData = await AsyncStorage.getItem(COUPLE_STORAGE_KEY);
      if (!sessionData) return [];
      const session = JSON.parse(sessionData);
      const response = await fetch(new URL("/api/couple/coordinators", getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${session.sessionToken}` },
      });
      if (!response.ok) throw new Error("Kunne ikke hente koordinatorer");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; roleLabel: string; canViewSpeeches: boolean; canViewSchedule: boolean; canEditSpeeches: boolean; canEditSchedule: boolean }) => {
      const sessionData = await AsyncStorage.getItem(COUPLE_STORAGE_KEY);
      if (!sessionData) throw new Error("Ikke innlogget");
      const session = JSON.parse(sessionData);

      const response = await fetch(new URL("/api/couple/coordinators", getApiUrl()).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.sessionToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Kunne ikke opprette invitasjon");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/couple/coordinators"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
      setNewName("");
      setNewRole("Toastmaster");
      setCanEditSpeeches(false);
      setCanEditSchedule(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const sessionData = await AsyncStorage.getItem(COUPLE_STORAGE_KEY);
      if (!sessionData) throw new Error("Ikke innlogget");
      const session = JSON.parse(sessionData);

      const response = await fetch(new URL(`/api/couple/coordinators/${id}`, getApiUrl()).toString(), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.sessionToken}` },
      });

      if (!response.ok) throw new Error("Kunne ikke slette invitasjon");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/couple/coordinators"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) {
      Alert.alert("Feil", "Navn er påkrevd");
      return;
    }
    createMutation.mutate({
      name: newName.trim(),
      roleLabel: newRole.trim() || "Toastmaster",
      canViewSpeeches,
      canViewSchedule,
      canEditSpeeches,
      canEditSchedule,
    });
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Fjern tilgang",
      `Er du sikker på at du vil fjerne ${name} sin tilgang?`,
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Fjern",
          style: "destructive",
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  const copyLink = async (token: string) => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN || "wedflow.app";
    const link = `https://${domain}/coordinator/${token}`;
    await Clipboard.setStringAsync(link);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Kopiert!", "Delenke er kopiert til utklippstavlen");
  };

  const copyCode = async (code: string | null) => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Kopiert!", "Tilgangskode er kopiert");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "active":
        return { label: "Aktiv", color: "#4CAF50" };
      case "revoked":
        return { label: "Tilbakekalt", color: "#F44336" };
      case "expired":
        return { label: "Utløpt", color: "#9E9E9E" };
      default:
        return { label: status, color: theme.textMuted };
    }
  };

  const renderCoordinator = ({ item, index }: { item: CoordinatorInvitation; index: number }) => {
    const status = getStatusInfo(item.status);

    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
        <Card style={styles.coordinatorCard}>
          <View style={styles.cardHeader}>
            <View style={styles.coordinatorInfo}>
              <View style={[styles.roleIcon, { backgroundColor: Colors.dark.accent + "20" }]}>
                <Feather name="user" size={20} color={Colors.dark.accent} />
              </View>
              <View style={styles.nameSection}>
                <ThemedText style={styles.coordinatorName}>{item.name}</ThemedText>
                <ThemedText style={[styles.roleLabel, { color: theme.textMuted }]}>
                  {item.roleLabel}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.color + "20" }]}>
              <ThemedText style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.permissionsRow, { borderTopColor: theme.border }]}>
            <View style={styles.permission}>
              <Feather
                name={item.canViewSpeeches ? "check-circle" : "x-circle"}
                size={14}
                color={item.canViewSpeeches ? "#4CAF50" : theme.textMuted}
              />
              <ThemedText style={[styles.permissionText, { color: item.canViewSpeeches ? theme.text : theme.textMuted }]}>
                Se taler
              </ThemedText>
            </View>
            <View style={styles.permission}>
              <Feather
                name={item.canViewSchedule ? "check-circle" : "x-circle"}
                size={14}
                color={item.canViewSchedule ? "#4CAF50" : theme.textMuted}
              />
              <ThemedText style={[styles.permissionText, { color: item.canViewSchedule ? theme.text : theme.textMuted }]}>
                Se program
              </ThemedText>
            </View>
          </View>
          {(item.canEditSpeeches || item.canEditSchedule) ? (
            <View style={[styles.permissionsRow, { borderTopColor: theme.border, paddingTop: 0, marginTop: -Spacing.xs }]}>
              {item.canEditSpeeches ? (
                <View style={styles.permission}>
                  <Feather name="edit-3" size={14} color={Colors.dark.accent} />
                  <ThemedText style={[styles.permissionText, { color: Colors.dark.accent }]}>
                    Rediger taler
                  </ThemedText>
                </View>
              ) : null}
              {item.canEditSchedule ? (
                <View style={styles.permission}>
                  <Feather name="edit-3" size={14} color={Colors.dark.accent} />
                  <ThemedText style={[styles.permissionText, { color: Colors.dark.accent }]}>
                    Rediger program
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ) : null}

          {item.accessCode ? (
            <View style={styles.codeSection}>
              <ThemedText style={[styles.codeLabel, { color: theme.textMuted }]}>Tilgangskode:</ThemedText>
              <Pressable onPress={() => copyCode(item.accessCode)} style={styles.codeBox}>
                <ThemedText style={[styles.codeText, { color: Colors.dark.accent }]}>
                  {item.accessCode}
                </ThemedText>
                <Feather name="copy" size={14} color={Colors.dark.accent} />
              </Pressable>
            </View>
          ) : null}

          <View style={[styles.cardActions, { borderTopColor: theme.border }]}>
            <Pressable
              onPress={() => copyLink(item.accessToken)}
              style={[styles.actionButton, { backgroundColor: Colors.dark.accent + "15" }]}
            >
              <Feather name="link" size={16} color={Colors.dark.accent} />
              <ThemedText style={[styles.actionButtonText, { color: Colors.dark.accent }]}>
                Kopier lenke
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => handleDelete(item.id, item.name)}
              style={[styles.actionButton, { backgroundColor: "#F4433620" }]}
            >
              <Feather name="trash-2" size={16} color="#F44336" />
              <ThemedText style={[styles.actionButtonText, { color: "#F44336" }]}>
                Fjern
              </ThemedText>
            </Pressable>
          </View>

          {item.lastAccessedAt ? (
            <ThemedText style={[styles.lastAccessed, { color: theme.textMuted }]}>
              Sist åpnet: {formatDate(item.lastAccessedAt)}
            </ThemedText>
          ) : null}
        </Card>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={coordinators}
        keyExtractor={(item) => item.id}
        renderItem={renderCoordinator}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.dark.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <ThemedText style={styles.headerTitle}>Del med koordinatorer</ThemedText>
            <ThemedText style={[styles.headerDescription, { color: theme.textMuted }]}>
              Gi toastmaster eller andre viktige personer tilgang til talerlisten og programmet.
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors.dark.accent + "15" }]}>
              <Feather name="users" size={40} color={Colors.dark.accent} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              Ingen koordinatorer lagt til
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
              Legg til toastmaster eller andre for å dele talerlisten og programmet.
            </ThemedText>
          </View>
        }
      />

      <View style={[styles.fabContainer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          onPress={() => setShowModal(true)}
          style={[styles.fab, { backgroundColor: Colors.dark.accent }]}
        >
          <Feather name="plus" size={24} color="#1A1A1A" />
        </Pressable>
      </View>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Legg til koordinator</ThemedText>
              <Pressable onPress={() => setShowModal(false)}>
                <Feather name="x" size={24} color={theme.textMuted} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textMuted }]}>Navn</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
                  placeholder="F.eks. Ole Nordmann"
                  placeholderTextColor={theme.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textMuted }]}>Rolle</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
                  placeholder="F.eks. Toastmaster"
                  placeholderTextColor={theme.textMuted}
                  value={newRole}
                  onChangeText={setNewRole}
                />
              </View>

              <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
                <View style={styles.toggleInfo}>
                  <Feather name="mic" size={18} color={theme.text} />
                  <ThemedText style={styles.toggleLabel}>Kan se talerliste</ThemedText>
                </View>
                <Switch
                  value={canViewSpeeches}
                  onValueChange={setCanViewSpeeches}
                  trackColor={{ false: theme.border, true: Colors.dark.accent }}
                  thumbColor="#fff"
                />
              </View>

              <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
                <View style={styles.toggleInfo}>
                  <Feather name="calendar" size={18} color={theme.text} />
                  <ThemedText style={styles.toggleLabel}>Kan se program</ThemedText>
                </View>
                <Switch
                  value={canViewSchedule}
                  onValueChange={setCanViewSchedule}
                  trackColor={{ false: theme.border, true: Colors.dark.accent }}
                  thumbColor="#fff"
                />
              </View>

              <ThemedText style={[styles.sectionLabel, { color: theme.textMuted }]}>
                Redigeringstilgang
              </ThemedText>

              <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
                <View style={styles.toggleInfo}>
                  <Feather name="edit-3" size={18} color={Colors.dark.accent} />
                  <View>
                    <ThemedText style={styles.toggleLabel}>Kan redigere taler</ThemedText>
                    <ThemedText style={[styles.toggleHint, { color: theme.textMuted }]}>
                      Kan legge til, endre og fjerne taler
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={canEditSpeeches}
                  onValueChange={(value) => {
                    setCanEditSpeeches(value);
                    if (value) setCanViewSpeeches(true);
                  }}
                  trackColor={{ false: theme.border, true: Colors.dark.accent }}
                  thumbColor="#fff"
                />
              </View>

              <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
                <View style={styles.toggleInfo}>
                  <Feather name="edit-3" size={18} color={Colors.dark.accent} />
                  <View>
                    <ThemedText style={styles.toggleLabel}>Kan redigere program</ThemedText>
                    <ThemedText style={[styles.toggleHint, { color: theme.textMuted }]}>
                      Kan endre kjøreplanen for dagen
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={canEditSchedule}
                  onValueChange={(value) => {
                    setCanEditSchedule(value);
                    if (value) setCanViewSchedule(true);
                  }}
                  trackColor={{ false: theme.border, true: Colors.dark.accent }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowModal(false)}
                style={[styles.cancelButton, { borderColor: theme.border }]}
              >
                <ThemedText style={[styles.cancelButtonText, { color: theme.textMuted }]}>
                  Avbryt
                </ThemedText>
              </Pressable>
              <Button
                onPress={handleCreate}
                style={styles.submitButton}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Oppretter..." : "Opprett invitasjon"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  headerDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  coordinatorCard: {
    padding: 0,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  coordinatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  nameSection: {
    gap: 2,
  },
  coordinatorName: {
    fontSize: 16,
    fontWeight: "600",
  },
  roleLabel: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  permissionsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  permission: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  permissionText: {
    fontSize: 13,
  },
  codeSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  codeLabel: {
    fontSize: 12,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(201, 169, 98, 0.1)",
  },
  codeText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
  },
  cardActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  lastAccessed: {
    fontSize: 11,
    textAlign: "center",
    paddingBottom: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
  },
  fabContainer: {
    position: "absolute",
    right: Spacing.lg,
    bottom: 0,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalBody: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  toggleLabel: {
    fontSize: 15,
  },
  toggleHint: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
  },
  modalActions: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  submitButton: {
    flex: 2,
  },
});
