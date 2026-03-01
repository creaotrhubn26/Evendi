import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { showToast } from "@/lib/toast";

const VENDOR_SESSION_KEY = "evendi_vendor_session";

interface AvailableDate {
  date: string;
  isAvailable: boolean;
  eventTypes?: string[];
}

export default function VendorAvailabilityCalendarScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Map<string, boolean>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);

  // Load vendor session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem(VENDOR_SESSION_KEY);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          setSessionToken(session.sessionToken);
          setVendorId(session.vendorId);
        }
      } catch (error) {
        console.error("Error loading vendor session:", error);
      }
    };
    loadSession();
  }, []);

  // Fetch availability
  const { data: availability, isLoading } = useQuery<AvailableDate[]>({
    queryKey: ["/api/vendor/availability", vendorId],
    queryFn: async () => {
      const response = await fetch(
        new URL(
          `/api/vendor/availability/${vendorId}`,
          getApiUrl()
        ).toString(),
        {
          headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        const dateMap = new Map<string, boolean>();
        data.dates?.forEach((item: AvailableDate) => {
          dateMap.set(item.date, item.isAvailable);
        });
        setAvailableDates(dateMap);
        return data.dates || [];
      }
      return [];
    },
    enabled: !!vendorId && !!sessionToken,
  });

  // Save availability mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const dates = Array.from(availableDates.entries()).map(([date, isAvailable]) => ({
        date,
        isAvailable,
      }));

      const response = await fetch(
        new URL(
          `/api/vendor/availability`,
          getApiUrl()
        ).toString(),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            vendorId,
            dates,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kunne ikke lagre tilgjengelighet");
      }
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Tilgjengelighet lagret!");
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Feil ved lagring"
      );
    },
  });

  // Get calendar days for current month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const toggleDate = (day: number) => {
    const dateStr = formatDateString(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    const isAvailable = availableDates.get(dateStr) ?? false;
    setAvailableDates(new Map(availableDates).set(dateStr, !isAvailable));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleAllMonth = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const newMap = new Map(availableDates);
    const allAvailable = Array.from({ length: daysInMonth }, (_, i) => {
      const dateStr = formatDateString(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
      return availableDates.get(dateStr) ?? false;
    }).every((v) => v);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateString(currentDate.getFullYear(), currentDate.getMonth(), day);
      newMap.set(dateStr, !allAvailable);
    }
    setAvailableDates(newMap);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateString(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isAvailable = availableDates.get(dateStr) ?? false;
      const isToday =
        new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

      days.push(
        <Pressable
          key={day}
          style={[
            styles.dayButton,
            {
              backgroundColor: isAvailable ? theme.success : theme.background,
              borderColor: isToday ? theme.primary : theme.border,
              borderWidth: isToday ? 2 : 1,
            },
          ]}
          onPress={() => toggleDate(day)}
        >
          <ThemedText
            style={[
              styles.dayText,
              {
                color: isAvailable ? "white" : theme.text,
                fontWeight: isToday ? "700" : "600",
              },
            ]}
          >
            {day}
          </ThemedText>
          {isAvailable && (
            <Feather name="check" size={12} color="white" style={styles.checkmark} />
          )}
        </Pressable>
      );
    }

    return days;
  };

  if (isLoading) {
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
        <ThemedText style={styles.headerTitle}>Kalender</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Info Box */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: theme.primary + "10", borderColor: theme.primary },
          ]}
        >
          <Feather name="info" size={16} color={theme.primary} />
          <ThemedText style={styles.infoText}>
            Trykk på datoer for å markere deg som tilgjengelig eller utilgjengelig
          </ThemedText>
        </View>

        {/* Month Navigation */}
        <View
          style={[
            styles.monthHeader,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <Pressable onPress={handlePrevMonth} hitSlop={10}>
            <Feather name="chevron-left" size={24} color={theme.primary} />
          </Pressable>

          <ThemedText style={styles.monthLabel}>
            {currentDate.toLocaleDateString("no-NO", {
              month: "long",
              year: "numeric",
            })}
          </ThemedText>

          <Pressable onPress={handleNextMonth} hitSlop={10}>
            <Feather name="chevron-right" size={24} color={theme.primary} />
          </Pressable>
        </View>

        {/* Weekday Headers */}
        <View
          style={[
            styles.weekdayRow,
            { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border },
          ]}
        >
          {["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"].map((day) => (
            <View key={day} style={styles.weekdayCell}>
              <ThemedText style={styles.weekdayText}>{day}</ThemedText>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={[styles.calendar, { backgroundColor: theme.backgroundDefault }]}>
          {renderCalendar()}
        </View>

        {/* Month Actions */}
        <View style={styles.monthActions}>
          <Pressable
            style={[
              styles.actionButton,
              { borderColor: theme.primary, borderWidth: 1 },
            ]}
            onPress={() => {
              const daysInMonth = getDaysInMonth(currentDate);
              const newMap = new Map<string, boolean>();
              for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = formatDateString(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                  day
                );
                newMap.set(dateStr, false);
              }
              setAvailableDates(newMap);
                showToast("Alle datoer for måneden er nå utilgjengelige");
            }}
          >
            <Feather name="x" size={16} color={theme.primary} />
            <ThemedText style={styles.actionButtonText}>Lukk alle</ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: theme.success },
            ]}
            onPress={toggleAllMonth}
          >
            <Feather name="check-square" size={16} color="white" />
            <ThemedText style={[styles.actionButtonText, { color: "white" }]}>
              Åpne alle
            </ThemedText>
          </Pressable>
        </View>

        {/* Legend */}
        <View
          style={[
            styles.legend,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendBox,
                { backgroundColor: theme.success },
              ]}
            />
            <ThemedText style={styles.legendLabel}>Tilgjengelig</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendBox,
                { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 },
              ]}
            />
            <ThemedText style={styles.legendLabel}>Utilgjengelig</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendBox,
                { borderColor: theme.primary, borderWidth: 2 },
                styles.legendBoxToday,
              ]}
            />
            <ThemedText style={styles.legendLabel}>I dag</ThemedText>
          </View>
        </View>

        {/* Stats */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: theme.primary + "10", borderColor: theme.primary },
          ]}
        >
          <Feather name="activity" size={18} color={theme.primary} />
          <View style={styles.statsContent}>
            <ThemedText style={styles.statsLabel}>Tilgjengelighetsstatus</ThemedText>
            <ThemedText style={styles.statsValue}>
              {availableDates.size} datoer registrert
              {Array.from(availableDates.values()).filter((v) => v).length > 0 &&
                ` • ${Array.from(availableDates.values()).filter((v) => v).length} tilgjengelig`}
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View
        style={[
          styles.actionBar,
          { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <Pressable
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <ThemedText style={styles.cancelButtonText}>Avbryt</ThemedText>
        </Pressable>

        <Pressable
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Feather name="check" size={18} color="white" />
              <ThemedText style={styles.saveButtonText}>Lagre</ThemedText>
            </>
          )}
        </Pressable>
      </View>
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
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.md,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    marginBottom: 0,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  weekdayRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomWidth: 1,
  },
  weekdayCell: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "600",
  },
  calendar: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderTopWidth: 0,
  },
  emptyDay: {
    width: "14.285%",
    height: 60,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
  },
  dayButton: {
    width: "14.285%",
    height: 60,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: 14,
  },
  checkmark: {
    marginTop: 2,
  },
  monthActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  legend: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  legendBox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
  },
  legendBoxToday: {
    backgroundColor: "transparent",
  },
  legendLabel: {
    fontSize: 13,
  },
  statsCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statsContent: {
    flex: 1,
  },
  statsLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  statsValue: {
    fontSize: 12,
  },
  actionBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
});
