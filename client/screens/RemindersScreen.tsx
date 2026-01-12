import React, { useState } from "react";
import { ScrollView, StyleSheet, View, Pressable, TextInput, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import {
  scheduleCustomReminder,
  cancelCustomReminder,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  getNotificationSettings,
} from "@/lib/notifications";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminderDate: string;
  category: string;
  isCompleted: boolean;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ["general", "vendor", "budget", "guest", "planning"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  general: "#64B5F6",
  vendor: "#81C784",
  budget: "#FFB74D",
  guest: "#BA68C8",
  planning: "#4FC3F7",
};

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>("general");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; reminderDate: string; category: string }): Promise<Reminder> => {
      const res = await apiRequest("POST", "/api/reminders", data);
      return res.json();
    },
    onSuccess: async (newReminder: Reminder) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      const settings = await getNotificationSettings();
      if (settings.enabled) {
        const notificationId = await scheduleCustomReminder({
          id: newReminder.id,
          title: newReminder.title,
          description: newReminder.description,
          reminderDate: newReminder.reminderDate,
          category: newReminder.category,
        });
        if (notificationId) {
          await apiRequest("PATCH", `/api/reminders/${newReminder.id}`, { notificationId });
        }
      }
      resetForm();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      return apiRequest("PATCH", `/api/reminders/${id}`, { isCompleted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await cancelCustomReminder(id);
      return apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedDate(new Date());
    setSelectedCategory("general");
    setShowForm(false);
  };

  const handleCreateReminder = () => {
    if (!title.trim()) {
      Alert.alert("Feil", "Tittel er påkrevd");
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      reminderDate: selectedDate.toISOString(),
      category: selectedCategory,
    });
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    Alert.alert(
      "Slett påminnelse",
      `Er du sikker på at du vil slette "${reminder.title}"?`,
      [
        { text: "Avbryt", style: "cancel" },
        { text: "Slett", style: "destructive", onPress: () => deleteMutation.mutate(reminder.id) },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nb-NO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTimeUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Forfalt";
    if (diffDays === 0) return "I dag";
    if (diffDays === 1) return "I morgen";
    if (diffDays < 7) return `Om ${diffDays} dager`;
    if (diffDays < 30) return `Om ${Math.ceil(diffDays / 7)} uker`;
    return `Om ${Math.ceil(diffDays / 30)} måneder`;
  };

  const filteredReminders = filterCategory
    ? reminders.filter((r) => r.category === filterCategory)
    : reminders;

  const upcomingReminders = filteredReminders.filter((r) => !r.isCompleted);
  const completedReminders = filteredReminders.filter((r) => r.isCompleted);

  const completedCount = reminders.filter((r) => r.isCompleted).length;
  const totalCount = reminders.length;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: theme.textMuted }}>Laster...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <View style={styles.summaryRow}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.dark.accent + "20" }]}>
                <Feather name="bell" size={24} color={Colors.dark.accent} />
              </View>
              <View style={styles.summaryText}>
                <ThemedText style={styles.summaryTitle}>Påminnelser</ThemedText>
                <ThemedText style={[styles.summarySubtitle, { color: theme.textMuted }]}>
                  {totalCount > 0 ? `${completedCount} av ${totalCount} fullført` : "Ingen påminnelser ennå"}
                </ThemedText>
              </View>
            </View>
            {totalCount > 0 ? (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: Colors.dark.accent,
                        width: `${(completedCount / totalCount) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <ThemedText style={[styles.progressText, { color: theme.textMuted }]}>
                  {Math.round((completedCount / totalCount) * 100)}%
                </ThemedText>
              </View>
            ) : null}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <Pressable
              style={[
                styles.filterChip,
                {
                  backgroundColor: filterCategory === null ? Colors.dark.accent : theme.backgroundDefault,
                  borderColor: filterCategory === null ? Colors.dark.accent : theme.border,
                },
              ]}
              onPress={() => {
                setFilterCategory(null);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  { color: filterCategory === null ? "#1A1A1A" : theme.textSecondary },
                ]}
              >
                Alle
              </ThemedText>
            </Pressable>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: filterCategory === cat ? CATEGORY_COLORS[cat] : theme.backgroundDefault,
                    borderColor: filterCategory === cat ? CATEGORY_COLORS[cat] : theme.border,
                  },
                ]}
                onPress={() => {
                  setFilterCategory(filterCategory === cat ? null : cat);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Feather
                  name={CATEGORY_ICONS[cat] as keyof typeof Feather.glyphMap}
                  size={14}
                  color={filterCategory === cat ? "#1A1A1A" : theme.textSecondary}
                  style={styles.filterIcon}
                />
                <ThemedText
                  style={[
                    styles.filterText,
                    { color: filterCategory === cat ? "#1A1A1A" : theme.textSecondary },
                  ]}
                >
                  {CATEGORY_LABELS[cat]}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {showForm ? (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.formSection}>
            <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <ThemedText style={styles.formTitle}>Ny påminnelse</ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textMuted }]}>Tittel</ThemedText>
                <TextInput
                  testID="input-reminder-title"
                  style={[
                    styles.textInput,
                    { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder="Hva vil du bli påminnet om?"
                  placeholderTextColor={theme.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textMuted }]}>Beskrivelse (valgfritt)</ThemedText>
                <TextInput
                  testID="input-reminder-description"
                  style={[
                    styles.textInput,
                    styles.textArea,
                    { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder="Legg til mer informasjon..."
                  placeholderTextColor={theme.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textMuted }]}>Dato</ThemedText>
                {Platform.OS === "web" ? (
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border },
                    ]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textMuted}
                    value={selectedDate.toISOString().split("T")[0]}
                    onChangeText={(text) => {
                      const date = new Date(text);
                      if (!isNaN(date.getTime())) {
                        setSelectedDate(date);
                      }
                    }}
                  />
                ) : (
                  <>
                    <Pressable
                      style={[
                        styles.dateButton,
                        { backgroundColor: theme.backgroundRoot, borderColor: theme.border },
                      ]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Feather name="calendar" size={18} color={Colors.dark.accent} />
                      <ThemedText style={styles.dateButtonText}>
                        {selectedDate.toLocaleDateString("nb-NO", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </ThemedText>
                    </Pressable>
                    {showDatePicker ? (
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        minimumDate={new Date()}
                        onChange={(event: DateTimePickerEvent, date?: Date) => {
                          setShowDatePicker(false);
                          if (date) setSelectedDate(date);
                        }}
                      />
                    ) : null}
                  </>
                )}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textMuted }]}>Kategori</ThemedText>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      style={[
                        styles.categoryOption,
                        {
                          backgroundColor:
                            selectedCategory === cat ? CATEGORY_COLORS[cat] + "20" : theme.backgroundRoot,
                          borderColor: selectedCategory === cat ? CATEGORY_COLORS[cat] : theme.border,
                        },
                      ]}
                      onPress={() => {
                        setSelectedCategory(cat);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Feather
                        name={CATEGORY_ICONS[cat] as keyof typeof Feather.glyphMap}
                        size={16}
                        color={selectedCategory === cat ? CATEGORY_COLORS[cat] : theme.textMuted}
                      />
                      <ThemedText
                        style={[
                          styles.categoryOptionText,
                          { color: selectedCategory === cat ? CATEGORY_COLORS[cat] : theme.textSecondary },
                        ]}
                      >
                        {CATEGORY_LABELS[cat]}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formButtons}>
                <Pressable
                  testID="button-cancel-reminder"
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                  onPress={resetForm}
                >
                  <ThemedText style={{ color: theme.textSecondary }}>Avbryt</ThemedText>
                </Pressable>
                <Button
                  onPress={handleCreateReminder}
                  disabled={createMutation.isPending || !title.trim()}
                  style={styles.submitButton}
                >
                  {createMutation.isPending ? "Lagrer..." : "Opprett"}
                </Button>
              </View>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(300).delay(200)}>
            <Pressable
              testID="button-add-reminder"
              style={[styles.addButton, { backgroundColor: theme.backgroundDefault, borderColor: Colors.dark.accent }]}
              onPress={() => {
                setShowForm(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Feather name="plus" size={20} color={Colors.dark.accent} />
              <ThemedText style={[styles.addButtonText, { color: Colors.dark.accent }]}>
                Legg til påminnelse
              </ThemedText>
            </Pressable>
          </Animated.View>
        )}

        {upcomingReminders.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(300).delay(300)} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Kommende</ThemedText>
            {upcomingReminders.map((reminder, index) => (
              <Animated.View
                key={reminder.id}
                entering={FadeInDown.duration(300).delay(350 + index * 50)}
              >
                <ReminderItem
                  reminder={reminder}
                  theme={theme}
                  onToggle={() => toggleMutation.mutate({ id: reminder.id, isCompleted: true })}
                  onDelete={() => handleDeleteReminder(reminder)}
                  formatDate={formatDate}
                  getTimeUntil={getTimeUntil}
                />
              </Animated.View>
            ))}
          </Animated.View>
        ) : null}

        {completedReminders.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(300).delay(400)} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textMuted }]}>Fullført</ThemedText>
            {completedReminders.map((reminder, index) => (
              <Animated.View
                key={reminder.id}
                entering={FadeInDown.duration(300).delay(450 + index * 50)}
              >
                <ReminderItem
                  reminder={reminder}
                  theme={theme}
                  onToggle={() => toggleMutation.mutate({ id: reminder.id, isCompleted: false })}
                  onDelete={() => handleDeleteReminder(reminder)}
                  formatDate={formatDate}
                  getTimeUntil={getTimeUntil}
                  completed
                />
              </Animated.View>
            ))}
          </Animated.View>
        ) : null}

        {reminders.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(300).delay(300)} style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors.dark.accent + "20" }]}>
              <Feather name="bell-off" size={32} color={Colors.dark.accent} />
            </View>
            <ThemedText style={styles.emptyTitle}>Ingen påminnelser</ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
              Opprett en påminnelse for å holde styr på viktige frister og oppgaver.
            </ThemedText>
          </Animated.View>
        ) : null}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function ReminderItem({
  reminder,
  theme,
  onToggle,
  onDelete,
  formatDate,
  getTimeUntil,
  completed = false,
}: {
  reminder: Reminder;
  theme: any;
  onToggle: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
  getTimeUntil: (date: string) => string;
  completed?: boolean;
}) {
  const categoryColor = CATEGORY_COLORS[reminder.category] || CATEGORY_COLORS.general;
  const timeUntil = getTimeUntil(reminder.reminderDate);
  const isOverdue = timeUntil === "Forfalt";

  return (
    <View
      style={[
        styles.reminderCard,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
          opacity: completed ? 0.7 : 1,
        },
      ]}
    >
      <Pressable style={styles.checkboxContainer} onPress={onToggle}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: completed ? Colors.dark.accent : theme.border,
              backgroundColor: completed ? Colors.dark.accent : "transparent",
            },
          ]}
        >
          {completed ? <Feather name="check" size={14} color="#1A1A1A" /> : null}
        </View>
      </Pressable>

      <View style={styles.reminderContent}>
        <View style={styles.reminderHeader}>
          <ThemedText
            style={[
              styles.reminderTitle,
              completed && { textDecorationLine: "line-through", color: theme.textMuted },
            ]}
          >
            {reminder.title}
          </ThemedText>
          <Pressable style={styles.deleteButton} onPress={onDelete}>
            <Feather name="trash-2" size={16} color={theme.textMuted} />
          </Pressable>
        </View>

        {reminder.description ? (
          <ThemedText
            style={[styles.reminderDescription, { color: theme.textMuted }]}
            numberOfLines={2}
          >
            {reminder.description}
          </ThemedText>
        ) : null}

        <View style={styles.reminderMeta}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + "20" }]}>
            <Feather
              name={CATEGORY_ICONS[reminder.category] as keyof typeof Feather.glyphMap}
              size={12}
              color={categoryColor}
            />
            <ThemedText style={[styles.categoryBadgeText, { color: categoryColor }]}>
              {CATEGORY_LABELS[reminder.category]}
            </ThemedText>
          </View>

          <View style={styles.dateInfo}>
            <Feather
              name="calendar"
              size={12}
              color={isOverdue && !completed ? "#FF6B6B" : theme.textMuted}
            />
            <ThemedText
              style={[
                styles.dateText,
                { color: isOverdue && !completed ? "#FF6B6B" : theme.textMuted },
              ]}
            >
              {formatDate(reminder.reminderDate)}
            </ThemedText>
            <ThemedText
              style={[
                styles.timeUntilText,
                { color: isOverdue && !completed ? "#FF6B6B" : Colors.dark.accent },
              ]}
            >
              ({timeUntil})
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  summarySubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 36,
    textAlign: "right",
  },
  filterContainer: {
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  formCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  textInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  dateButtonText: {
    fontSize: 15,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  formButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  submitButton: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  reminderCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  checkboxContainer: {
    marginRight: Spacing.md,
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  reminderContent: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
    marginRight: Spacing.sm,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  reminderDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  reminderMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 12,
  },
  timeUntilText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
  },
});
