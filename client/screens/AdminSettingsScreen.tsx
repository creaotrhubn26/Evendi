import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { EvendiIcon } from "@/components/EvendiIcon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { AdminHeader } from "@/components/AdminHeader";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { showToast } from "@/lib/toast";
import PersistentTextInput from "@/components/PersistentTextInput";

const useFieldValidation = () => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: string, value: string): string => {
    switch (field) {
      case "supportEmail":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Ugyldig e-postadresse";
        return "";
      case "privacyPolicyUrl":
      case "termsUrl":
      case "appWebsite":
      case "appStoreUrl":
      case "playStoreUrl":
        if (value && !/^https?:\/\/.+/.test(value)) return "URL må starte med http:// eller https://";
        return "";
      case "currencyCode":
        if (value && !/^[A-Z]{3}$/.test(value)) return "Må være en 3-bokstavskode (f.eks. NOK)";
        return "";
      case "currencyLocale":
        if (value && !/^[a-z]{2}(-[A-Z]{2})?$/.test(value)) return "Ugyldig locale (f.eks. nb-NO)";
        return "";
      case "maxFileUploadMb":
        if (value && !/^\d+$/.test(value)) return "Må være et tall";
        return "";
      default:
        return "";
    }
  }, []);

  const handleBlur = useCallback((field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, [validateField]);

  const getFieldStyle = useCallback((field: string) => {
    if (touched[field] && errors[field]) {
      return { borderColor: "#DC3545" };
    }
    return {};
  }, [touched, errors]);

  const validateAll = (fields: Record<string, string>) => {
    const nextTouched: Record<string, boolean> = {};
    const nextErrors: Record<string, string> = {};

    Object.entries(fields).forEach(([field, value]) => {
      nextTouched[field] = true;
      const error = validateField(field, value);
      if (error) nextErrors[field] = error;
    });

    setTouched((prev) => ({ ...prev, ...nextTouched }));
    setErrors((prev) => ({ ...prev, ...nextErrors }));

    return Object.keys(nextErrors).length === 0;
  };

  return { touched, errors, handleBlur, getFieldStyle, validateAll };
};

interface AppSetting {
  id: string;
  key: string;
  value: string;
  category: string;
}

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const route = useRoute<RouteProp<RootStackParamList, "AdminSettings">>();
  const adminKey = route.params?.adminKey || "";
  const { touched, errors, handleBlur, getFieldStyle, validateAll } = useFieldValidation();

  const [enableVendorRegistration, setEnableVendorRegistration] = useState(true);
  const [requireInspirationApproval, setRequireInspirationApproval] = useState(true);
  const [enableMessaging, setEnableMessaging] = useState(true);
  const [maxFileUploadMb, setMaxFileUploadMb] = useState("50");
  const [supportEmail, setSupportEmail] = useState("");
  const [appWebsite, setAppWebsite] = useState("");
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [playStoreUrl, setPlayStoreUrl] = useState("");
  const [footerBrandText, setFooterBrandText] = useState("");
  const [footerTagline, setFooterTagline] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [currencyLocale, setCurrencyLocale] = useState("");
  const [vendorSupportWelcomeMessage, setVendorSupportWelcomeMessage] = useState("");
  const [notificationCountdownTitleTemplate, setNotificationCountdownTitleTemplate] = useState("");
  const [notificationCountdownBodyTemplate, setNotificationCountdownBodyTemplate] = useState("");
  const [notificationChecklistTitle, setNotificationChecklistTitle] = useState("");
  const [notificationChecklistBodyTemplate, setNotificationChecklistBodyTemplate] = useState("");
  const [notificationToastChecklistFailed, setNotificationToastChecklistFailed] = useState("");
  const [notificationToastUpdated, setNotificationToastUpdated] = useState("");
  const [notificationToastPermissionGranted, setNotificationToastPermissionGranted] = useState("");
  const [landingHeroBrand, setLandingHeroBrand] = useState("");
  const [landingHeroTitle, setLandingHeroTitle] = useState("");
  const [landingHeroTitleEn, setLandingHeroTitleEn] = useState("");
  const [landingHeroDescription, setLandingHeroDescription] = useState("");
  const [landingHeroDescriptionEn, setLandingHeroDescriptionEn] = useState("");
  const [landingCtaTitle, setLandingCtaTitle] = useState("");
  const [landingCtaTitleEn, setLandingCtaTitleEn] = useState("");
  const [landingCtaDescription, setLandingCtaDescription] = useState("");
  const [landingCtaDescriptionEn, setLandingCtaDescriptionEn] = useState("");
  const [landingStatsJson, setLandingStatsJson] = useState("");
  const [landingTestimonialsJson, setLandingTestimonialsJson] = useState("");
  const [landingStepsJson, setLandingStepsJson] = useState("");
  const [landingCoupleFeaturesJson, setLandingCoupleFeaturesJson] = useState("");
  const [landingVendorFeaturesJson, setLandingVendorFeaturesJson] = useState("");
  const [companyStoryJson, setCompanyStoryJson] = useState("");
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("");
  const [termsUrl, setTermsUrl] = useState("");

  const { data: settings, isLoading } = useQuery<AppSetting[]>({
    queryKey: ["/api/admin/settings", adminKey],
    queryFn: async () => {
      const url = new URL("/api/admin/settings", getApiUrl());
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!response.ok) throw new Error("Kunne ikke hente innstillinger");
      return response.json();
    },
    enabled: adminKey.length > 0,
  });

  useEffect(() => {
    if (settings) {
      const getSetting = (key: string, defaultValue: string) => {
        const setting = settings.find(s => s.key === key);
        return setting?.value || defaultValue;
      };
      setEnableVendorRegistration(getSetting("enable_vendor_registration", "true") === "true");
      setRequireInspirationApproval(getSetting("require_inspiration_approval", "true") === "true");
      setEnableMessaging(getSetting("enable_messaging", "true") === "true");
      setMaxFileUploadMb(getSetting("max_file_upload_mb", "50"));
      setSupportEmail(getSetting("support_email", ""));
      setAppWebsite(getSetting("app_website", ""));
      setAppStoreUrl(getSetting("app_store_url", ""));
      setPlayStoreUrl(getSetting("play_store_url", ""));
      setFooterBrandText(getSetting("footer_brand_text", ""));
      setFooterTagline(getSetting("footer_tagline", ""));
      setCurrencyCode(getSetting("currency_code", ""));
      setCurrencyLocale(getSetting("currency_locale", ""));
      setVendorSupportWelcomeMessage(getSetting("vendor_support_welcome_message", ""));
      setNotificationCountdownTitleTemplate(getSetting("notification_countdown_title_template", ""));
      setNotificationCountdownBodyTemplate(getSetting("notification_countdown_body_template", ""));
      setNotificationChecklistTitle(getSetting("notification_checklist_title", ""));
      setNotificationChecklistBodyTemplate(getSetting("notification_checklist_body_template", ""));
      setNotificationToastChecklistFailed(getSetting("notification_toast_checklist_failed", ""));
      setNotificationToastUpdated(getSetting("notification_toast_updated", ""));
      setNotificationToastPermissionGranted(getSetting("notification_toast_permission_granted", ""));
      setLandingHeroBrand(getSetting("landing_hero_brand", ""));
      setLandingHeroTitle(getSetting("landing_hero_title", ""));
      setLandingHeroTitleEn(getSetting("landing_hero_title_en", ""));
      setLandingHeroDescription(getSetting("landing_hero_description", ""));
      setLandingHeroDescriptionEn(getSetting("landing_hero_description_en", ""));
      setLandingCtaTitle(getSetting("landing_cta_title", ""));
      setLandingCtaTitleEn(getSetting("landing_cta_title_en", ""));
      setLandingCtaDescription(getSetting("landing_cta_description", ""));
      setLandingCtaDescriptionEn(getSetting("landing_cta_description_en", ""));
      setLandingStatsJson(getSetting("landing_stats_json", ""));
      setLandingTestimonialsJson(getSetting("landing_testimonials_json", ""));
      setLandingStepsJson(getSetting("landing_steps_json", ""));
      setLandingCoupleFeaturesJson(getSetting("landing_couple_features_json", ""));
      setLandingVendorFeaturesJson(getSetting("landing_vendor_features_json", ""));
      setCompanyStoryJson(getSetting("company_story_json", ""));
      setPrivacyPolicyUrl(getSetting("privacy_policy_url", ""));
      setTermsUrl(getSetting("terms_url", ""));
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = new URL("/api/admin/settings", getApiUrl());
      const response = await fetch(url.toString(), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: [
            { key: "enable_vendor_registration", value: String(enableVendorRegistration), category: "features" },
            { key: "require_inspiration_approval", value: String(requireInspirationApproval), category: "features" },
            { key: "enable_messaging", value: String(enableMessaging), category: "features" },
            { key: "max_file_upload_mb", value: maxFileUploadMb, category: "limits" },
            { key: "support_email", value: supportEmail, category: "contact" },
            { key: "app_website", value: appWebsite, category: "contact" },
            { key: "app_store_url", value: appStoreUrl, category: "marketing" },
            { key: "play_store_url", value: playStoreUrl, category: "marketing" },
            { key: "footer_brand_text", value: footerBrandText, category: "branding" },
            { key: "footer_tagline", value: footerTagline, category: "branding" },
            { key: "currency_code", value: currencyCode, category: "localization" },
            { key: "currency_locale", value: currencyLocale, category: "localization" },
            { key: "vendor_support_welcome_message", value: vendorSupportWelcomeMessage, category: "support" },
            { key: "notification_countdown_title_template", value: notificationCountdownTitleTemplate, category: "notifications" },
            { key: "notification_countdown_body_template", value: notificationCountdownBodyTemplate, category: "notifications" },
            { key: "notification_checklist_title", value: notificationChecklistTitle, category: "notifications" },
            { key: "notification_checklist_body_template", value: notificationChecklistBodyTemplate, category: "notifications" },
            { key: "notification_toast_checklist_failed", value: notificationToastChecklistFailed, category: "notifications" },
            { key: "notification_toast_updated", value: notificationToastUpdated, category: "notifications" },
            { key: "notification_toast_permission_granted", value: notificationToastPermissionGranted, category: "notifications" },
            { key: "landing_hero_brand", value: landingHeroBrand, category: "landing" },
            { key: "landing_hero_title", value: landingHeroTitle, category: "landing" },
            { key: "landing_hero_title_en", value: landingHeroTitleEn, category: "landing" },
            { key: "landing_hero_description", value: landingHeroDescription, category: "landing" },
            { key: "landing_hero_description_en", value: landingHeroDescriptionEn, category: "landing" },
            { key: "landing_cta_title", value: landingCtaTitle, category: "landing" },
            { key: "landing_cta_title_en", value: landingCtaTitleEn, category: "landing" },
            { key: "landing_cta_description", value: landingCtaDescription, category: "landing" },
            { key: "landing_cta_description_en", value: landingCtaDescriptionEn, category: "landing" },
            { key: "landing_stats_json", value: landingStatsJson, category: "landing" },
            { key: "landing_testimonials_json", value: landingTestimonialsJson, category: "landing" },
            { key: "landing_steps_json", value: landingStepsJson, category: "landing" },
            { key: "landing_couple_features_json", value: landingCoupleFeaturesJson, category: "landing" },
            { key: "landing_vendor_features_json", value: landingVendorFeaturesJson, category: "landing" },
            { key: "company_story_json", value: companyStoryJson, category: "content" },
            { key: "privacy_policy_url", value: privacyPolicyUrl, category: "legal" },
            { key: "terms_url", value: termsUrl, category: "legal" },
          ],
        }),
      });
      if (!response.ok) throw new Error("Kunne ikke lagre");
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      showToast("Innstillinger er oppdatert");
    },
    onError: () => {
      showToast("Kunne ikke lagre innstillinger");
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <AdminHeader 
        title="Innstillinger" 
        subtitle="Generelle appinnstillinger"
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
      >
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>Funksjoner</ThemedText>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Leverandørregistrering</ThemedText>
              <ThemedText style={[styles.settingDesc, { color: theme.textSecondary }]}>
                Tillat nye leverandører å registrere seg
              </ThemedText>
            </View>
            <Switch
              value={enableVendorRegistration}
              onValueChange={setEnableVendorRegistration}
              trackColor={{ false: theme.border, true: Colors.dark.accent }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Godkjenning av showcases</ThemedText>
              <ThemedText style={[styles.settingDesc, { color: theme.textSecondary }]}>
                Krev admin-godkjenning for nye showcases
              </ThemedText>
            </View>
            <Switch
              value={requireInspirationApproval}
              onValueChange={setRequireInspirationApproval}
              trackColor={{ false: theme.border, true: Colors.dark.accent }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Meldinger</ThemedText>
              <ThemedText style={[styles.settingDesc, { color: theme.textSecondary }]}>
                Aktiver meldingssystem mellom par og leverandører
              </ThemedText>
            </View>
            <Switch
              value={enableMessaging}
              onValueChange={setEnableMessaging}
              trackColor={{ false: theme.border, true: Colors.dark.accent }}
              thumbColor="#FFF"
            />
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>Begrensninger</ThemedText>
          
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Maks filopplasting (MB)
          </ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-1"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }, getFieldStyle("maxFileUploadMb")]}
            value={maxFileUploadMb}
            onChangeText={setMaxFileUploadMb}
            onBlur={() => handleBlur("maxFileUploadMb", maxFileUploadMb)}
            placeholder="50"
            placeholderTextColor={theme.textMuted}
            keyboardType="numeric"
          />
          {touched.maxFileUploadMb && errors.maxFileUploadMb ? (
            <ThemedText style={styles.errorText}>{errors.maxFileUploadMb}</ThemedText>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>Kontakt</ThemedText>
          
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Support e-post</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-2"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }, getFieldStyle("supportEmail")]}
            value={supportEmail}
            onChangeText={setSupportEmail}
            onBlur={() => handleBlur("supportEmail", supportEmail)}
            placeholder="support@example.com"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {touched.supportEmail && errors.supportEmail ? (
            <ThemedText style={styles.errorText}>{errors.supportEmail}</ThemedText>
          ) : null}

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Nettside URL</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-2b"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }, getFieldStyle("appWebsite")]}
            value={appWebsite}
            onChangeText={setAppWebsite}
            onBlur={() => handleBlur("appWebsite", appWebsite)}
            placeholder="https://..."
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
          {touched.appWebsite && errors.appWebsite ? (
            <ThemedText style={styles.errorText}>{errors.appWebsite}</ThemedText>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>Juridisk</ThemedText>
          
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Personvernerklæring URL</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-3"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }, getFieldStyle("privacyPolicyUrl")]}
            value={privacyPolicyUrl}
            onChangeText={setPrivacyPolicyUrl}
            onBlur={() => handleBlur("privacyPolicyUrl", privacyPolicyUrl)}
            placeholder="https://..."
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
          {touched.privacyPolicyUrl && errors.privacyPolicyUrl ? (
            <ThemedText style={styles.errorText}>{errors.privacyPolicyUrl}</ThemedText>
          ) : null}

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>
            Vilkår for bruk URL
          </ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }, getFieldStyle("termsUrl")]}
            value={termsUrl}
            onChangeText={setTermsUrl}
            onBlur={() => handleBlur("termsUrl", termsUrl)}
            placeholder="https://..."
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
          {touched.termsUrl && errors.termsUrl ? (
            <ThemedText style={styles.errorText}>{errors.termsUrl}</ThemedText>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(350).duration(400)}>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
          <ThemedText style={styles.sectionTitle}>Butikklenker</ThemedText>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>App Store URL</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4b"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }, getFieldStyle("appStoreUrl")]}
            value={appStoreUrl}
            onChangeText={setAppStoreUrl}
            onBlur={() => handleBlur("appStoreUrl", appStoreUrl)}
            placeholder="https://apps.apple.com/..."
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
          {touched.appStoreUrl && errors.appStoreUrl ? (
            <ThemedText style={styles.errorText}>{errors.appStoreUrl}</ThemedText>
          ) : null}

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Google Play URL</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4c"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }, getFieldStyle("playStoreUrl")]}
            value={playStoreUrl}
            onChangeText={setPlayStoreUrl}
            onBlur={() => handleBlur("playStoreUrl", playStoreUrl)}
            placeholder="https://play.google.com/store/apps/..."
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
          {touched.playStoreUrl && errors.playStoreUrl ? (
            <ThemedText style={styles.errorText}>{errors.playStoreUrl}</ThemedText>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(375).duration(400)}>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
          <ThemedText style={styles.sectionTitle}>Lokalisering</ThemedText>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Valuta-kode (ISO)</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4d"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }, getFieldStyle("currencyCode")]}
            value={currencyCode}
            onChangeText={setCurrencyCode}
            onBlur={() => handleBlur("currencyCode", currencyCode)}
            placeholder="NOK"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="characters"
          />
          {touched.currencyCode && errors.currencyCode ? (
            <ThemedText style={styles.errorText}>{errors.currencyCode}</ThemedText>
          ) : null}

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Locale</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4e"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }, getFieldStyle("currencyLocale")]}
            value={currencyLocale}
            onChangeText={setCurrencyLocale}
            onBlur={() => handleBlur("currencyLocale", currencyLocale)}
            placeholder="nb-NO"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
          />
          {touched.currencyLocale && errors.currencyLocale ? (
            <ThemedText style={styles.errorText}>{errors.currencyLocale}</ThemedText>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(390).duration(400)}>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
          <ThemedText style={styles.sectionTitle}>Footer</ThemedText>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Footer merkevaretekst</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4f"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={footerBrandText}
            onChangeText={setFooterBrandText}
            placeholder="Evendi by ..."
            placeholderTextColor={theme.textMuted}
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Footer tagline</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4g"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={footerTagline}
            onChangeText={setFooterTagline}
            placeholder="Laget med ..."
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(405).duration(400)}>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
          <ThemedText style={styles.sectionTitle}>Support</ThemedText>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Velkomstmelding (leverandører)</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4h"
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={vendorSupportWelcomeMessage}
            onChangeText={setVendorSupportWelcomeMessage}
            placeholder="Velkomstmelding for Evendi Support..."
            placeholderTextColor={theme.textMuted}
            multiline
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(420).duration(400)}>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
          <ThemedText style={styles.sectionTitle}>Varslinger</ThemedText>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Nedtelling tittel (template)</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4i"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={notificationCountdownTitleTemplate}
            onChangeText={setNotificationCountdownTitleTemplate}
            placeholder="F.eks. {days} dager til bryllupet!"
            placeholderTextColor={theme.textMuted}
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Nedtelling tekst (template)</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4j"
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={notificationCountdownBodyTemplate}
            onChangeText={setNotificationCountdownBodyTemplate}
            placeholder="F.eks. Husk a sjekke gjoremalene dine."
            placeholderTextColor={theme.textMuted}
            multiline
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Sjekkliste tittel</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4k"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={notificationChecklistTitle}
            onChangeText={setNotificationChecklistTitle}
            placeholder="Paaminnelse om gjoremal"
            placeholderTextColor={theme.textMuted}
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Sjekkliste tekst (template)</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4l"
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={notificationChecklistBodyTemplate}
            onChangeText={setNotificationChecklistBodyTemplate}
            placeholder={'F.eks. Husk: "{task}" bør gjores snart!'}
            placeholderTextColor={theme.textMuted}
            multiline
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Toast: Sjekkliste feilet</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4m"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={notificationToastChecklistFailed}
            onChangeText={setNotificationToastChecklistFailed}
            placeholder="Noen sjekkliste-varsler kunne ikke planlegges."
            placeholderTextColor={theme.textMuted}
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Toast: Varsler oppdatert</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4n"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={notificationToastUpdated}
            onChangeText={setNotificationToastUpdated}
            placeholder="Varsler oppdatert."
            placeholderTextColor={theme.textMuted}
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Toast: Varsler tillatt</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4o"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={notificationToastPermissionGranted}
            onChangeText={setNotificationToastPermissionGranted}
            placeholder="Varsler tillatt."
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(435).duration(400)}>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
          <ThemedText style={styles.sectionTitle}>Landing page</ThemedText>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Hero merkevareord</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4p"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingHeroBrand}
            onChangeText={setLandingHeroBrand}
            placeholder="Perfekt Match"
            placeholderTextColor={theme.textMuted}
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Hero tittel (NO)</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4q"
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingHeroTitle}
            onChangeText={setLandingHeroTitle}
            placeholder="Planlegg drømmearrangementet ditt med {brand}"
            placeholderTextColor={theme.textMuted}
            multiline
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Hero tittel (EN)</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4r"
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingHeroTitleEn}
            onChangeText={setLandingHeroTitleEn}
            placeholder="Plan your dream event with {brand}"
            placeholderTextColor={theme.textMuted}
            multiline
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Hero beskrivelse (NO)</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4s"
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingHeroDescription}
            onChangeText={setLandingHeroDescription}
            placeholder="Evendi kobler par med de beste leverandørene..."
            placeholderTextColor={theme.textMuted}
            multiline
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Hero beskrivelse (EN)</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4t"
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingHeroDescriptionEn}
            onChangeText={setLandingHeroDescriptionEn}
            placeholder="Evendi connects couples with top vendors..."
            placeholderTextColor={theme.textMuted}
            multiline
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>CTA tittel (NO)</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4u"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingCtaTitle}
            onChangeText={setLandingCtaTitle}
            placeholder="Klar for å planlegge drømmearrangementet?"
            placeholderTextColor={theme.textMuted}
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>CTA tittel (EN)</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4v"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingCtaTitleEn}
            onChangeText={setLandingCtaTitleEn}
            placeholder="Ready to plan your dream event?"
            placeholderTextColor={theme.textMuted}
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>CTA beskrivelse (NO)</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4w"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingCtaDescription}
            onChangeText={setLandingCtaDescription}
            placeholder="Last ned Evendi gratis..."
            placeholderTextColor={theme.textMuted}
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>CTA beskrivelse (EN)</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4x"
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingCtaDescriptionEn}
            onChangeText={setLandingCtaDescriptionEn}
            placeholder="Download Evendi for free..."
            placeholderTextColor={theme.textMuted}
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Stats JSON</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4y"
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingStatsJson}
            onChangeText={setLandingStatsJson}
            placeholder='[{"value":"500+","label":"Leverandorer"}]'
            placeholderTextColor={theme.textMuted}
            multiline
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Testimonials JSON</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4z"
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingTestimonialsJson}
            onChangeText={setLandingTestimonialsJson}
            placeholder='[{"initials":"SL","name":"Sara","role":"Gift i 2025","quote":"..."}]'
            placeholderTextColor={theme.textMuted}
            multiline
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Steps JSON</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4aa"
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingStepsJson}
            onChangeText={setLandingStepsJson}
            placeholder='[{"icon":"1","title":"Opprett konto","desc":"..."}]'
            placeholderTextColor={theme.textMuted}
            multiline
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Couple features JSON</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4ab"
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingCoupleFeaturesJson}
            onChangeText={setLandingCoupleFeaturesJson}
            placeholder='[{"icon":"📅","title":"Planlegg","desc":"...","color":"#845EF7"}]'
            placeholderTextColor={theme.textMuted}
            multiline
          />

          <ThemedText style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.md }]}>Vendor features JSON</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4ac"
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={landingVendorFeaturesJson}
            onChangeText={setLandingVendorFeaturesJson}
            placeholder='[{"icon":"👤","title":"Opprett profil","desc":"...","color":"#FF6B6B"}]'
            placeholderTextColor={theme.textMuted}
            multiline
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(450).duration(400)}>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
          <ThemedText style={styles.sectionTitle}>Bedriftshistorie</ThemedText>

          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Company story JSON</ThemedText>
          <PersistentTextInput
            draftKey="AdminSettingsScreen-input-4ad"
            style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            value={companyStoryJson}
            onChangeText={setCompanyStoryJson}
            placeholder='{"titleNo":"...","cards":[...]}'
            placeholderTextColor={theme.textMuted}
            multiline
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(465).duration(400)}>
        <Pressable
          style={[styles.saveButton, { backgroundColor: Colors.dark.accent }]}
          onPress={() => {
            const isValid = validateAll({
              supportEmail,
              privacyPolicyUrl,
              termsUrl,
              maxFileUploadMb,
              appWebsite,
              appStoreUrl,
              playStoreUrl,
              currencyCode,
              currencyLocale,
            });
            if (!isValid) {
              showToast("Rett opp feltene som er markert i rodt.");
              return;
            }
            saveMutation.mutate();
          }}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <EvendiIcon name="save" size={18} color="#000" />
              <ThemedText style={styles.saveButtonText}>Lagre endringer</ThemedText>
            </>
          )}
        </Pressable>
      </Animated.View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  settingDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  label: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  saveButton: {
    flexDirection: "row",
    height: 52,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  saveButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: "#DC3545",
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
});
