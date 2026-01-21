import React, { useState, useMemo } from "react";
import { ScrollView, StyleSheet, View, Pressable, TextInput, Alert, ActivityIndicator, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { VideoGuide } from "../../shared/schema";

type Category = "vendor" | "couple";

interface VideoGuideForm {
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: string;
  category: Category;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

const FEATHER_ICONS = ["video", "play-circle", "youtube", "film", "monitor", "camera"];

export default function AdminVideoGuidesScreen({ route }: { route: { params: { adminKey: string } } }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { adminKey } = route.params;

  const [activeCategory, setActiveCategory] = useState<Category>("vendor");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VideoGuideForm>({
    title: "",
    description: "",
    videoUrl: "",
    thumbnail: "",
    duration: "",
    category: "vendor",
    icon: "video",
    sortOrder: 0,
    isActive: true,
  });

  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["admin-video-guides", activeCategory],
    queryFn: async () => {
      const url = new URL(`/api/admin/video-guides/${activeCategory}`, getApiUrl());
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) throw new Error("Kunne ikke hente videoguider");
      return res.json() as Promise<VideoGuide[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<VideoGuideForm, "category"> & { category: Category }) => {
      const url = new URL("/api/admin/video-guides", getApiUrl());
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Kunne ikke opprette videoguide");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-guides"] });
      resetForm();
      Alert.alert("Suksess", "Videoguide opprettet");
    },
    onError: (error) => {
      Alert.alert("Feil", (error as Error).message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<VideoGuideForm, "category"> & { category: Category } }) => {
      const url = new URL(`/api/admin/video-guides/${id}`, getApiUrl());
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Kunne ikke oppdatere videoguide");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-guides"] });
      resetForm();
      Alert.alert("Suksess", "Videoguide oppdatert");
    },
    onError: (error) => {
      Alert.alert("Feil", (error as Error).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const url = new URL(`/api/admin/video-guides/${id}`, getApiUrl());
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) throw new Error("Kunne ikke slette videoguide");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-guides"] });
      Alert.alert("Suksess", "Videoguide slettet");
    },
    onError: (error) => {
      Alert.alert("Feil", (error as Error).message);
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      videoUrl: "",
      thumbnail: "",
      duration: "",
      category: activeCategory,
      icon: "video",
      sortOrder: 0,
      isActive: true,
    });
  };

  const handleEdit = (guide: VideoGuide) => {
    setEditingId(guide.id);
    setFormData({
      title: guide.title,
      description: guide.description,
      videoUrl: guide.videoUrl,
      thumbnail: guide.thumbnail || "",
      duration: guide.duration || "",
      category: (guide.category as Category) || activeCategory,
      icon: guide.icon,
      sortOrder: guide.sortOrder,
      isActive: guide.isActive,
    });
  };

  const handleSave = () => {
    if (!formData.title || !formData.description || !formData.videoUrl) {
      Alert.alert("Feil", "Tittel, beskrivelse og video-URL er påkrevd");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const submitData = { ...formData, category: activeCategory };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Slett videoguide", "Er du sikker?", [
      { text: "Avbryt", onPress: () => {} },
      { text: "Slett", onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.header, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <Feather name="video" size={32} color={theme.accent} />
          <ThemedText style={styles.headerTitle}>Videoguider</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Administrer videoguider for leverandører og par
          </ThemedText>
        </View>

        {/* Category Tabs */}
        <View style={[styles.categoryTabs, { borderBottomColor: theme.border }]}>
          {(["vendor", "couple"] as const).map((category) => (
            <Pressable
              key={category}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveCategory(category);
                resetForm();
              }}
              style={[
                styles.categoryTab,
                activeCategory === category && { borderBottomColor: theme.accent, borderBottomWidth: 2 },
              ]}
            >
              <Feather
                name={category === "vendor" ? "briefcase" : "heart"}
                size={16}
                color={activeCategory === category ? theme.accent : theme.textMuted}
              />
              <ThemedText
                style={[
                  styles.categoryTabText,
                  activeCategory === category && { color: theme.accent, fontWeight: "600" },
                ]}
              >
                {category === "vendor" ? "Leverandører" : "Par"}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Form */}
        {(editingId || formData.title) && (
          <View style={[styles.form, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <ThemedText style={styles.formTitle}>{editingId ? "Rediger videoguide" : "Ny videoguide"}</ThemedText>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Tittel</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                value={formData.title}
                onChangeText={(val) => setFormData({ ...formData, title: val })}
                placeholder="F.eks. Hvordan legge til gjester"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Beskrivelse</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: theme.border, color: theme.text }]}
                value={formData.description}
                onChangeText={(val) => setFormData({ ...formData, description: val })}
                placeholder="Beskrivelse av videoguiden"
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Video URL</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                value={formData.videoUrl}
                onChangeText={(val) => setFormData({ ...formData, videoUrl: val })}
                placeholder="https://youtube.com/..."
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <ThemedText style={styles.label}>Varighet (optional)</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  value={formData.duration}
                  onChangeText={(val) => setFormData({ ...formData, duration: val })}
                  placeholder="HH:mm:ss"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <ThemedText style={styles.label}>Sortering</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  value={formData.sortOrder.toString()}
                  onChangeText={(val) => setFormData({ ...formData, sortOrder: parseInt(val) || 0 })}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <ThemedText style={styles.label}>Aktiv</ThemedText>
              <Switch
                value={formData.isActive}
                onValueChange={(val) => setFormData({ ...formData, isActive: val })}
                trackColor={{ false: theme.border, true: theme.accent + "80" }}
                thumbColor={formData.isActive ? theme.accent : theme.textMuted}
              />
            </View>

            <View style={styles.formButtons}>
              <Pressable
                onPress={resetForm}
                style={[styles.cancelButton, { borderColor: theme.border }]}
              >
                <ThemedText style={{ color: theme.textSecondary }}>Avbryt</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[styles.saveButton, { backgroundColor: theme.accent }]}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>Lagre</ThemedText>
              </Pressable>
            </View>
          </View>
        )}

        {/* Add Button */}
        {!editingId && !formData.title && (
          <Pressable
            onPress={() => setFormData({ ...formData, category: activeCategory })}
            style={[styles.addButton, { backgroundColor: theme.accent }]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
            <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>Ny videoguide</ThemedText>
          </Pressable>
        )}

        {/* Guides List */}
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: Spacing.xl }} color={theme.accent} />
        ) : guides.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="video" size={48} color={theme.textMuted} />
            <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.md }}>Ingen videoguider</ThemedText>
          </View>
        ) : (
          <View style={styles.guidesList}>
            {guides.map((guide) => (
              <View
                key={guide.id}
                style={[styles.guideItem, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
              >
                <View style={styles.guideHeader}>
                  <View>
                    <ThemedText style={styles.guideTitle}>{guide.title}</ThemedText>
                    <ThemedText style={[styles.guideDesc, { color: theme.textSecondary }]}>
                      {guide.description.substring(0, 50)}...
                    </ThemedText>
                  </View>
                  {!guide.isActive && (
                    <View style={[styles.badge, { backgroundColor: theme.error }]}>
                      <ThemedText style={styles.badgeText}>Inaktiv</ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.guideActions}>
                  <Pressable
                    onPress={() => handleEdit(guide)}
                    style={[styles.actionButton, { backgroundColor: theme.accent + "20" }]}
                  >
                    <Feather name="edit-2" size={16} color={theme.accent} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(guide.id)}
                    style={[styles.actionButton, { backgroundColor: theme.error + "20" }]}
                  >
                    <Feather name="trash-2" size={16} color={theme.error} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  header: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", marginTop: Spacing.md },
  headerSubtitle: { fontSize: 14, marginTop: Spacing.xs },
  categoryTabs: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  categoryTab: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    alignItems: "center",
  },
  categoryTabText: { fontSize: 14, fontWeight: "500" },
  form: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  formTitle: { fontSize: 16, fontWeight: "600", marginBottom: Spacing.sm },
  formGroup: { gap: Spacing.sm },
  label: { fontSize: 13, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
  },
  textArea: { textAlignVertical: "top", paddingVertical: Spacing.md },
  formRow: { flexDirection: "row", gap: Spacing.md },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  formButtons: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  addButton: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  guidesList: { gap: Spacing.md },
  guideItem: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  guideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  guideTitle: { fontSize: 14, fontWeight: "600" },
  guideDesc: { fontSize: 12, marginTop: Spacing.xs },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#FFFFFF" },
  guideActions: { flexDirection: "row", gap: Spacing.sm },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
});
