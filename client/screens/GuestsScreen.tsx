import React, { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { SwipeableRow } from "@/components/SwipeableRow";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { GuestsStackParamList } from "@/navigation/GuestsStackNavigator";
import { getGuests, saveGuests, generateId } from "@/lib/storage";
import { Guest, GUEST_CATEGORIES } from "@/lib/types";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

type NavigationProp = NativeStackNavigationProp<GuestsStackParamList>;

const STATUS_COLORS = {
  confirmed: "#4CAF50",
  pending: Colors.dark.accent,
  declined: "#EF5350",
};

const STATUS_LABELS = {
  confirmed: "Bekreftet",
  pending: "Venter",
  declined: "Avslått",
};

export default function GuestsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<Guest["category"]>("other");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDietary, setFormDietary] = useState("");
  const [formAllergies, setFormAllergies] = useState("");
  const [formPlusOne, setFormPlusOne] = useState(false);
  const [formPlusOneName, setFormPlusOneName] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormCategory("other");
    setFormPhone("");
    setFormEmail("");
    setFormDietary("");
    setFormAllergies("");
    setFormPlusOne(false);
    setFormPlusOneName("");
    setFormNotes("");
    setEditingGuest(null);
  };

  const loadData = useCallback(async () => {
    const data = await getGuests();
    setGuests(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredGuests = guests.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const confirmedCount = guests.filter((g) => g.status === "confirmed").length;
  const pendingCount = guests.filter((g) => g.status === "pending").length;

  const handleAddGuest = async () => {
    if (!formName.trim()) {
      Alert.alert("Feil", "Vennligst skriv inn et navn");
      return;
    }

    let updatedGuests: Guest[];

    if (editingGuest) {
      updatedGuests = guests.map((g) =>
        g.id === editingGuest.id
          ? {
              ...g,
              name: formName.trim(),
              category: formCategory,
              phone: formPhone.trim() || undefined,
              email: formEmail.trim() || undefined,
              dietaryRequirements: formDietary.trim() || undefined,
              allergies: formAllergies.trim() || undefined,
              plusOne: formPlusOne,
              plusOneName: formPlusOneName.trim() || undefined,
              notes: formNotes.trim() || undefined,
            }
          : g
      );
    } else {
      const newGuest: Guest = {
        id: generateId(),
        name: formName.trim(),
        status: "pending",
        category: formCategory,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        dietaryRequirements: formDietary.trim() || undefined,
        allergies: formAllergies.trim() || undefined,
        plusOne: formPlusOne,
        plusOneName: formPlusOneName.trim() || undefined,
        notes: formNotes.trim() || undefined,
      };
      updatedGuests = [...guests, newGuest];
    }

    setGuests(updatedGuests);
    await saveGuests(updatedGuests);

    resetForm();
    setShowAddForm(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setFormName(guest.name);
    setFormCategory(guest.category || "other");
    setFormPhone(guest.phone || "");
    setFormEmail(guest.email || "");
    setFormDietary(guest.dietaryRequirements || "");
    setFormAllergies(guest.allergies || "");
    setFormPlusOne(guest.plusOne || false);
    setFormPlusOneName(guest.plusOneName || "");
    setFormNotes(guest.notes || "");
    setShowAddForm(true);
  };

  const handleToggleStatus = async (guest: Guest) => {
    const statusOrder: Guest["status"][] = ["pending", "confirmed", "declined"];
    const currentIndex = statusOrder.indexOf(guest.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    const updatedGuests = guests.map((g) =>
      g.id === guest.id ? { ...g, status: nextStatus } : g
    );
    setGuests(updatedGuests);
    await saveGuests(updatedGuests);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDeleteGuest = async (id: string) => {
    Alert.alert("Slett gjest", "Er du sikker på at du vil slette denne gjesten?", [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Slett",
        style: "destructive",
        onPress: async () => {
          const updatedGuests = guests.filter((g) => g.id !== id);
          setGuests(updatedGuests);
          await saveGuests(updatedGuests);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  const getCategoryLabel = (category?: Guest["category"]) => {
    const cat = GUEST_CATEGORIES.find((c) => c.value === category);
    return cat?.label || "";
  };

  const renderGuestItem = ({ item, index }: { item: Guest; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <SwipeableRow
        onEdit={() => handleEditGuest(item)}
        onDelete={() => handleDeleteGuest(item.id)}
        backgroundColor={theme.backgroundDefault}
      >
        <Pressable
          onPress={() => handleToggleStatus(item)}
          style={({ pressed }) => [
            styles.guestItem,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            pressed && { opacity: 0.9 },
          ]}
        >
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: item.category === "reserved" ? Colors.dark.accent + "30" : theme.backgroundSecondary,
              },
            ]}
          >
            <Feather
              name={item.category === "reserved" ? "star" : "user"}
              size={18}
              color={item.category === "reserved" ? Colors.dark.accent : theme.textSecondary}
            />
          </View>
          <View style={styles.guestInfo}>
            <View style={styles.guestNameRow}>
              <ThemedText style={styles.guestName}>{item.name}</ThemedText>
              {item.plusOne ? (
                <View style={[styles.plusOneBadge, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText style={[styles.plusOneText, { color: theme.textSecondary }]}>+1</ThemedText>
                </View>
              ) : null}
            </View>
            <View style={styles.guestMeta}>
              {item.category ? (
                <ThemedText style={[styles.categoryLabel, { color: item.category === "reserved" ? Colors.dark.accent : theme.textSecondary }]}>
                  {getCategoryLabel(item.category)}
                </ThemedText>
              ) : null}
              {item.tableNumber ? (
                <ThemedText style={[styles.tableNumber, { color: theme.textSecondary }]}>
                  • Bord {item.tableNumber}
                </ThemedText>
              ) : null}
            </View>
            {item.dietaryRequirements || item.allergies ? (
              <View style={styles.dietaryRow}>
                {item.dietaryRequirements ? (
                  <View style={[styles.dietaryBadge, { backgroundColor: "#4CAF5020" }]}>
                    <Feather name="coffee" size={10} color="#4CAF50" />
                    <ThemedText style={[styles.dietaryText, { color: "#4CAF50" }]}>
                      {item.dietaryRequirements}
                    </ThemedText>
                  </View>
                ) : null}
                {item.allergies ? (
                  <View style={[styles.dietaryBadge, { backgroundColor: "#EF535020" }]}>
                    <Feather name="alert-circle" size={10} color="#EF5350" />
                    <ThemedText style={[styles.dietaryText, { color: "#EF5350" }]}>
                      {item.allergies}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[item.status] + "20" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: STATUS_COLORS[item.status] },
              ]}
            />
            <ThemedText
              style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}
            >
              {STATUS_LABELS[item.status]}
            </ThemedText>
          </View>
        </Pressable>
      </SwipeableRow>
    </Animated.View>
  );

  const ListHeader = () => (
    <>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={[styles.statNumber, { color: Colors.dark.accent }]}>
            {guests.length}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Gjester
          </ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={[styles.statNumber, { color: "#4CAF50" }]}>
            {confirmedCount}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Bekreftet
          </ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={[styles.statNumber, { color: Colors.dark.accent }]}>
            {pendingCount}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Venter
          </ThemedText>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Pressable
          onPress={() => navigation.navigate("TableSeating")}
          style={[styles.actionButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
        >
          <Feather name="grid" size={18} color={Colors.dark.accent} />
          <ThemedText style={styles.actionButtonText}>Bordplassering</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate("SpeechList")}
          style={[styles.actionButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
        >
          <Feather name="mic" size={18} color={Colors.dark.accent} />
          <ThemedText style={styles.actionButtonText}>Taleliste</ThemedText>
        </Pressable>
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
        ]}
      >
        <Feather name="search" size={18} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Søk etter gjest..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ThemedText style={[styles.swipeHint, { color: theme.textMuted }]}>
        Trykk for å endre status • Sveip til venstre for å endre eller slette
      </ThemedText>

      {showAddForm ? (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[
            styles.addForm,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <ThemedText type="h4" style={styles.formTitle}>
            {editingGuest ? "Endre gjest" : "Legg til gjest"}
          </ThemedText>
          
          <TextInput
            style={[
              styles.addInput,
              { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Navn *"
            placeholderTextColor={theme.textMuted}
            value={formName}
            onChangeText={setFormName}
            autoFocus
          />

          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Kategori</ThemedText>
          <View style={styles.categoryPicker}>
            {GUEST_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() => setFormCategory(cat.value as Guest["category"])}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: formCategory === cat.value ? Colors.dark.accent : theme.backgroundSecondary,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.categoryChipText,
                    { color: formCategory === cat.value ? "#1A1A1A" : theme.textSecondary },
                  ]}
                >
                  {cat.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.addInput,
                styles.halfInput,
                { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Telefon"
              placeholderTextColor={theme.textMuted}
              value={formPhone}
              onChangeText={setFormPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[
                styles.addInput,
                styles.halfInput,
                { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="E-post"
              placeholderTextColor={theme.textMuted}
              value={formEmail}
              onChangeText={setFormEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TextInput
            style={[
              styles.addInput,
              { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Kosthold / preferanser"
            placeholderTextColor={theme.textMuted}
            value={formDietary}
            onChangeText={setFormDietary}
          />

          <TextInput
            style={[
              styles.addInput,
              { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Allergier"
            placeholderTextColor={theme.textMuted}
            value={formAllergies}
            onChangeText={setFormAllergies}
          />

          <Pressable
            onPress={() => setFormPlusOne(!formPlusOne)}
            style={[styles.checkboxRow, { borderColor: theme.border }]}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: formPlusOne ? Colors.dark.accent : "transparent",
                  borderColor: formPlusOne ? Colors.dark.accent : theme.border,
                },
              ]}
            >
              {formPlusOne ? <Feather name="check" size={14} color="#1A1A1A" /> : null}
            </View>
            <ThemedText style={{ color: theme.text }}>+1 (Følge)</ThemedText>
          </Pressable>

          {formPlusOne ? (
            <TextInput
              style={[
                styles.addInput,
                { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Navn på følge"
              placeholderTextColor={theme.textMuted}
              value={formPlusOneName}
              onChangeText={setFormPlusOneName}
            />
          ) : null}

          <TextInput
            style={[
              styles.addInput,
              styles.notesInput,
              { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Notater"
            placeholderTextColor={theme.textMuted}
            value={formNotes}
            onChangeText={setFormNotes}
            multiline
            numberOfLines={3}
          />

          <View style={styles.addFormButtons}>
            <Pressable
              onPress={() => {
                setShowAddForm(false);
                resetForm();
              }}
              style={[styles.cancelButton, { borderColor: theme.border }]}
            >
              <ThemedText style={{ color: theme.textSecondary }}>Avbryt</ThemedText>
            </Pressable>
            <Button onPress={handleAddGuest} style={styles.saveButton}>
              {editingGuest ? "Oppdater" : "Legg til"}
            </Button>
          </View>
        </Animated.View>
      ) : null}
    </>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="users" size={48} color={theme.textMuted} />
      </View>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        Ingen gjester lagt til
      </ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: theme.textMuted }]}>
        Legg til din første gjest
      </ThemedText>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ThemedText style={{ color: theme.textSecondary }}>Laster...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={filteredGuests}
        renderItem={renderGuestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl + 70,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={searchQuery ? null : ListEmpty}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />

      {!showAddForm ? (
        <Pressable
          onPress={() => {
            setShowAddForm(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={[
            styles.fab,
            { backgroundColor: Colors.dark.accent, bottom: tabBarHeight + Spacing.xl },
          ]}
        >
          <Feather name="plus" size={24} color="#1A1A1A" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  swipeHint: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  addForm: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  formTitle: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  categoryPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  notesInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: Spacing.sm,
  },
  addInput: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  addFormButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  saveButton: {
    flex: 1,
  },
  guestItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  guestInfo: {
    flex: 1,
  },
  guestNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  guestName: {
    fontSize: 16,
    fontWeight: "500",
  },
  plusOneBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  plusOneText: {
    fontSize: 11,
    fontWeight: "600",
  },
  guestMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  categoryLabel: {
    fontSize: 12,
  },
  tableNumber: {
    fontSize: 12,
    marginLeft: Spacing.xs,
  },
  dietaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: 4,
  },
  dietaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  dietaryText: {
    fontSize: 10,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
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
});
