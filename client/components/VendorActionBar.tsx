import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { PlanningStackParamList } from "@/navigation/PlanningStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import type { VendorSuggestion } from "@/hooks/useVendorSearch";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];
const COUPLE_STORAGE_KEY = "wedflow_couple_session";

interface VendorActionBarProps {
  vendor: VendorSuggestion;
  /** Category slug for the vendorDetail screen (e.g., "florist", "beauty") */
  vendorCategory: string;
  /** Called when user taps "Fjern" (clear the selection) */
  onClear?: () => void;
  /** Icon for the category */
  icon?: FeatherIconName;
}

/**
 * Action bar shown after a couple selects a registered vendor.
 * Provides "Se profil" (navigate to VendorDetail) and "Send melding" (start/resume chat).
 */
export function VendorActionBar({
  vendor,
  vendorCategory,
  onClear,
  icon = "briefcase",
}: VendorActionBarProps) {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<PlanningStackParamList>>();
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const handleViewProfile = () => {
    navigation.navigate("VendorDetail", {
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      vendorDescription: vendor.description || "",
      vendorLocation: vendor.location || "",
      vendorPriceRange: vendor.priceRange || "",
      vendorCategory,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleStartChat = async () => {
    setIsSendingMessage(true);
    try {
      const sessionData = await AsyncStorage.getItem(COUPLE_STORAGE_KEY);
      if (!sessionData) {
        Alert.alert("Logg inn", "Du må logge inn som par for å sende meldinger.");
        return;
      }
      const { sessionToken } = JSON.parse(sessionData);

      const response = await fetch(
        new URL("/api/couples/messages", getApiUrl()).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            vendorId: vendor.id,
            body: `Hei! Jeg er interessert i tjenestene deres.`,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || "Kunne ikke starte samtale");
      }

      const msg = await response.json();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      navigation.navigate("Chat", {
        conversationId: msg.conversationId,
        vendorName: vendor.businessName,
      });
    } catch (e: any) {
      Alert.alert("Feil", e.message || "Kunne ikke starte samtale");
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      style={[
        styles.container,
        {
          backgroundColor: theme.primary + "08",
          borderColor: theme.primary + "30",
        },
      ]}
    >
      {/* Selected vendor info */}
      <View style={styles.vendorRow}>
        <View style={[styles.vendorIcon, { backgroundColor: theme.primary + "15" }]}>
          <Feather name={icon} size={14} color={theme.primary} />
        </View>
        <View style={styles.vendorInfo}>
          <ThemedText style={[styles.vendorName, { color: theme.text }]} numberOfLines={1}>
            {vendor.businessName}
          </ThemedText>
          {vendor.location && (
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={10} color={theme.textMuted} />
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>
                {vendor.location}
              </ThemedText>
            </View>
          )}
        </View>
        <View style={[styles.matchedBadge, { backgroundColor: theme.primary + "15" }]}>
          <Feather name="check-circle" size={12} color={theme.primary} />
          <ThemedText style={[styles.matchedText, { color: theme.primary }]}>Registrert</ThemedText>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonsRow}>
        <Pressable
          onPress={handleViewProfile}
          style={[styles.profileButton, { borderColor: theme.primary }]}
        >
          <Feather name="user" size={14} color={theme.primary} />
          <ThemedText style={[styles.buttonText, { color: theme.primary }]}>Se profil</ThemedText>
        </Pressable>

        <Pressable
          onPress={handleStartChat}
          disabled={isSendingMessage}
          style={[styles.chatButton, { backgroundColor: theme.primary }]}
        >
          {isSendingMessage ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="message-circle" size={14} color="#FFFFFF" />
              <ThemedText style={styles.chatButtonText}>Send melding</ThemedText>
            </>
          )}
        </Pressable>

        {onClear && (
          <Pressable
            onPress={() => {
              onClear();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            hitSlop={8}
            style={styles.clearButton}
          >
            <Feather name="x" size={16} color={theme.textMuted} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    marginTop: 6,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vendorIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 13,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 1,
  },
  metaText: {
    fontSize: 11,
  },
  matchedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  matchedText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  profileButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
  },
  chatButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  clearButton: {
    padding: 4,
  },
});
