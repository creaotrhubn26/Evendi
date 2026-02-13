import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  Image,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const LOGO = require("../../assets/images/Evendi_logo_norsk_tagline.png");

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ================================================================
   7-TIER BREAKPOINTS  (320 · 480 · 640 · 768 · 1024 · 1280 · 1536)
   ================================================================ */
function useTier() {
  const [w, setW] = useState(SCREEN_WIDTH);
  React.useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) =>
      setW(window.width),
    );
    return () => sub.remove();
  }, []);

  if (w >= 1536) return 7;
  if (w >= 1280) return 6;
  if (w >= 1024) return 5;
  if (w >= 768) return 4;
  if (w >= 640) return 3;
  if (w >= 480) return 2;
  return 1;
}

function tierValue<T>(tier: number, map: Record<number, T>): T {
  for (let t = tier; t >= 1; t--) {
    if (map[t] !== undefined) return map[t];
  }
  return map[1];
}

function parseJsonSetting<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function splitByPlaceholder(text: string, placeholder: string): [string, string] {
  const index = text.indexOf(placeholder);
  if (index === -1) return [text, ""];
  return [text.slice(0, index), text.slice(index + placeholder.length)];
}

/* ================================================================
   DATA (from DocumentationScreen features)
   ================================================================ */
interface FeatureItem {
  icon: string;
  title: string;
  desc: string;
  color: string;
}
interface StatItem {
  value: string;
  label: string;
}
interface TestimonialItem {
  initials: string;
  name: string;
  role: string;
  quote: string;
}

const COUPLE_FEATURES: FeatureItem[] = [
  { icon: "📅", title: "Planlegg arrangementet", desc: "Sjekkliste, budsjett, tidslinje, påminnelser og fotoplan — alt på ett sted.", color: "#845EF7" },
  { icon: "🔍", title: "Finn leverandører", desc: "Søk på kategori og sted, se profiler, bilder, anmeldelser og priser.", color: "#20C997" },
  { icon: "👥", title: "Administrer gjester", desc: "Gjesteliste, RSVP, matpreferanser, allergier og interaktivt bordkart.", color: "#FA5252" },
  { icon: "💬", title: "Meldinger og kontakt", desc: "Chat med leverandører og kontakt Evendi Support direkte.", color: "#51CF66" },
  { icon: "📸", title: "Fotoplan", desc: "Planlegg bilder og del fotoplanen med fotografen.", color: "#F06595" },
  { icon: "🆘", title: "Support", desc: "Chat, e-post eller FAQ — vi svarer vanligvis innen 24 timer.", color: "#748FFC" },
];

const VENDOR_FEATURES: FeatureItem[] = [
  { icon: "👤", title: "Opprett profil", desc: "Vis bilder, beskrivelse, priser og kontaktinfo for å skille deg ut.", color: "#FF6B6B" },
  { icon: "📩", title: "Håndter meldinger", desc: "Kommuniser med par, send tilbud og del filer. Rask respons øker synligheten.", color: "#51CF66" },
  { icon: "🖼️", title: "Del inspirasjon", desc: "Vis fram arbeidet ditt i inspirasjonsgalleriet for bedre synlighet.", color: "#4DABF7" },
  { icon: "🏷️", title: "Opprett tilbud", desc: "Spesialtilbud og kampanjer som vises på profilen din og i søk.", color: "#FFA94D" },
  { icon: "📦", title: "Administrer produkter", desc: "Legg til tjenester og produkter med priser, bilder og beskrivelser.", color: "#E64980" },
  { icon: "🚚", title: "Leveranser", desc: "Opprett og spor leveranser knyttet til par med statusoppdateringer.", color: "#15AABF" },
  { icon: "🎧", title: "Support og hjelp", desc: "FAQ, dokumentasjon, videoguider og direkte chat.", color: "#748FFC" },
];

const STEPS = [
  { icon: "1", title: "Opprett konto", desc: "Registrer deg gratis som par eller leverandør — under ett minutt." },
  { icon: "2", title: "Planlegg og søk", desc: "Sjekkliste, budsjett, tidslinje. Søk blant hundrevis av leverandører." },
  { icon: "3", title: "Book og chat", desc: "Send meldinger, motta tilbud og signer kontrakter direkte i appen." },
  { icon: "4", title: "Nyt dagen!", desc: "Alt er klart — slapp av og feir. Leverandørene er på plass." },
];

const STATS = [
  { value: "500+", label: "Leverandører" },
  { value: "12", label: "Kategorier" },
  { value: "24t", label: "Support" },
  { value: "100%", label: "Gratis for par" },
];

const TESTIMONIALS = [
  { initials: "SL", name: "Sara & Lars", role: "Gift i 2025", quote: "Evendi gjorde bryllupsplanleggingen så mye enklere. Vi fant fotografen, cateringen og blomsterdekoratøren på ett sted!" },
  { initials: "MH", name: "Maria Haugen", role: "Bryllupsfotograf", quote: "Som fotograf har jeg fått mange nye kunder gjennom Evendi. Plattformen er enkel og profesjonell." },
  { initials: "KJ", name: "Kari & Jonas", role: "Gift i 2025", quote: "Bordplasseringen med det interaktive kartet var genial. Gjestene våre elsket plassene sine!" },
];

/* ================================================================
   COMPONENT
   ================================================================ */
export default function LandingScreen() {
  const { theme, isDark, designSettings } = useTheme();
  const { getSetting, settingsMap } = useAppSettings();
  const logoSource = designSettings.logoUrl
    ? { uri: designSettings.logoUrl }
    : LOGO;
  const supportEmail = getSetting("support_email", "support@evendi.no");
  const heroBrand = getSetting("landing_hero_brand", "Perfekt Match");
  const heroTitleNo = getSetting("landing_hero_title", "Planlegg drømmearrangementet ditt med {brand}");
  const heroTitleEn = getSetting("landing_hero_title_en", "Plan your dream event with {brand}");
  const heroDescNo = getSetting(
    "landing_hero_description",
    "Evendi kobler par med de beste leverandørene. Planlegg arrangementet ditt — med sjekkliste, budsjett, gjesteliste, tidslinje og inspirasjon."
  );
  const heroDescEn = getSetting(
    "landing_hero_description_en",
    "Evendi connects couples with top vendors. Plan your event with checklists, budgets, guest lists, timelines, and inspiration."
  );
  const ctaTitleNo = getSetting("landing_cta_title", "Klar for å planlegge drømmearrangementet?");
  const ctaTitleEn = getSetting("landing_cta_title_en", "Ready to plan your dream event?");
  const ctaDescNo = getSetting(
    "landing_cta_description",
    "Last ned Evendi gratis og kom i gang med planleggingen i dag."
  );
  const ctaDescEn = getSetting("landing_cta_description_en", "");
  const [heroNoBefore, heroNoAfter] = splitByPlaceholder(heroTitleNo, "{brand}");
  const [heroEnBefore, heroEnAfter] = splitByPlaceholder(heroTitleEn, "{brand}");
  const coupleFeatures = useMemo(
    () => parseJsonSetting<FeatureItem[]>(getSetting("landing_couple_features_json", ""), COUPLE_FEATURES),
    [getSetting, settingsMap]
  );
  const vendorFeatures = useMemo(
    () => parseJsonSetting<FeatureItem[]>(getSetting("landing_vendor_features_json", ""), VENDOR_FEATURES),
    [getSetting, settingsMap]
  );
  const steps = useMemo(
    () => parseJsonSetting<typeof STEPS>(getSetting("landing_steps_json", ""), STEPS),
    [getSetting, settingsMap]
  );
  const stats = useMemo(
    () => parseJsonSetting<StatItem[]>(getSetting("landing_stats_json", ""), STATS),
    [getSetting, settingsMap]
  );
  const testimonials = useMemo(
    () => parseJsonSetting<TestimonialItem[]>(getSetting("landing_testimonials_json", ""), TESTIMONIALS),
    [getSetting, settingsMap]
  );
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tier = useTier();
  const scrollY = useSharedValue(0);
  const [activeTab, setActiveTab] = useState<"couple" | "vendor">("couple");

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroParallax = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, 300], [0, -60]) }],
  }));

  /* ---- Responsive values ---- */
  const pad = tierValue(tier, { 1: Spacing.lg, 2: Spacing.xl, 4: Spacing["3xl"], 6: Spacing["4xl"] });
  const sectionGap = tierValue(tier, { 1: 48, 3: 64, 5: 80, 7: 112 });
  const heroLogoWidth = tierValue(tier, { 1: 200, 2: 240, 3: 260, 4: 280, 5: 300, 6: 320, 7: 360 });
  const heroTitleSize = tierValue(tier, { 1: 28, 2: 32, 3: 36, 4: 40, 5: 48, 6: 52, 7: 60 });
  const heroDescSize = tierValue(tier, { 1: 15, 2: 16, 3: 17, 4: 18, 5: 18, 6: 19, 7: 20 });
  const sectionTitleSize = tierValue(tier, { 1: 22, 2: 24, 3: 26, 4: 28, 5: 32, 6: 36, 7: 40 });
  const maxContent = tierValue(tier, { 1: 600, 3: 700, 5: 960, 6: 1140, 7: 1320 });
  const featureCols = tierValue(tier, { 1: 1, 3: 2, 5: 3, 7: 4 });
  const stepCols = tierValue(tier, { 1: 1, 3: 2, 4: 4, 7: 4 });
  const testCols = tierValue(tier, { 1: 1, 3: 2, 5: 3 });
  const statCols = tierValue(tier, { 1: 2, 2: 4 });

  const features = activeTab === "couple" ? coupleFeatures : vendorFeatures;

  const handleGetStarted = useCallback(() => {
    navigation.navigate("Login");
  }, [navigation]);

  const handleVendorLogin = useCallback(() => {
    navigation.navigate("VendorLogin");
  }, [navigation]);

  const contentStyle = {
    maxWidth: maxContent,
    width: "100%" as const,
    alignSelf: "center" as const,
    paddingHorizontal: pad,
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.backgroundRoot }]}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ====== HERO ====== */}
        <Animated.View style={heroParallax}>
          <LinearGradient
            colors={
              isDark
                ? ["#0F1F3A", "#172A4A", "#0F1F3A"]
                : ["#F5F8FC", "#E6EDF7", "#F5F8FC"]
            }
            style={[styles.hero, { paddingHorizontal: pad, paddingTop: tierValue(tier, { 1: 80, 3: 100, 5: 120, 7: 140 }) }]}
          >
            {/* Glow orb */}
            <View style={styles.heroGlow} />

            <Animated.View entering={FadeInDown.duration(700).delay(100)}>
              <Image
                source={logoSource}
                style={{ width: heroLogoWidth, height: heroLogoWidth * 0.4, alignSelf: "center", marginBottom: 20 }}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(700).delay(200)} style={styles.badgeContainer}>
              <View style={[styles.badge, { backgroundColor: "rgba(30,107,255,0.12)", borderColor: "rgba(30,107,255,0.25)" }]}>
                <ThemedText style={[styles.badgeText, { color: "#00D2C6" }]}>
                  {designSettings.appTagline || "Ditt arrangement. Perfekt Match."}
                  {"\n"}
                  {designSettings.appTaglineEn || "Your Event. Perfectly Matched."}
                </ThemedText>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(700).delay(300)}>
              <ThemedText style={[styles.heroTitle, { fontSize: heroTitleSize, color: theme.text }]}> 
                {heroNoBefore}
                {heroTitleNo.includes("{brand}") && (
                  <ThemedText style={[styles.heroTitle, { fontSize: heroTitleSize, color: theme.info }]}>
                    {heroBrand}
                  </ThemedText>
                )}
                {heroNoAfter}
                {"\n"}
                {heroEnBefore}
                {heroTitleEn.includes("{brand}") && (
                  <ThemedText style={[styles.heroTitle, { fontSize: heroTitleSize, color: theme.info }]}>
                    {heroBrand}
                  </ThemedText>
                )}
                {heroEnAfter}
              </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(700).delay(400)}>
              <ThemedText style={[styles.heroDesc, { fontSize: heroDescSize, color: theme.textSecondary }]}> 
                {heroDescNo}
                {heroDescEn ? `\n${heroDescEn}` : ""}
              </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(700).delay(500)} style={[styles.heroActions, tier >= 2 && styles.heroActionsRow]}>
              <Pressable
                onPress={handleGetStarted}
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                ]}
              >
                <ThemedText style={styles.btnPrimaryText}>Start planleggingen →</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleVendorLogin}
                style={({ pressed }) => [
                  styles.btnSecondary,
                  { borderColor: theme.border },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <ThemedText style={[styles.btnSecondaryText, { color: theme.textSecondary }]}>
                  For leverandører
                  {"\n"}
                  For vendors
                </ThemedText>
              </Pressable>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* ====== STATS ====== */}
        <Animated.View entering={FadeInUp.duration(600).delay(600)} style={contentStyle}>
          <View style={[styles.statsGrid, { gap: tierValue(tier, { 1: 10, 3: 14, 5: 18 }) }]}>
            {stats.map((stat, i) => (
              <View
                key={i}
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    width: `${(100 / statCols) - 2}%` as any,
                  },
                ]}
              >
                <ThemedText style={styles.statNumber}>{stat.value}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>{stat.label}</ThemedText>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ====== FEATURES ====== */}
        <View style={[contentStyle, { marginTop: sectionGap }]}>
          <Animated.View entering={FadeIn.delay(100)}>
            <ThemedText style={[styles.sectionLabel, { color: "#00D2C6" }]}>Funksjoner</ThemedText>
            <ThemedText style={[styles.sectionTitle, { fontSize: sectionTitleSize, color: theme.text }]}>
              Alt du trenger for det perfekte arrangementet
              {"\n"}
              Everything you need for the perfect event
            </ThemedText>
            <ThemedText style={[styles.sectionDesc, { color: theme.textSecondary }]}>
              Fra første idé til siste dans — Evendi har verktøyene som gjør planleggingen enkel.
              {"\n"}
              From first idea to last dance — Evendi has the tools to keep planning simple.
            </ThemedText>
          </Animated.View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <Pressable
              onPress={() => setActiveTab("couple")}
              style={[
                styles.tab,
                { borderColor: theme.border },
                activeTab === "couple" && { backgroundColor: "#1E6BFF", borderColor: "#1E6BFF" },
              ]}
            >
              <ThemedText style={[styles.tabText, activeTab === "couple" && { color: "#fff" }]}>
                For par
                {"\n"}
                For couples
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("vendor")}
              style={[
                styles.tab,
                { borderColor: theme.border },
                activeTab === "vendor" && { backgroundColor: "#1E6BFF", borderColor: "#1E6BFF" },
              ]}
            >
              <ThemedText style={[styles.tabText, activeTab === "vendor" && { color: "#fff" }]}>
                For leverandører
                {"\n"}
                For vendors
              </ThemedText>
            </Pressable>
          </View>

          {/* Feature cards */}
          <View style={[styles.grid, { gap: tierValue(tier, { 1: 12, 3: 16, 5: 20, 7: 28 }) }]}>
            {features.map((feat, i) => (
              <Animated.View
                key={`${activeTab}-${i}`}
                entering={FadeInDown.duration(400).delay(i * 80)}
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    width: featureCols === 1
                      ? "100%"
                      : `${(100 / featureCols) - (featureCols > 1 ? 2 : 0)}%` as any,
                  },
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: feat.color + "1A" }]}>
                  <ThemedText style={{ fontSize: 24 }}>{feat.icon}</ThemedText>
                </View>
                <ThemedText style={[styles.featureTitle, { color: theme.text }]}>{feat.title}</ThemedText>
                <ThemedText style={[styles.featureDesc, { color: theme.textSecondary }]}>{feat.desc}</ThemedText>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ====== HOW IT WORKS ====== */}
        <View style={[contentStyle, { marginTop: sectionGap }]}>
          <Animated.View entering={FadeIn.delay(100)}>
            <ThemedText style={[styles.sectionLabel, { color: "#00D2C6" }]}>Slik fungerer det</ThemedText>
            <ThemedText style={[styles.sectionTitle, { fontSize: sectionTitleSize, color: theme.text }]}>
              Fra idé til feiring på fire steg
              {"\n"}
              From idea to celebration in four steps
            </ThemedText>
            <ThemedText style={[styles.sectionDesc, { color: theme.textSecondary }]}>
              Evendi gjør planleggingsprosessen enkel — uansett hva du feirer.
              {"\n"}
              Evendi keeps the process simple — whatever you are celebrating.
            </ThemedText>
          </Animated.View>

          <View style={[styles.grid, { gap: tierValue(tier, { 1: 16, 3: 18, 5: 24 }) }]}>
            {steps.map((step, i) => (
              <Animated.View
                key={i}
                entering={FadeInDown.duration(400).delay(i * 100)}
                style={[
                  styles.stepCard,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    width: stepCols === 1
                      ? "100%"
                      : `${(100 / stepCols) - (stepCols > 1 ? 2 : 0)}%` as any,
                  },
                ]}
              >
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>{step.icon}</ThemedText>
                </View>
                <ThemedText style={[styles.stepTitle, { color: theme.text }]}>{step.title}</ThemedText>
                <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>{step.desc}</ThemedText>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ====== TESTIMONIALS ====== */}
        <View style={[contentStyle, { marginTop: sectionGap }]}>
          <Animated.View entering={FadeIn.delay(100)}>
            <ThemedText style={[styles.sectionLabel, { color: "#00D2C6" }]}>Anmeldelser</ThemedText>
            <ThemedText style={[styles.sectionTitle, { fontSize: sectionTitleSize, color: theme.text }]}>
              Hva brukerne sier
              {"\n"}
              What people say
            </ThemedText>
          </Animated.View>

          <View style={[styles.grid, { gap: tierValue(tier, { 1: 12, 3: 16, 5: 24 }) }]}>
            {testimonials.map((t, i) => (
              <Animated.View
                key={i}
                entering={FadeInDown.duration(400).delay(i * 100)}
                style={[
                  styles.testimonialCard,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    width: testCols === 1
                      ? "100%"
                      : `${(100 / testCols) - (testCols > 1 ? 2 : 0)}%` as any,
                  },
                ]}
              >
                <ThemedText style={styles.stars}>★★★★★</ThemedText>
                <ThemedText style={[styles.quote, { color: theme.textSecondary }]}>
                  "{t.quote}"
                </ThemedText>
                <View style={styles.authorRow}>
                  <LinearGradient
                    colors={["#1E6BFF", "#00D2C6"]}
                    style={styles.avatar}
                  >
                    <ThemedText style={styles.avatarText}>{t.initials}</ThemedText>
                  </LinearGradient>
                  <View>
                    <ThemedText style={[styles.authorName, { color: theme.text }]}>{t.name}</ThemedText>
                    <ThemedText style={[styles.authorRole, { color: theme.textMuted }]}>{t.role}</ThemedText>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ====== CTA BANNER ====== */}
        <Animated.View entering={FadeIn.delay(200)} style={{ marginTop: sectionGap }}>
          <LinearGradient
            colors={
              isDark
                ? ["rgba(30,107,255,0.08)", "rgba(0,210,198,0.06)"]
                : ["rgba(30,107,255,0.04)", "rgba(0,210,198,0.03)"]
            }
            style={[styles.ctaBanner, { paddingHorizontal: pad, borderTopColor: "rgba(30,107,255,0.15)", borderBottomColor: "rgba(0,210,198,0.1)" }]}
          >
            <ThemedText style={[styles.ctaTitle, { fontSize: sectionTitleSize, color: theme.text }]}> 
              {ctaTitleNo}
              {"\n"}
              {ctaTitleEn}
            </ThemedText>
            <ThemedText style={[styles.ctaDesc, { color: theme.textSecondary }]}> 
              {ctaDescNo}
              {ctaDescEn ? `\n${ctaDescEn}` : ""}
            </ThemedText>
            <Pressable
              onPress={handleGetStarted}
              style={({ pressed }) => [
                styles.btnPrimary,
                { paddingHorizontal: 36, paddingVertical: 16, alignSelf: "center" },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
            >
              <ThemedText style={[styles.btnPrimaryText, { fontSize: 16 }]}>Kom i gang →</ThemedText>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {/* ====== FOOTER ====== */}
        <View style={[styles.footer, { borderTopColor: theme.border, paddingHorizontal: pad }]}>
          <Image
            source={logoSource}
            style={{ width: 140, height: 50, alignSelf: "center", marginBottom: 16 }}
            resizeMode="contain"
          />
          <View style={styles.footerLinks}>
            <Pressable onPress={() => Linking.openURL(`mailto:${supportEmail}`)}>
              <ThemedText style={[styles.footerLink, { color: theme.textMuted }]}>{supportEmail}</ThemedText>
            </Pressable>
          </View>
          <ThemedText style={[styles.footerCopy, { color: theme.textMuted }]}>
            © {new Date().getFullYear()} {designSettings.appName || "Evendi"}. Alle rettigheter reservert.
          </ThemedText>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

/* ================================================================
   STYLES
   ================================================================ */
const styles = StyleSheet.create({
  root: { flex: 1 },

  /* Hero */
  hero: {
    paddingBottom: 48,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -120,
    alignSelf: "center",
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(30,107,255,0.08)",
  },
  badgeContainer: { alignItems: "center", marginBottom: 16 },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontWeight: "800",
    textAlign: "center",
    lineHeight: undefined, // set dynamically via fontSize
    marginBottom: 16,
  },
  heroDesc: {
    textAlign: "center",
    maxWidth: 520,
    alignSelf: "center",
    marginBottom: 28,
    lineHeight: 24,
  },
  heroActions: {
    alignItems: "center",
    gap: 12,
  },
  heroActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },

  /* Buttons */
  btnPrimary: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: "#1E6BFF",
    borderRadius: BorderRadius.xs,
    ...Platform.select({
      web: { boxShadow: "0 4px 16px rgba(30,107,255,0.3)" },
      default: { elevation: 3, shadowColor: "#1E6BFF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16 },
    }),
  },
  btnPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
    textAlign: "center",
  },
  btnSecondary: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontWeight: "500",
    fontSize: 15,
    textAlign: "center",
  },

  /* Stats */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 24,
  },
  statCard: {
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E6BFF",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },

  /* Sections */
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  sectionDesc: {
    fontSize: 15,
    textAlign: "center",
    maxWidth: 560,
    alignSelf: "center",
    marginBottom: 28,
    lineHeight: 22,
  },

  /* Tabs */
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },

  /* Grid */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  /* Feature card */
  featureCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 24,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 14,
    lineHeight: 20,
  },

  /* Step card */
  stepCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 24,
    paddingTop: 32,
  },
  stepNumber: {
    position: "absolute",
    top: -14,
    left: 20,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1E6BFF",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 20,
  },

  /* Testimonial */
  testimonialCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 24,
  },
  stars: {
    fontSize: 14,
    color: "#FFC107",
    letterSpacing: 2,
    marginBottom: 12,
  },
  quote: {
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 21,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
  },
  authorRole: {
    fontSize: 12,
  },

  /* CTA */
  ctaBanner: {
    paddingVertical: 48,
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  ctaTitle: {
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  ctaDesc: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 480,
  },

  /* Footer */
  footer: {
    paddingVertical: 32,
    borderTopWidth: 1,
    alignItems: "center",
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 13,
  },
  footerCopy: {
    fontSize: 12,
    textAlign: "center",
  },
});
