import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { EvendiIcon } from "@/components/EvendiIcon";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { showToast } from "@/lib/toast";

const COUPLE_SESSION_KEY = "evendi_couple_session";

interface ReviewData {
  vendorId: string;
  coupleId: string;
  rating: number;
  title: string;
  description: string;
  eventDate: string;
}

export default function ReviewSubmissionScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();

  const { vendorId, vendorName } = route.params || {};

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);

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

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!title || !description) {
        throw new Error("Tittel og beskrivelse er påkrevd");
      }

      const response = await fetch(
        new URL(
          `/api/vendor/${vendorId}/review`,
          getApiUrl()
        ).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            coupleId,
            rating,
            title,
            description,
            eventDate: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kunne ikke sende anmeldelse");
      }
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Anmeldelse sendt!");
      navigation.goBack();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Feil ved innsending"
      );
    },
  });

  const handleStarPress = (star: number) => {
    setRating(star);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => handleStarPress(star)}
            style={styles.starButton}
            hitSlop={10}
          >
            <Feather
              name={star <= rating ? "star" : "star"}
              size={40}
              color={star <= rating ? theme.warning : theme.textSecondary}
              fill={star <= rating ? theme.warning : "none"}
            />
          </Pressable>
        ))}
      </View>
    );
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
          <Feather name="chevron-left" size={24} color={"#FFFFFF"} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Skriv anmeldelse</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Vendor Info */}
        <View
          style={[
            styles.vendorCard,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <ThemedText style={styles.vendorName}>{vendorName}</ThemedText>
          <ThemedText style={styles.vendorLabel}>
            Hva synes du om tjenestene deres?
          </ThemedText>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Din vurdering</ThemedText>
          {renderStars()}
          <ThemedText style={styles.ratingText}>
            {rating} av 5 stjerner
          </ThemedText>
        </View>

        {/* Title Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Tittel på anmeldelsen</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="f.eks. Fantastisk service og fin atmosfære"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <ThemedText style={styles.characterCount}>
            {title.length}/100
          </ThemedText>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Din anmeldelse</ThemedText>
          <ThemedText style={styles.helperText}>
            Del dine erfaringer med andre. Vær konstruktiv og ærlig.
          </ThemedText>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Fortell om dine erfaringer med denne leverandøren..."
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            maxLength={1000}
            textAlignVertical="top"
          />
          <ThemedText style={styles.characterCount}>
            {description.length}/1000
          </ThemedText>
        </View>

        {/* Tips */}
        <View
          style={[
            styles.tipsSection,
            { backgroundColor: theme.primary + "10" },
          ]}
        >
          <EvendiIcon name="star" size={18} color={theme.primary} />
          <View style={styles.tipsContent}>
            <ThemedText style={styles.tipsTitle}>Tips for en god anmeldelse:</ThemedText>
            <ThemedText style={styles.tipItem}>• Vær spesifikk og ærlig</ThemedText>
            <ThemedText style={styles.tipItem}>• Fokuser på dine erfaringer</ThemedText>
            <ThemedText style={styles.tipItem}>• Hjelp andre med å ta informerte valg</ThemedText>
          </View>
        </View>

        {/* Spacing */}
        <View style={{ height: Spacing.lg }} />
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          styles.actionBar,
          { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <Pressable
          style={[styles.cancelButton, { borderColor: theme.primary }]}
          onPress={() => navigation.goBack()}
        >
          <ThemedText style={[styles.buttonText, { color: theme.primary }]}>
            Avbryt
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.submitButton, { backgroundColor: theme.primary }]}
          onPress={() => submitReviewMutation.mutate()}
          disabled={submitReviewMutation.isPending}
        >
          {submitReviewMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Feather name="send" size={18} color="white" />
              <ThemedText style={[styles.buttonText, { color: "white" }]}>
                Send anmeldelse
              </ThemedText>
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
  vendorCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  vendorName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  vendorLabel: {
    fontSize: 14,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  starButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  characterCount: {
    fontSize: 12,
    textAlign: "right",
  },
  helperText: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  tipsSection: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  tipItem: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  actionBar: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: "center",
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
