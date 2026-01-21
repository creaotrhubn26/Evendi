import React, { useState } from "react";
import { ScrollView, StyleSheet, View, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInRight, FadeInLeft, useAnimatedStyle, withSpring, withRepeat, withSequence } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface Feature {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
  steps?: string[];
  category: "vendor" | "couple" | "both";
}

const FEATURES: Feature[] = [
  {
    id: "profile",
    icon: "user",
    title: "Opprett og Administrer Profil",
    description: "Din bedriftsprofil er det første par ser. Hold den oppdatert med bilder, beskrivelse og priser.",
    color: "#FF6B6B",
    category: "vendor",
    steps: [
      "Gå til 'Min Profil' fra Dashboard",
      "Fyll inn virksomhetsinformasjon",
      "Last opp logoer og bilder",
      "Angi priskategorier og tjenester",
      "Lagre endringer"
    ]
  },
  {
    id: "messages",
    icon: "message-circle",
    title: "Håndter Meldinger",
    description: "Kommuniser direkte med par, send tilbud, og administrer alle henvendelser på ett sted.",
    color: "#51CF66",
    category: "vendor",
    steps: [
      "Klikk på 'Meldinger' i navigasjonen",
      "Se alle aktive samtaler",
      "Svar på henvendelser raskt",
      "Send dokumenter og kontrakter",
      "Bruk maler for raskere svar"
    ]
  },
  {
    id: "inspiration",
    icon: "image",
    title: "Del Inspirasjon",
    description: "Vis fram ditt arbeid i inspirasjonsgalleriet. Jo flere gode bilder, jo bedre synlighet!",
    color: "#4DABF7",
    category: "vendor",
    steps: [
      "Naviger til 'Inspirasjon'",
      "Klikk '+ Nytt bilde'",
      "Last opp høykvalitetsbilder",
      "Legg til beskrivelse og tags",
      "Del med par"
    ]
  },
  {
    id: "offers",
    icon: "tag",
    title: "Opprett Tilbud",
    description: "Tiltrekk par med spesialtilbud og kampanjer. Vis hva som gjør deg unik.",
    color: "#FFA94D",
    category: "vendor",
    steps: [
      "Åpne 'Tilbud'-seksjonen",
      "Klikk 'Opprett nytt tilbud'",
      "Sett pris og rabatt",
      "Angi gyldighetsperiode",
      "Publiser tilbudet"
    ]
  },
  {
    id: "planning",
    icon: "calendar",
    title: "Planlegg Bryllupet",
    description: "Bruk vår sjekkliste, budsjett og tidslinje for å holde oversikt over hele planleggingen.",
    color: "#845EF7",
    category: "couple",
    steps: [
      "Gå til 'Planlegging'",
      "Sett bryllupsdato",
      "Bruk sjekklisten for oppgaver",
      "Administrer budsjett",
      "Lag tidslinje for dagen"
    ]
  },
  {
    id: "vendors",
    icon: "briefcase",
    title: "Finn Leverandører",
    description: "Søk blant hundrevis av leverandører. Filtrer på kategori, sted og pris.",
    color: "#20C997",
    category: "couple",
    steps: [
      "Åpne 'Leverandører'",
      "Bruk filtre for å finne riktig kategori",
      "Se profiler og bilder",
      "Les anmeldelser",
      "Send melding direkte"
    ]
  },
  {
    id: "guests",
    icon: "users",
    title: "Administrer Gjester",
    description: "Hold oversikt over gjestelisten, RSVP, matpreferanser og bordplassering.",
    color: "#FA5252",
    category: "couple",
    steps: [
      "Naviger til 'Gjester'",
      "Legg til gjester",
      "Send digitale invitasjoner",
      "Spor RSVP-svar",
      "Planlegg bordplassering"
    ]
  },
  {
    id: "support",
    icon: "help-circle",
    title: "Få Support",
    description: "Trenger du hjelp? Kontakt oss via chat, e-post eller se vår omfattende FAQ.",
    color: "#748FFC",
    category: "both",
    steps: [
      "Klikk 'Wedflow Support' i menyen",
      "Velg mellom FAQ eller direkte chat",
      "Beskriv ditt problem",
      "Vi svarer innen 24 timer",
      "Få personlig hjelp"
    ]
  }
];

export default function DocumentationScreen() {
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<"vendor" | "couple" | "both">("vendor");
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const filteredFeatures = FEATURES.filter(
    f => f.category === activeCategory || f.category === "both"
  );

  const handleToggleFeature = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedFeature(expandedFeature === id ? null : id);
  };

  const handleCategoryChange = (category: "vendor" | "couple" | "both") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveCategory(category);
    setExpandedFeature(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: Spacing.xl * 2,
          paddingHorizontal: Spacing.lg,
        }}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[styles.header, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <View style={[styles.headerIcon, { backgroundColor: theme.accent + "20" }]}>
              <Feather name="book-open" size={32} color={theme.accent} />
            </View>
            <ThemedText style={styles.headerTitle}>Slik Bruker Du Wedflow</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Komplett guide til alle funksjoner
            </ThemedText>
          </View>
        </Animated.View>

        {/* Category Tabs */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={[styles.categoryTabs, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <Pressable
              onPress={() => handleCategoryChange("vendor")}
              style={[
                styles.categoryTab,
                activeCategory === "vendor" && [styles.categoryTabActive, { backgroundColor: theme.accent }],
                activeCategory !== "vendor" && { backgroundColor: theme.backgroundSecondary }
              ]}
            >
              <Feather 
                name="briefcase" 
                size={18} 
                color={activeCategory === "vendor" ? "#FFFFFF" : theme.textSecondary} 
              />
              <ThemedText 
                style={[
                  styles.categoryTabText,
                  { color: activeCategory === "vendor" ? "#FFFFFF" : theme.textSecondary }
                ]}
              >
                For Leverandører
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => handleCategoryChange("couple")}
              style={[
                styles.categoryTab,
                activeCategory === "couple" && [styles.categoryTabActive, { backgroundColor: theme.accent }],
                activeCategory !== "couple" && { backgroundColor: theme.backgroundSecondary }
              ]}
            >
              <Feather 
                name="heart" 
                size={18} 
                color={activeCategory === "couple" ? "#FFFFFF" : theme.textSecondary} 
              />
              <ThemedText 
                style={[
                  styles.categoryTabText,
                  { color: activeCategory === "couple" ? "#FFFFFF" : theme.textSecondary }
                ]}
              >
                For Brudepar
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        {/* Features List */}
        {filteredFeatures.map((feature, index) => (
          <Animated.View 
            key={feature.id}
            entering={FadeInDown.delay(200 + index * 50).duration(400)}
          >
            <Pressable
              onPress={() => handleToggleFeature(feature.id)}
              style={[
                styles.featureCard,
                { 
                  backgroundColor: theme.backgroundDefault, 
                  borderColor: expandedFeature === feature.id ? feature.color : theme.border,
                  borderWidth: expandedFeature === feature.id ? 2 : 1,
                }
              ]}
            >
              <View style={styles.featureHeader}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color + "20" }]}>
                  <Feather name={feature.icon} size={24} color={feature.color} />
                </View>
                <View style={styles.featureInfo}>
                  <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>
                  <ThemedText style={[styles.featureDescription, { color: theme.textSecondary }]}>
                    {feature.description}
                  </ThemedText>
                </View>
                <Feather 
                  name={expandedFeature === feature.id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.textMuted} 
                />
              </View>

              {expandedFeature === feature.id && feature.steps && (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <View style={[styles.stepsContainer, { borderTopColor: theme.border }]}>
                    <ThemedText style={[styles.stepsTitle, { color: feature.color }]}>
                      📋 Steg-for-steg:
                    </ThemedText>
                    {feature.steps.map((step, i) => (
                      <Animated.View 
                        key={i}
                        entering={FadeInRight.delay(i * 50).duration(300)}
                        style={styles.stepItem}
                      >
                        <View style={[styles.stepNumber, { backgroundColor: feature.color }]}>
                          <ThemedText style={styles.stepNumberText}>{i + 1}</ThemedText>
                        </View>
                        <ThemedText style={[styles.stepText, { color: theme.text }]}>
                          {step}
                        </ThemedText>
                      </Animated.View>
                    ))}
                  </View>
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>
        ))}

        {/* Tips Section */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <View style={[styles.tipsBox, { backgroundColor: theme.accent + "15", borderColor: theme.accent }]}>
            <View style={[styles.tipsIcon, { backgroundColor: theme.accent }]}>
              <Feather name="zap" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.tipsContent}>
              <ThemedText style={[styles.tipsTitle, { color: theme.accent }]}>
                Pro Tips!
              </ThemedText>
              <ThemedText style={[styles.tipsText, { color: theme.text }]}>
                {activeCategory === "vendor" 
                  ? "Svar raskt på henvendelser og hold profilen oppdatert for best synlighet. Par setter pris på rask respons!"
                  : "Begynn planleggingen tidlig og bruk sjekklistene våre. Kommuniser tydelig med leverandører for best resultat!"
                }
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        {/* Video Section Placeholder */}
        <Animated.View entering={FadeInDown.delay(700).duration(400)}>
          <View style={[styles.videoSection, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <View style={[styles.videoPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={[styles.playButton, { backgroundColor: theme.accent }]}>
                <Feather name="play" size={32} color="#FFFFFF" />
              </View>
            </View>
            <ThemedText style={styles.videoTitle}>Videoguider</ThemedText>
            <ThemedText style={[styles.videoDescription, { color: theme.textSecondary }]}>
              Se våre videoguider for visuell opplæring i alle funksjoner. Kommer snart!
            </ThemedText>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  categoryTabs: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  categoryTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  categoryTabActive: {},
  categoryTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  featureCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  stepsContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 2,
  },
  tipsBox: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  tipsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  videoSection: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: "center",
  },
  videoPlaceholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  videoDescription: {
    fontSize: 14,
    textAlign: "center",
  },
});
