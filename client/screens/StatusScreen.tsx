import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, ActivityIndicator, Linking, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EvendiIcon, EvendiIconGlyphMap } from "@/components/EvendiIcon";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { getAppLanguage, type AppLanguage } from "@/lib/storage";
import { showToast } from "@/lib/toast";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

interface CompanyStoryStat {
  value: string;
  labelNo: string;
  labelEn: string;
}

interface CompanyStoryCard {
  key: string;
  icon: keyof typeof EvendiIconGlyphMap;
  color: string;
  titleNo: string;
  titleEn: string;
  bodyNo: string;
  bodyEn: string;
  backgroundColor?: string;
  borderColor?: string;
  stats?: CompanyStoryStat[];
}

interface CompanyStory {
  titleNo: string;
  titleEn: string;
  introNo: string;
  introEn: string;
  ctaLabelNo: string;
  ctaLabelEn: string;
  ctaUrl: string;
  cards: CompanyStoryCard[];
}

const DEFAULT_COMPANY_STORY: CompanyStory = {
  titleNo: "Norwedfilm — Historien bak Evendi",
  titleEn: "Norwedfilm — The story behind Evendi",
  introNo: "\"Love stories elegantly told\" — Norwedfilm",
  introEn: "\"Love stories elegantly told\" — Norwedfilm",
  ctaLabelNo: "Besok norwedfilm.no",
  ctaLabelEn: "Visit norwedfilm.no",
  ctaUrl: "https://norwedfilm.no",
  cards: [
    {
      key: "who",
      icon: "video",
      color: "#1E6BFF",
      titleNo: "Hvem er Norwedfilm?",
      titleEn: "Who is Norwedfilm?",
      bodyNo: "Norwedfilm er et bryllupsfoto- og filmselskap basert i Oslo, med over 200 bryllup dokumentert gjennom 8+ ar. Vi spesialiserer oss pa tidlos bryllupsfotografi og cinematiske bryllupsfilmer — vi fanger ekte oyeblikk med et kunstnerisk blikk og forteller kjarlighetshistorier med folelse og eleganse.",
      bodyEn: "Norwedfilm is a wedding photography & videography studio based in Oslo, with 200+ weddings documented over 8+ years. We specialize in timeless wedding photography and cinematic wedding films — capturing authentic moments with an artistic eye and telling love stories with emotion and elegance.",
      stats: [
        { value: "200+", labelNo: "Bryllup", labelEn: "Weddings" },
        { value: "8+", labelNo: "Ar erfaring", labelEn: "Years exp." },
      ],
    },
    {
      key: "problem",
      icon: "alert-circle",
      color: "#FF6B6B",
      titleNo: "Problemet vi sa fra innsiden",
      titleEn: "The problem we saw from the inside",
      bodyNo: "Etter a ha vaert til stede pa hundrevis av bryllup, sa vi det samme monsteret gang etter gang: stressede par som jonglerte mellom meldinger, Excel-ark og forskjellige apper for budsjett, gjester og tidslinje. Leverandorer slet med a na de riktige parene og administrere bestillinger effektivt. Det fantes rett og slett ikke en plattform som loste alt — spesielt ikke tilpasset det skandinaviske markedet.",
      bodyEn: "After being present at hundreds of weddings, we saw the same pattern over and over: stressed couples juggling messages, spreadsheets and different apps for budget, guests and timeline. Vendors struggled to reach the right couples and manage bookings efficiently. There simply wasn't a single platform solving everything — especially not tailored for the Scandinavian market.",
    },
    {
      key: "philosophy",
      icon: "heart",
      color: "#1E6BFF",
      titleNo: "Var filosofi",
      titleEn: "Our philosophy",
      bodyNo: "Vi tror at de beste bryllupsopplevelsene oppstar fra ekte relasjoner. Vi tar oss tid til a forsta parets historie, stil og visjon — og var diskrete tilnaerming lar oss fange autentiske, uforberedte oyeblikk mens paret simpelthen nyter dagen sin. Den samme filosofien driver Evendi.",
      bodyEn: "We believe the best wedding experiences come from genuine connections. We take the time to understand each couple's story, style, and vision — and our unobtrusive approach lets us capture authentic, candid moments while couples simply enjoy their day. The same philosophy drives Evendi.",
    },
    {
      key: "solution",
      icon: "zap",
      color: "#51CF66",
      titleNo: "Losningen: Evendi",
      titleEn: "The solution: Evendi",
      bodyNo: "Derfor bygget vi Evendi — appen vi selv onsket at fantes. En komplett bryllupsplattform der par planlegger bryllupet sitt med kraftige verktoy, og leverandorer nar de rette parene gjennom en markedsplass med direkte kommunikasjon. Alt i en app, designet med kjarlighet for skandinaviske bryllup.",
      bodyEn: "That's why we built Evendi — the app we wished existed ourselves. A complete wedding platform where couples plan their wedding with powerful tools, and vendors reach the right couples through a marketplace with direct communication. All in one app, designed with love for Scandinavian weddings.",
      backgroundColor: "#51CF6610",
      borderColor: "#51CF66",
    },
  ],
};

function parseJsonSetting<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export default function StatusScreen() {
  const { theme } = useTheme();
  const { getSetting, settingsMap } = useAppSettings();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [appLanguage, setAppLanguage] = useState<AppLanguage>("nb");
  const supportEmail = getSetting("support_email", "support@evendi.no");
  const websiteUrl = getSetting("app_website", "https://norwedfilm.no");
  const companyStory = useMemo(
    () => parseJsonSetting<CompanyStory>(getSetting("company_story_json", ""), DEFAULT_COMPANY_STORY),
    [getSetting, settingsMap]
  );

  useEffect(() => {
    async function loadLanguage() {
      const language = await getAppLanguage();
      setAppLanguage(language);
    }
    loadLanguage();
  }, []);

  const t = useMemo(() => (nb: string, en: string) => (appLanguage === "en" ? en : nb), [appLanguage]);
  const locale = appLanguage === "en" ? "en-US" : "nb-NO";

  const { data: settings = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const url = new URL("/api/app-settings", getApiUrl());
      const res = await fetch(url);
      if (!res.ok) throw new Error(t("Kunne ikke hente status", "Could not fetch status"));
      return res.json() as Promise<AppSetting[]>;
    },
  });

  const getRemoteSetting = (key: string, fallback = "") =>
    settings.find((setting) => setting.key === key)?.value || fallback;

  const maintenanceMode = getRemoteSetting("maintenance_mode") === "true";
  const maintenanceMessage = getRemoteSetting("maintenance_message");
  const appVersion = getRemoteSetting("app_version");
  const minAppVersion = getRemoteSetting("min_app_version");
  const statusMessage = getRemoteSetting("status_message");
  const statusType = getRemoteSetting("status_type") || "info"; // info, warning, error, success
  const lastUpdated = settings.find(s => s.key === "maintenance_mode")?.updatedAt;

  const getStatusColor = () => {
    if (maintenanceMode) return "#FF6B6B";
    if (statusType === "error") return "#FF6B6B";
    if (statusType === "warning") return "#FFA500";
    if (statusType === "success") return "#51CF66";
    return Colors.dark.accent;
  };

  const getStatusIcon = (): keyof typeof EvendiIconGlyphMap => {
    if (maintenanceMode) return "tool";
    if (statusType === "error") return "alert-circle";
    if (statusType === "warning") return "alert-triangle";
    if (statusType === "success") return "check-circle";
    return "activity";
  };

  const getStatusText = () => {
    if (maintenanceMode) return t("Vedlikehold pågår", "Maintenance in progress");
    if (statusMessage) return statusMessage;
    return t("Alt fungerer normalt", "All systems operational");
  };

  const hasActiveStatus = maintenanceMode || (statusMessage && statusMessage.trim().length > 0);

  const updatedLabel = useMemo(() => {
    if (!lastUpdated) return "";
    return new Date(lastUpdated).toLocaleString(locale);
  }, [lastUpdated]);

  const handleOpenLink = async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        showToast(t("Enheten din kan ikke åpne denne lenken.", "Your device cannot open this link."));
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      showToast(t("Kunne ikke åpne lenken akkurat nå.", "Could not open the link right now."));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={theme.accent}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[styles.header, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <EvendiIcon name="activity" size={32} color={getStatusColor()} />
            <ThemedText style={styles.headerTitle}>{t("Evendi Status", "Evendi Status")}</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {t("Sanntidsstatus for tjenesten", "Real-time service status")}
            </ThemedText>
            {isRefetching && (
              <View style={styles.refreshRow}>
                <ActivityIndicator size="small" color={theme.accent} />
                <ThemedText style={[styles.refreshText, { color: theme.textMuted }]}>{t("Oppdaterer...", "Refreshing...")}</ThemedText>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Loading */}
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: Spacing.xl }} color={theme.accent} />
        ) : (
          <>
            {/* Current Status */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <View
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: getStatusColor() + "15",
                    borderColor: getStatusColor(),
                  },
                ]}
              >
                <View style={styles.statusHeader}>
                  <View style={[styles.statusIconCircle, { backgroundColor: getStatusColor() }]}>
                    <EvendiIcon name={getStatusIcon()} size={24} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.statusTitle, { color: getStatusColor() }]}>
                      {getStatusText()}
                    </ThemedText>
                    {lastUpdated && (
                      <ThemedText style={[styles.statusTime, { color: theme.textMuted }]}>
                        {t("Sist oppdatert", "Last updated")}: {updatedLabel}
                      </ThemedText>
                    )}
                  </View>
                </View>

                {maintenanceMode && maintenanceMessage && (
                  <View style={[styles.messageBox, { backgroundColor: theme.backgroundSecondary }]}>
                    <ThemedText style={[styles.messageText, { color: theme.text }]}>
                      {maintenanceMessage}
                    </ThemedText>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* System Info */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <ThemedText style={styles.sectionTitle}>{t("Systeminformasjon", "System information")}</ThemedText>

                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.accent + "15" }]}>
                    <EvendiIcon name="smartphone" size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.infoLabel}>{t("Gjeldende versjon", "Current version")}</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: theme.textSecondary }]}>
                      {appVersion || t("Ikke satt", "Not set")}
                    </ThemedText>
                  </View>
                </View>

                {minAppVersion && (
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, { backgroundColor: theme.accent + "15" }]}>
                      <EvendiIcon name="alert-circle" size={18} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.infoLabel}>{t("Minimum versjon", "Minimum version")}</ThemedText>
                      <ThemedText style={[styles.infoValue, { color: theme.textSecondary }]}>
                        {minAppVersion}
                      </ThemedText>
                    </View>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: "#51CF66" + "15" }]}>
                    <EvendiIcon name="check-circle" size={18} color="#51CF66" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.infoLabel}>{t("Status", "Status")}</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: theme.textSecondary }]}>
                      {maintenanceMode ? t("Under vedlikehold", "Under maintenance") : t("Operativ", "Operational")}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Quick Links */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <ThemedText style={styles.sectionTitle}>{t("Trenger du hjelp?", "Need help?")}</ThemedText>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate("Documentation" as any);
                  }}
                  style={[styles.link, { borderColor: theme.border }]}
                >
                  <View style={[styles.linkIcon, { backgroundColor: theme.accent + "15" }]}>
                    <EvendiIcon name="book-open" size={18} color={theme.accent} />
                  </View>
                  <ThemedText style={styles.linkText}>{t("Fullstendig dokumentasjon", "Full documentation")}</ThemedText>
                  <EvendiIcon name="chevron-right" size={16} color={theme.textMuted} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    handleOpenLink(`mailto:${supportEmail}`);
                  }}
                  style={[styles.link, { borderColor: theme.border }]}
                >
                  <View style={[styles.linkIcon, { backgroundColor: theme.accent + "15" }]}>
                    <EvendiIcon name="mail" size={18} color={theme.accent} />
                  </View>
                  <ThemedText style={styles.linkText}>{t("Kontakt Support", "Contact support")}</ThemedText>
                  <EvendiIcon name="external-link" size={16} color={theme.textMuted} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    handleOpenLink(websiteUrl);
                  }}
                  style={[styles.link, { borderColor: theme.border }]}
                >
                  <View style={[styles.linkIcon, { backgroundColor: theme.accent + "15" }]}>
                    <EvendiIcon name="globe" size={18} color={theme.accent} />
                  </View>
                  <ThemedText style={styles.linkText}>{websiteUrl.replace(/^https?:\/\//, "")}</ThemedText>
                  <EvendiIcon name="external-link" size={16} color={theme.textMuted} />
                </Pressable>
              </View>
            </Animated.View>

            {!hasActiveStatus && (
              <Animated.View entering={FadeInDown.delay(400).duration(400)}>
                <View style={[styles.infoBox, { backgroundColor: theme.accent + "15", borderColor: theme.accent }]}>
                  <EvendiIcon name="info" size={18} color={theme.accent} />
                  <ThemedText style={[styles.infoText, { color: theme.text }]}>
                    {t("Alle systemer kjører som normalt. Vi overvåker tjenesten kontinuerlig.", "All systems are operating normally. We monitor the service continuously.")}
                  </ThemedText>
                </View>
              </Animated.View>
            )}

            {/* Evendi Vision — The Golden Circle (Simon Sinek) */}
            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
              <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <View style={styles.visionHeader}>
                  <EvendiIcon name="target" size={24} color={theme.accent} />
                  <ThemedText style={styles.sectionTitle}>
                    {t("Evendi Visjonen", "Evendi Vision")}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.visionIntro, { color: theme.textSecondary }]}>
                  {t(
                    "Inspirert av Simon Sineks Golden Circle — vi starter med HVORFOR.",
                    "Inspired by Simon Sinek's Golden Circle — we start with WHY."
                  )}
                </ThemedText>

                {/* WHY */}
                <View style={[styles.circleCard, { backgroundColor: "#FFD70020", borderColor: "#FFD700" }]}>
                  <View style={styles.circleHeader}>
                    <View style={[styles.circleBadge, { backgroundColor: "#FFD700" }]}>
                      <ThemedText style={styles.circleBadgeText}>WHY</ThemedText>
                    </View>
                    <ThemedText style={[styles.circleLabel, { color: "#FFD700" }]}>
                      {t("Hvorfor vi eksisterer", "Why we exist")}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.circleText, { color: theme.text }]}>
                    {t(
                      "Vi tror at bryllupsplanlegging skal være en av de mest magiske opplevelsene i livet — ikke en kilde til stress og kaos. Alle par fortjener å nyte veien mot sin store dag, og alle leverandører fortjener å jobbe med engasjerte par som verdsetter arbeidet deres.",
                      "We believe wedding planning should be one of the most magical experiences in life — not a source of stress and chaos. Every couple deserves to enjoy the journey to their big day, and every vendor deserves to work with engaged couples who value their craft."
                    )}
                  </ThemedText>
                </View>

                {/* HOW */}
                <View style={[styles.circleCard, { backgroundColor: theme.accent + "15", borderColor: theme.accent }]}>
                  <View style={styles.circleHeader}>
                    <View style={[styles.circleBadge, { backgroundColor: theme.accent }]}>
                      <ThemedText style={styles.circleBadgeText}>HOW</ThemedText>
                    </View>
                    <ThemedText style={[styles.circleLabel, { color: theme.accent }]}>
                      {t("Hvordan vi gjør det", "How we do it")}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.circleText, { color: theme.text }]}>
                    {t(
                      "Vi kobler par med de beste leverandørene gjennom smart teknologi, sømløs kommunikasjon og verktøy som forenkler alt — fra budsjettstyring og gjestehåndtering til tidslinje, bordplassering og leveranser. Alt samlet på ett sted, tilgjengelig fra mobilen.",
                      "We connect couples with the best vendors through smart technology, seamless communication and tools that simplify everything — from budget management and guest handling to timeline, seating charts and deliveries. All gathered in one place, accessible from your phone."
                    )}
                  </ThemedText>
                </View>

                {/* WHAT */}
                <View style={[styles.circleCard, { backgroundColor: "#51CF6620", borderColor: "#51CF66" }]}>
                  <View style={styles.circleHeader}>
                    <View style={[styles.circleBadge, { backgroundColor: "#51CF66" }]}>
                      <ThemedText style={styles.circleBadgeText}>WHAT</ThemedText>
                    </View>
                    <ThemedText style={[styles.circleLabel, { color: "#51CF66" }]}>
                      {t("Hva vi tilbyr", "What we offer")}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.circleText, { color: theme.text }]}>
                    {t(
                      "Evendi er en komplett bryllupsplattform — en app der par planlegger bryllupet sitt med kraftige verktøy (planlegging, budsjett, gjester, bordplassering, tidslinje, fotoplan, meldinger), mens leverandører når de rette parene gjennom en markedsplass med profiler, tilbud, produkter og direkte chat. Alt i én app.",
                      "Evendi is a complete wedding platform — an app where couples plan their wedding with powerful tools (planning, budget, guests, seating charts, timeline, photo plan, messaging), while vendors reach the right couples through a marketplace with profiles, offers, products and direct chat. All in one app."
                    )}
                  </ThemedText>
                </View>

                <View style={[styles.visionFooter, { borderTopColor: theme.border }]}>
                  <EvendiIcon name="heart" size={16} color={theme.accent} />
                  <ThemedText style={[styles.visionFooterText, { color: theme.textMuted }]}>
                    {t(
                      "\"Folk kjøper ikke HVA du gjør, de kjøper HVORFOR du gjør det.\" — Simon Sinek",
                      "\"People don't buy WHAT you do, they buy WHY you do it.\" — Simon Sinek"
                    )}
                  </ThemedText>
                </View>
              </View>
            </Animated.View>

            {/* Company story */}
            <Animated.View entering={FadeInDown.delay(600).duration(400)}>
              <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
                <View style={styles.visionHeader}>
                  <EvendiIcon name="film" size={24} color={theme.accent} />
                  <ThemedText style={styles.sectionTitle}>
                    {t(companyStory.titleNo, companyStory.titleEn)}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.visionIntro, { color: theme.textSecondary }]}> 
                  {t(companyStory.introNo, companyStory.introEn)}
                </ThemedText>

                {companyStory.cards.map((card) => (
                  <View
                    key={card.key}
                    style={[
                      styles.norwedStoryCard,
                      {
                        backgroundColor: card.backgroundColor ?? theme.backgroundSecondary,
                        borderColor: card.borderColor ?? theme.border,
                      },
                    ]}
                  >
                    <View style={styles.norwedStoryRow}>
                      <View style={[styles.norwedIconCircle, { backgroundColor: card.color }]}> 
                        <EvendiIcon name={card.icon} size={20} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.norwedLabel, { color: card.color }]}> 
                          {t(card.titleNo, card.titleEn)}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={[styles.circleText, { color: theme.text }]}> 
                      {t(card.bodyNo, card.bodyEn)}
                    </ThemedText>
                    {card.stats && (
                      <View style={styles.norwedStats}>
                        {card.stats.map((stat) => (
                          <View key={`${card.key}-${stat.value}`} style={styles.norwedStat}>
                            <ThemedText style={[styles.norwedStatNumber, { color: card.color }]}> 
                              {stat.value}
                            </ThemedText>
                            <ThemedText style={[styles.norwedStatLabel, { color: theme.textMuted }]}> 
                              {t(stat.labelNo, stat.labelEn)}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}

                <Pressable
                  onPress={() => handleOpenLink(companyStory.ctaUrl)}
                  style={[styles.norwedCta, { backgroundColor: theme.accent + "15", borderColor: theme.accent }]}
                >
                  <EvendiIcon name="globe" size={18} color={theme.accent} />
                  <ThemedText style={[styles.norwedCtaText, { color: theme.accent }]}> 
                    {t(companyStory.ctaLabelNo, companyStory.ctaLabelEn)}
                  </ThemedText>
                  <EvendiIcon name="external-link" size={14} color={theme.accent} />
                </Pressable>
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md },
  header: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", marginTop: Spacing.sm },
  headerSubtitle: { fontSize: 14, marginTop: Spacing.xs, textAlign: "center" },
  refreshRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: Spacing.sm },
  refreshText: { fontSize: 12 },
  statusCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
  },
  statusIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: { fontSize: 18, fontWeight: "700" },
  statusTime: { fontSize: 12, marginTop: 2 },
  messageBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: Spacing.md },
  infoRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: 14, fontWeight: "600" },
  infoValue: { fontSize: 13, marginTop: 2 },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: { flex: 1, fontSize: 15, fontWeight: "500" },
  infoBox: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  visionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  visionIntro: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: Spacing.lg,
    fontStyle: "italic",
  },
  circleCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  circleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  circleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  circleBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  circleLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  circleText: {
    fontSize: 14,
    lineHeight: 22,
  },
  visionFooter: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  visionFooterText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  norwedStoryCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  norwedStoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  norwedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  norwedLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  norwedStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  norwedStat: {
    alignItems: "center",
  },
  norwedStatNumber: {
    fontSize: 22,
    fontWeight: "800",
  },
  norwedStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  norwedCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  norwedCtaText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
