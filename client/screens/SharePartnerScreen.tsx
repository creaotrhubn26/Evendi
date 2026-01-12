import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, View, Pressable, Share, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getWeddingDetails } from "@/lib/storage";
import { WeddingDetails } from "@/lib/types";

export default function SharePartnerScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const [wedding, setWedding] = useState<WeddingDetails | null>(null);

  useEffect(() => {
    getWeddingDetails().then(setWedding);
  }, []);

  const shareCode = wedding ? `WEDFLOW-${wedding.coupleNames.replace(/\s+/g, "").substring(0, 6).toUpperCase()}` : "WEDFLOW-DEMO";

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(shareCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Kopiert!", "Delekoden er kopiert til utklippstavlen.");
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Hei! Jeg bruker Wedflow for å planlegge bryllupet vårt. Last ned appen og bruk koden ${shareCode} for å bli med!

Last ned Wedflow:
iOS: https://apps.apple.com/app/wedflow
Android: https://play.google.com/store/apps/details?id=no.norwedfilm.wedflow`,
        title: "Del Wedflow med partneren din",
      });
    } catch (error) {
      console.error("Share error:", error);
    }
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
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={[styles.heroSection, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.dark.accent + "20" }]}>
            <Feather name="users" size={40} color={Colors.dark.accent} />
          </View>
          <ThemedText style={styles.title}>Planlegg sammen</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Del bryllupsplanleggingen med partneren din
          </ThemedText>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <View style={[styles.codeSection, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>Din delekode</ThemedText>
          <ThemedText style={[styles.codeDescription, { color: theme.textSecondary }]}>
            Del denne koden med partneren din slik at dere kan planlegge bryllupet sammen.
          </ThemedText>
          
          <View style={[styles.codeBox, { backgroundColor: theme.backgroundSecondary, borderColor: Colors.dark.accent }]}>
            <ThemedText style={[styles.codeText, { color: Colors.dark.accent }]}>
              {shareCode}
            </ThemedText>
          </View>

          <Pressable
            onPress={handleCopyCode}
            style={[styles.copyBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
          >
            <Feather name="copy" size={18} color={Colors.dark.accent} />
            <ThemedText style={[styles.copyBtnText, { color: Colors.dark.accent }]}>Kopier kode</ThemedText>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <View style={[styles.stepsSection, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>Slik deler du</ThemedText>
          
          <StepItem
            number={1}
            title="Del koden"
            description="Send delekoden til partneren din via melding eller e-post."
            theme={theme}
          />
          <StepItem
            number={2}
            title="Last ned appen"
            description="Partneren din laster ned Wedflow fra App Store eller Google Play."
            theme={theme}
          />
          <StepItem
            number={3}
            title="Koble sammen"
            description="Partneren din skriver inn delekoden i appen for å bli med."
            theme={theme}
          />
          <StepItem
            number={4}
            title="Planlegg sammen"
            description="Nå kan dere begge se og redigere bryllupsplanene i sanntid!"
            theme={theme}
            isLast
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <Pressable
          onPress={handleShare}
          style={[styles.shareBtn, { backgroundColor: Colors.dark.accent }]}
        >
          <Feather name="share" size={20} color="#1A1A1A" />
          <ThemedText style={styles.shareBtnText}>Del invitasjon</ThemedText>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <View style={[styles.infoBox, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <Feather name="info" size={18} color={theme.textMuted} />
          <ThemedText style={[styles.infoText, { color: theme.textMuted }]}>
            Begge parter må ha Wedflow installert for at delingen skal fungere. Alle endringer synkroniseres automatisk.
          </ThemedText>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function StepItem({ 
  number, 
  title, 
  description, 
  theme, 
  isLast = false 
}: { 
  number: number; 
  title: string; 
  description: string; 
  theme: any;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.stepItem, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
      <View style={[styles.stepNumber, { backgroundColor: Colors.dark.accent }]}>
        <ThemedText style={styles.stepNumberText}>{number}</ThemedText>
      </View>
      <View style={styles.stepContent}>
        <ThemedText style={styles.stepTitle}>{title}</ThemedText>
        <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>{description}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  codeSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  codeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  codeBox: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  codeText: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  copyBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  stepsSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  stepItem: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  stepDesc: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 20,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  shareBtnText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  infoBox: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
