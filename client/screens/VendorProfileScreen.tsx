import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const VENDOR_STORAGE_KEY = "wedflow_vendor_session";

interface VendorProfile {
  id: string;
  email: string;
  businessName: string;
  organizationNumber: string | null;
  description: string | null;
  location: string | null;
  phone: string | null;
  website: string | null;
  priceRange: string | null;
  imageUrl: string | null;
  googleReviewUrl: string | null;
  status: string;
  category: { id: string; name: string } | null;
}

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function VendorProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [businessName, setBusinessName] = useState("");
  const [organizationNumber, setOrganizationNumber] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    const sessionData = await AsyncStorage.getItem(VENDOR_STORAGE_KEY);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setSessionToken(session.sessionToken);
    } else {
      navigation.replace("VendorLogin");
    }
  };

  const { data: profile, isLoading } = useQuery<VendorProfile>({
    queryKey: ["/api/vendor/profile"],
    queryFn: async () => {
      if (!sessionToken) throw new Error("Ikke innlogget");
      const response = await fetch(new URL("/api/vendor/profile", getApiUrl()).toString(), {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      if (!response.ok) throw new Error("Kunne ikke hente profil");
      return response.json();
    },
    enabled: !!sessionToken,
  });

  // Pre-fill form when profile loads
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName || "");
      setOrganizationNumber(profile.organizationNumber || "");
      setDescription(profile.description || "");
      setLocation(profile.location || "");
      setPhone(profile.phone || "");
      setWebsite(profile.website || "");
      setPriceRange(profile.priceRange || "");
      setGoogleReviewUrl(profile.googleReviewUrl || "");
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!sessionToken) throw new Error("Ikke innlogget");
      
      const response = await fetch(new URL("/api/vendor/profile", getApiUrl()).toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          organizationNumber: organizationNumber.trim() || null,
          description: description.trim() || null,
          location: location.trim() || null,
          phone: phone.trim() || null,
          website: website.trim() || null,
          priceRange: priceRange.trim() || null,
          googleReviewUrl: googleReviewUrl.trim() || null,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Kunne ikke oppdatere profil");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Update session storage with new business name
      const sessionData = await AsyncStorage.getItem(VENDOR_STORAGE_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.businessName = data.businessName;
        await AsyncStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(session));
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/profile"] });
      Alert.alert("Lagret", "Profilen din er oppdatert");
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Feil", error.message);
    },
  });

  const handleSave = () => {
    if (!businessName.trim()) {
      Alert.alert("Ugyldig", "Bedriftsnavn er påkrevd");
      return;
    }
    saveMutation.mutate();
  };

  const isValid = businessName.trim().length >= 2;

  if (isLoading || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md, backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
          <View style={styles.headerContent}>
            <View style={[styles.headerIconCircle, { backgroundColor: theme.accent }]}>
              <Feather name="user" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Min profil</ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Laster...</ThemedText>
            </View>
          </View>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundRoot },
            ]}
          >
            <Feather name="x" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md, backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIconCircle, { backgroundColor: theme.accent }]}>
            <Feather name="user" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Min profil</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Rediger bedriftsinformasjon</ThemedText>
          </View>
        </View>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.closeButton,
            { backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundRoot },
          ]}
        >
          <Feather name="x" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        {/* Status Badge */}
        <View style={[styles.statusCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={styles.statusRow}>
            <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>Status:</ThemedText>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: profile.status === "approved" ? "#4CAF5020" : profile.status === "pending" ? "#FF980020" : "#EF535020" }
            ]}>
              <ThemedText style={[
                styles.statusText, 
                { color: profile.status === "approved" ? "#4CAF50" : profile.status === "pending" ? "#FF9800" : "#EF5350" }
              ]}>
                {profile.status === "approved" ? "Godkjent" : profile.status === "pending" ? "Venter på godkjenning" : "Avvist"}
              </ThemedText>
            </View>
          </View>
          {profile.category && (
            <View style={styles.statusRow}>
              <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>Kategori:</ThemedText>
              <ThemedText style={[styles.categoryText, { color: theme.text }]}>{profile.category.name}</ThemedText>
            </View>
          )}
          <View style={styles.statusRow}>
            <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>E-post:</ThemedText>
            <ThemedText style={[styles.emailText, { color: theme.text }]}>{profile.email}</ThemedText>
          </View>
        </View>

        {/* Business Information */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: theme.accent + "15" }]}>
              <Feather name="briefcase" size={16} color={theme.accent} />
            </View>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Bedriftsinformasjon</ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Bedriftsnavn <ThemedText style={{ color: "#EF5350" }}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Ditt bedriftsnavn"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Organisasjonsnummer</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
              value={organizationNumber}
              onChangeText={setOrganizationNumber}
              placeholder="123 456 789"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Beskrivelse</ThemedText>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Fortell om din bedrift og tjenester..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Contact Information */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: theme.accent + "15" }]}>
              <Feather name="phone" size={16} color={theme.accent} />
            </View>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Kontaktinformasjon</ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Sted / Område</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
              value={location}
              onChangeText={setLocation}
              placeholder="F.eks. Oslo, Bergen, hele Norge"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Telefon</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+47 123 45 678"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Nettside</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
              value={website}
              onChangeText={setWebsite}
              placeholder="https://dinbedrift.no"
              placeholderTextColor={theme.textMuted}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Pricing & Reviews */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: theme.accent + "15" }]}>
              <Feather name="dollar-sign" size={16} color={theme.accent} />
            </View>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Priser & Anmeldelser</ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Prisklasse</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
              value={priceRange}
              onChangeText={setPriceRange}
              placeholder="F.eks. 15 000 - 50 000 kr"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Google anmeldelser URL</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
              value={googleReviewUrl}
              onChangeText={setGoogleReviewUrl}
              placeholder="https://g.page/..."
              placeholderTextColor={theme.textMuted}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={!isValid || saveMutation.isPending}
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: isValid ? theme.accent : theme.border },
            pressed && isValid && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <View style={styles.submitBtnIcon}>
                <Feather name="check" size={16} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.submitBtnText}>Lagre endringer</ThemedText>
            </>
          )}
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  statusCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "500",
    width: 80,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emailText: {
    fontSize: 14,
    flex: 1,
  },
  formCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    fontSize: 15,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
    shadowColor: "#C9A962",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
