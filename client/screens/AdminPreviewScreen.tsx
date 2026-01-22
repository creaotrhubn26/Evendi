import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

interface PreviewMode {
  type: "couple" | "vendor";
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

export default function AdminPreviewScreen({ route }: any) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { adminKey } = route.params || {};

  const [selectedMode, setSelectedMode] = useState<"couple" | "vendor" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState<any>(null);

  const previewModes: PreviewMode[] = [
    {
      type: "couple",
      label: "Brudepar-visning",
      description: "Se appen slik brudepar ser den. Inkludert søking etter leverandører, inspirasjon, planlegging og sjekklister.",
      icon: "heart",
      color: "#FF6B9D",
    },
    {
      type: "vendor",
      label: "Leverandør-visning",
      description: "Se appen slik leverandører ser den. Inkludert dashboard, profil, meldinger, tilbud og deliveries.",
      icon: "briefcase",
      color: "#4A90E2",
    },
  ];

  const handleLoadPreview = async (mode: "couple" | "vendor") => {
    setIsLoading(true);
    try {
      const url = new URL(
        `/api/admin/preview/${mode}`,
        process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000"
      );

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${adminKey}` },
      });

      if (!response.ok) {
        throw new Error(`Kunne ikke laste ${mode}-visning`);
      }

      const data = await response.json();
      setTestData(data);
      setSelectedMode(mode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        `${mode === "couple" ? "Brudepar" : "Leverandør"}-visning`,
        `Du ser nå appen fra ${mode === "couple" ? "brudepar" : "leverandør"}-perspektivet. All data og funksjonalitet er begrenset til hva denne rollen kan se og gjøre.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Feil",
        "Kunne ikke laste preview-visning. Sjekk at serveren er konfigurert riktig."
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterPreview = (mode: "couple" | "vendor") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Gå inn i preview-modus",
      `Du vil nå navigere til ${mode === "couple" ? "brudepar" : "leverandør"}-siden. Du kan gå tilbake til admin ved å logg ut.\n\nVil du fortsette?`,
      [
        { text: "Avbryt", onPress: () => {}, style: "cancel" },
        {
          text: "Fortsett",
          onPress: async () => {
            setIsLoading(true);
            try {
              // Store preview mode temporarily
              const params = mode === "couple" ? {} : {};
              
              // Navigate to the appropriate screen
              if (mode === "couple") {
                // @ts-ignore
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Main" }],
                });
              } else {
                // @ts-ignore
                navigation.reset({
                  index: 0,
                  routes: [{ name: "VendorDashboard" }],
                });
              }
            } catch (error) {
              Alert.alert("Feil", "Kunne ikke gå inn i preview-modus");
              console.error(error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={{ marginBottom: Spacing.xl }}>
        <ThemedText style={styles.title}>Preview-modus</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Se appen fra brudepar eller leverandør-perspektivet for å forstå brukeropplevelsen og administrere innhold bedre.
        </ThemedText>
      </View>

      {previewModes.map((mode) => (
        <View
          key={mode.type}
          style={[
            styles.modeCard,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: selectedMode === mode.type ? mode.color : theme.border,
              borderWidth: selectedMode === mode.type ? 2 : 1,
            },
          ]}
        >
          <View style={styles.modeCardContent}>
            <View
              style={[
                styles.modeIcon,
                { backgroundColor: mode.color + "20" },
              ]}
            >
              <Feather name={mode.icon} size={28} color={mode.color} />
            </View>

            <View style={{ flex: 1 }}>
              <ThemedText style={styles.modeLabel}>{mode.label}</ThemedText>
              <ThemedText
                style={[
                  styles.modeDescription,
                  { color: theme.textSecondary },
                ]}
              >
                {mode.description}
              </ThemedText>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              style={[
                styles.infoButton,
                { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={() => handleLoadPreview(mode.type)}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.text} size="small" />
              ) : (
                <>
                  <Feather name="info" size={16} color={theme.text} />
                  <ThemedText style={styles.infoButtonText}>
                    Last data
                  </ThemedText>
                </>
              )}
            </Pressable>

            <Pressable
              style={[styles.enterButton, { backgroundColor: mode.color }]}
              onPress={() => handleEnterPreview(mode.type)}
            >
              <Feather name="arrow-right" size={18} color="#FFF" />
              <ThemedText style={styles.enterButtonText}>
                Gå inn
              </ThemedText>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={[styles.infoBox, { backgroundColor: Colors.dark.accent + "10", borderColor: Colors.dark.accent }]}>
        <Feather name="alert-circle" size={18} color={Colors.dark.accent} />
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <ThemedText style={[styles.infoBoxTitle, { color: Colors.dark.accent }]}>
            Tips for testing
          </ThemedText>
          <ThemedText
            style={[
              styles.infoBoxText,
              { color: Colors.dark.accent, opacity: 0.8 },
            ]}
          >
            • Bruk "Last data" for å se eksempeldata for denne rollen
            • Bruk "Gå inn" for å navigere til full visning av appen
            • Logg ut når som helst for å returnere til admin-dashbordet
          </ThemedText>
        </View>
      </View>

      <View style={[styles.useCaseBox, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <ThemedText style={styles.useCaseTitle}>Brukstilfeller:</ThemedText>
        <View style={styles.useCaseList}>
          <UseCaseItem 
            icon="check-circle"
            text="Teste nye funksjoner fra bruker-perspektivet"
            theme={theme}
          />
          <UseCaseItem 
            icon="check-circle"
            text="Reprodusere bruker-rapporterte feil"
            theme={theme}
          />
          <UseCaseItem 
            icon="check-circle"
            text="Verifisere at innholdfiltre og tillatelser fungerer riktig"
            theme={theme}
          />
          <UseCaseItem 
            icon="check-circle"
            text="Gjennomgå brukeropplevelse før lansering"
            theme={theme}
          />
          <UseCaseItem 
            icon="check-circle"
            text="Teste betalingsflyt og abonnementsfunksjonalitet"
            theme={theme}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function UseCaseItem({ icon, text, theme }: any) {
  return (
    <View style={styles.useCaseItem}>
      <Feather name={icon as any} size={16} color={Colors.dark.accent} />
      <ThemedText
        style={[
          styles.useCaseItemText,
          { color: theme.textSecondary, marginLeft: Spacing.md },
        ]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  modeCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  modeCardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
    flexShrink: 0,
  },
  modeLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  modeDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  infoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  enterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  enterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  infoBox: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  infoBoxText: {
    fontSize: 12,
    lineHeight: 16,
  },
  useCaseBox: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  useCaseTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  useCaseList: {
    gap: Spacing.md,
  },
  useCaseItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  useCaseItemText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
