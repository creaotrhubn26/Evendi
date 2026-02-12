import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, ActivityIndicator, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EvendiIcon } from "@/components/EvendiIcon";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useEventType } from "@/hooks/useEventType";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { showToast } from "@/lib/toast";
import PersistentTextInput from "@/components/PersistentTextInput";

const VENDOR_STORAGE_KEY = "evendi_vendor_session";

interface PhotoVideoDetails {
  // Foto leveranse
  deliveryDays: number | null;
  minPhotosDelivered: number | null;
  maxPhotosDelivered: number | null;
  includesHighRes: boolean;
  includesRaw: boolean;
  includesWebGallery: boolean;
  galleryDuration: string | null;

  // Video leveranse
  highlightFilmIncluded: boolean;
  highlightFilmMinutes: number | null;
  fullCeremonyVideo: boolean;
  fullReceptionVideo: boolean;
  speechesVideo: boolean;
  rawVideoFootage: boolean;
  videoDeliveryDays: number | null;

  // Album & print
  includesAlbum: boolean;
  albumPages: number | null;
  albumSize: string | null;

  // Team & utstyr
  hasSecondShooter: boolean;
  secondShooterIncluded: boolean;
  secondShooterPrice: number | null;
  hasAssistant: boolean;
  hasDrone: boolean;
  droneIncluded: boolean;
  dronePrice: number | null;
  hasSteadicam: boolean;
  hasGimbal: boolean;

  // Dekning
  coverageHoursMin: number | null;
  coverageHoursMax: number | null;
  engagementShootIncluded: boolean;
  gettingReadyIncluded: boolean;

  // Reise
  travelIncluded: boolean;
  travelRadius: number | null;
  travelFeePerKm: number | null;
  internationalAvailable: boolean;

  // Foto-stil
  photographyStyles: string[];
  editingStyle: string | null;

  // Video-stil
  videoStyles: string[];
  colorGrading: string | null;

  // Ekstra
  sneakPeekAvailable: boolean;
  sneakPeekDays: number | null;
  sameDayEditAvailable: boolean;
  photoBoothAvailable: boolean;
  backupEquipment: boolean;
  socialMediaClips: boolean;
  socialMediaClipCount: number | null;
}

const defaultDetails: PhotoVideoDetails = {
  deliveryDays: null,
  minPhotosDelivered: null,
  maxPhotosDelivered: null,
  includesHighRes: true,
  includesRaw: false,
  includesWebGallery: true,
  galleryDuration: null,

  highlightFilmIncluded: true,
  highlightFilmMinutes: null,
  fullCeremonyVideo: true,
  fullReceptionVideo: false,
  speechesVideo: true,
  rawVideoFootage: false,
  videoDeliveryDays: null,

  includesAlbum: false,
  albumPages: null,
  albumSize: null,

  hasSecondShooter: false,
  secondShooterIncluded: false,
  secondShooterPrice: null,
  hasAssistant: false,
  hasDrone: false,
  droneIncluded: false,
  dronePrice: null,
  hasSteadicam: false,
  hasGimbal: false,

  coverageHoursMin: null,
  coverageHoursMax: null,
  engagementShootIncluded: false,
  gettingReadyIncluded: true,

  travelIncluded: false,
  travelRadius: null,
  travelFeePerKm: null,
  internationalAvailable: false,

  photographyStyles: [],
  editingStyle: null,

  videoStyles: [],
  colorGrading: null,

  sneakPeekAvailable: false,
  sneakPeekDays: null,
  sameDayEditAvailable: false,
  photoBoothAvailable: false,
  backupEquipment: true,
  socialMediaClips: false,
  socialMediaClipCount: null,
};

const PHOTOGRAPHY_STYLES = [
  "Dokumentarisk",
  "Klassisk/Tradisjonell",
  "Kunstnerisk",
  "Journalistisk",
  "Romantisk",
  "Naturlig lys",
  "Mørk & Moody",
  "Lys & Luftig",
  "Editorial/Fashion",
  "Vintage/Film",
];

const VIDEO_STYLES = [
  "Cinematic",
  "Dokumentarisk",
  "Narrativ",
  "Romantisk",
  "Eventyrlig",
  "Musikkvideoaktig",
  "Klassisk",
  "Drone-fokusert",
];

export default function PhotoVideoDetailsScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<any>;
}) {
  const { theme } = useTheme();
  const { isWedding } = useEventType();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [details, setDetails] = useState<PhotoVideoDetails>(defaultDetails);

  useEffect(() => {
    AsyncStorage.getItem(VENDOR_STORAGE_KEY).then((data) => {
      if (data) setSessionToken(JSON.parse(data).sessionToken);
    });
  }, []);

  const { data: savedData, isLoading } = useQuery({
    queryKey: ["/api/vendor/photo-video-details"],
    queryFn: async () => {
      if (!sessionToken) return null;
      const response = await fetch(
        new URL("/api/vendor/category-details", getApiUrl()).toString() +
          "?category=photo-video",
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      return response.ok ? response.json() : null;
    },
    enabled: !!sessionToken,
  });

  useEffect(() => {
    if (savedData?.details) setDetails({ ...defaultDetails, ...savedData.details });
  }, [savedData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!sessionToken) throw new Error("Ikke innlogget");
      const response = await fetch(
        new URL("/api/vendor/category-details", getApiUrl()).toString(),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ category: "photo-video", details }),
        }
      );
      if (!response.ok) throw new Error((await response.json()).message || "Kunne ikke lagre");
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/photo-video-details"] });
      showToast("Foto & video-detaljene er oppdatert");
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(error.message);
    },
  });

  const updateDetail = <K extends keyof PhotoVideoDetails>(
    key: K,
    value: PhotoVideoDetails[K]
  ) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const togglePhotoStyle = (style: string) => {
    setDetails((prev) => ({
      ...prev,
      photographyStyles: prev.photographyStyles.includes(style)
        ? prev.photographyStyles.filter((s) => s !== style)
        : [...prev.photographyStyles, style],
    }));
  };

  const toggleVideoStyle = (style: string) => {
    setDetails((prev) => ({
      ...prev,
      videoStyles: prev.videoStyles.includes(style)
        ? prev.videoStyles.filter((s) => s !== style)
        : [...prev.videoStyles, style],
    }));
  };

  const renderSectionHeader = (icon: string, title: string) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconCircle, { backgroundColor: theme.accent + "15" }]}>
        <EvendiIcon name={icon as any} size={16} color={theme.accent} />
      </View>
      <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>{title}</ThemedText>
    </View>
  );

  const renderSwitch = (
    label: string,
    value: boolean,
    onChange: (v: boolean) => void,
    description?: string
  ) => (
    <View style={styles.switchContainer}>
      <View style={styles.switchRow}>
        <View style={styles.switchTextContainer}>
          <ThemedText style={[styles.switchLabel, { color: theme.text }]}>{label}</ThemedText>
          {description && (
            <ThemedText style={[styles.switchDescription, { color: theme.textSecondary }]}>
              {description}
            </ThemedText>
          )}
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: theme.border, true: theme.accent + "60" }}
          thumbColor={value ? theme.accent : theme.backgroundSecondary}
        />
      </View>
    </View>
  );

  const renderInput = (
    label: string,
    value: string | null,
    onChange: (v: string) => void,
    options?: {
      placeholder?: string;
      keyboardType?: "default" | "number-pad";
      suffix?: string;
    }
  ) => (
    <View style={styles.inputGroup}>
      <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
      <View style={styles.inputWrapper}>
        <PersistentTextInput
          draftKey={`PhotoVideoDetailsScreen-${label}`}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundRoot,
              color: theme.text,
              borderColor: theme.border,
            },
            options?.suffix && { paddingRight: 50 },
          ]}
          value={value || ""}
          onChangeText={onChange}
          placeholder={options?.placeholder}
          placeholderTextColor={theme.textMuted}
          keyboardType={options?.keyboardType || "default"}
        />
        {options?.suffix && (
          <ThemedText style={[styles.inputSuffix, { color: theme.textSecondary }]}>
            {options.suffix}
          </ThemedText>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + Spacing.md,
              backgroundColor: theme.backgroundDefault,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={[styles.headerIconCircle, { backgroundColor: theme.accent }]}>
              <EvendiIcon name="camera" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
                Foto & Video-detaljer
              </ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Laster...
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundRoot },
            ]}
          >
            <EvendiIcon name="x" size={20} color={theme.textSecondary} />
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
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.md,
            backgroundColor: theme.backgroundDefault,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={[styles.headerIconCircle, { backgroundColor: theme.accent }]}>
            <EvendiIcon name="camera" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
              Foto & Video-detaljer
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Spesifiser dine tjenester
            </ThemedText>
          </View>
        </View>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.closeButton,
            { backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundRoot },
          ]}
        >
          <EvendiIcon name="x" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        {/* Foto-leveranse */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("image", "Foto-leveranse")}
          {renderInput("Leveringstid foto", details.deliveryDays?.toString() || "", (v) => updateDetail("deliveryDays", v ? parseInt(v) : null), { placeholder: "30", keyboardType: "number-pad", suffix: "dager" })}
          <View style={styles.rowInputs}>
            {renderInput("Min bilder", details.minPhotosDelivered?.toString() || "", (v) => updateDetail("minPhotosDelivered", v ? parseInt(v) : null), { placeholder: "300", keyboardType: "number-pad" })}
            {renderInput("Maks bilder", details.maxPhotosDelivered?.toString() || "", (v) => updateDetail("maxPhotosDelivered", v ? parseInt(v) : null), { placeholder: "600", keyboardType: "number-pad" })}
          </View>
          {renderSwitch("Høyoppløselige filer", details.includesHighRes, (v) => updateDetail("includesHighRes", v))}
          {renderSwitch("RAW-filer inkludert", details.includesRaw, (v) => updateDetail("includesRaw", v), "Uredigerte originaler")}
          {renderSwitch("Online bildegalleri", details.includesWebGallery, (v) => updateDetail("includesWebGallery", v))}
          {details.includesWebGallery && renderInput("Galleri tilgjengelig i", details.galleryDuration || "", (v) => updateDetail("galleryDuration", v || null), { placeholder: "F.eks. 1 år" })}
        </View>

        {/* Video-leveranse */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("video", "Video-leveranse")}
          {renderSwitch("Highlightfilm inkludert", details.highlightFilmIncluded, (v) => updateDetail("highlightFilmIncluded", v), "Kort, redigert sammendrag")}
          {details.highlightFilmIncluded && renderInput("Lengde highlightfilm", details.highlightFilmMinutes?.toString() || "", (v) => updateDetail("highlightFilmMinutes", v ? parseInt(v) : null), { placeholder: "5", keyboardType: "number-pad", suffix: "min" })}
          {renderSwitch("Full seremoni-video", details.fullCeremonyVideo, (v) => updateDetail("fullCeremonyVideo", v))}
          {renderSwitch("Full festmiddag-video", details.fullReceptionVideo, (v) => updateDetail("fullReceptionVideo", v))}
          {renderSwitch("Taler filmet", details.speechesVideo, (v) => updateDetail("speechesVideo", v), "Separate klipp av taler")}
          {renderSwitch("Rått videomateriale", details.rawVideoFootage, (v) => updateDetail("rawVideoFootage", v), "Uredigert råfilm")}
          {renderInput("Leveringstid video", details.videoDeliveryDays?.toString() || "", (v) => updateDetail("videoDeliveryDays", v ? parseInt(v) : null), { placeholder: "60", keyboardType: "number-pad", suffix: "dager" })}
          {renderSwitch("Sosiale medier-klipp", details.socialMediaClips, (v) => updateDetail("socialMediaClips", v), "Korte vertikale klipp for Instagram/TikTok")}
          {details.socialMediaClips && renderInput("Antall klipp", details.socialMediaClipCount?.toString() || "", (v) => updateDetail("socialMediaClipCount", v ? parseInt(v) : null), { placeholder: "3", keyboardType: "number-pad" })}
        </View>

        {/* Album & Print */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("book-open", "Album & Print")}
          {renderSwitch("Album inkludert", details.includesAlbum, (v) => updateDetail("includesAlbum", v))}
          {details.includesAlbum && (
            <View style={styles.rowInputs}>
              {renderInput("Antall sider", details.albumPages?.toString() || "", (v) => updateDetail("albumPages", v ? parseInt(v) : null), { placeholder: "40", keyboardType: "number-pad" })}
              {renderInput("Størrelse", details.albumSize || "", (v) => updateDetail("albumSize", v || null), { placeholder: "30x30 cm" })}
            </View>
          )}
        </View>

        {/* Team & Utstyr */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("users", "Team & Utstyr")}
          {renderSwitch("Second shooter tilgjengelig", details.hasSecondShooter, (v) => updateDetail("hasSecondShooter", v))}
          {details.hasSecondShooter && (
            <>
              {renderSwitch("Second shooter inkludert i pris", details.secondShooterIncluded, (v) => updateDetail("secondShooterIncluded", v))}
              {!details.secondShooterIncluded && renderInput("Tilleggspris", details.secondShooterPrice?.toString() || "", (v) => updateDetail("secondShooterPrice", v ? parseInt(v) : null), { placeholder: "5000", keyboardType: "number-pad", suffix: "kr" })}
            </>
          )}
          {renderSwitch("Assistent med", details.hasAssistant, (v) => updateDetail("hasAssistant", v), "Hjelper med lys, utstyr etc.")}
          {renderSwitch("Dronebilder/-video", details.hasDrone, (v) => updateDetail("hasDrone", v))}
          {details.hasDrone && (
            <>
              {renderSwitch("Drone inkludert i pris", details.droneIncluded, (v) => updateDetail("droneIncluded", v))}
              {!details.droneIncluded && renderInput("Tilleggspris drone", details.dronePrice?.toString() || "", (v) => updateDetail("dronePrice", v ? parseInt(v) : null), { placeholder: "3000", keyboardType: "number-pad", suffix: "kr" })}
            </>
          )}
          {renderSwitch("Steadicam", details.hasSteadicam, (v) => updateDetail("hasSteadicam", v), "Jevne kamerabevegelser")}
          {renderSwitch("Gimbal", details.hasGimbal, (v) => updateDetail("hasGimbal", v), "Stabilisert håndholdt")}
          {renderSwitch("Backup-utstyr", details.backupEquipment, (v) => updateDetail("backupEquipment", v), "Ekstra kamera/objektiv")}
        </View>

        {/* Dekning */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("clock", "Dekning")}
          <View style={styles.rowInputs}>
            {renderInput("Min timer", details.coverageHoursMin?.toString() || "", (v) => updateDetail("coverageHoursMin", v ? parseInt(v) : null), { placeholder: "6", keyboardType: "number-pad" })}
            {renderInput("Maks timer", details.coverageHoursMax?.toString() || "", (v) => updateDetail("coverageHoursMax", v ? parseInt(v) : null), { placeholder: "14", keyboardType: "number-pad" })}
          </View>
          {renderSwitch("Forlovelsesshoot inkludert", details.engagementShootIncluded, (v) => updateDetail("engagementShootIncluded", v))}
          {renderSwitch("Getting ready-dekning", details.gettingReadyIncluded, (v) => updateDetail("gettingReadyIncluded", v), "Bilder og film fra forberedelsene")}
        </View>

        {/* Reise */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("map-pin", "Reise")}
          {renderSwitch("Reise inkludert", details.travelIncluded, (v) => updateDetail("travelIncluded", v), "Ingen reiseutgifter")}
          {!details.travelIncluded && (
            <>
              {renderInput("Gratis innenfor", details.travelRadius?.toString() || "", (v) => updateDetail("travelRadius", v ? parseInt(v) : null), { placeholder: "50", keyboardType: "number-pad", suffix: "km" })}
              {renderInput("Km-pris utover", details.travelFeePerKm?.toString() || "", (v) => updateDetail("travelFeePerKm", v ? parseInt(v) : null), { placeholder: "5", keyboardType: "number-pad", suffix: "kr/km" })}
            </>
          )}
          {renderSwitch("Internasjonalt tilgjengelig", details.internationalAvailable, (v) => updateDetail("internationalAvailable", v), isWedding ? "Destination weddings" : "Internasjonale oppdrag")}
        </View>

        {/* Foto-stil */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("image", "Fotografistil")}
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: Spacing.sm }]}>
            Velg stilene du jobber i
          </ThemedText>
          <View style={styles.styleGrid}>
            {PHOTOGRAPHY_STYLES.map((style) => (
              <Pressable
                key={style}
                onPress={() => togglePhotoStyle(style)}
                style={[
                  styles.styleChip,
                  { borderColor: details.photographyStyles.includes(style) ? theme.accent : theme.border },
                  details.photographyStyles.includes(style) && { backgroundColor: theme.accent + "15" },
                ]}
              >
                <ThemedText
                  style={[
                    styles.styleChipText,
                    { color: details.photographyStyles.includes(style) ? theme.accent : theme.textSecondary },
                  ]}
                >
                  {style}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          {renderInput("Redigeringsstil foto", details.editingStyle || "", (v) => updateDetail("editingStyle", v || null), { placeholder: "Beskriv din redigeringsstil..." })}
        </View>

        {/* Video-stil */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("film", "Videostil")}
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: Spacing.sm }]}>
            Velg videostilene du jobber i
          </ThemedText>
          <View style={styles.styleGrid}>
            {VIDEO_STYLES.map((style) => (
              <Pressable
                key={style}
                onPress={() => toggleVideoStyle(style)}
                style={[
                  styles.styleChip,
                  { borderColor: details.videoStyles.includes(style) ? theme.accent : theme.border },
                  details.videoStyles.includes(style) && { backgroundColor: theme.accent + "15" },
                ]}
              >
                <ThemedText
                  style={[
                    styles.styleChipText,
                    { color: details.videoStyles.includes(style) ? theme.accent : theme.textSecondary },
                  ]}
                >
                  {style}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          {renderInput("Color grading-stil", details.colorGrading || "", (v) => updateDetail("colorGrading", v || null), { placeholder: "F.eks. varm og filmatisk..." })}
        </View>

        {/* Ekstra */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("zap", "Ekstra tjenester")}
          {renderSwitch("Sneak peek tilgjengelig", details.sneakPeekAvailable, (v) => updateDetail("sneakPeekAvailable", v), "Noen bilder før full leveranse")}
          {details.sneakPeekAvailable && renderInput("Levert innen", details.sneakPeekDays?.toString() || "", (v) => updateDetail("sneakPeekDays", v ? parseInt(v) : null), { placeholder: "2", keyboardType: "number-pad", suffix: "dager" })}
          {renderSwitch("Same-day edit", details.sameDayEditAvailable, (v) => updateDetail("sameDayEditAvailable", v), "Slideshow på festen")}
          {renderSwitch("Photobooth tilgjengelig", details.photoBoothAvailable, (v) => updateDetail("photoBoothAvailable", v))}
        </View>

        {/* Save */}
        <Pressable
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: theme.accent },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <View style={styles.saveBtnIcon}>
                <EvendiIcon name="save" size={16} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.saveBtnText}>Lagre foto & video-detaljer</ThemedText>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  headerIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, marginTop: 1 },
  closeButton: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: Spacing.lg },
  formCard: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.md },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.lg },
  sectionIconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  inputGroup: { marginBottom: Spacing.md, flex: 1 },
  inputLabel: { fontSize: 13, fontWeight: "500", marginBottom: Spacing.xs },
  inputWrapper: { position: "relative" },
  input: { height: 48, borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.md, fontSize: 15 },
  inputSuffix: { position: "absolute", right: Spacing.md, top: 14, fontSize: 14 },
  rowInputs: { flexDirection: "row", gap: Spacing.md },
  switchContainer: { marginBottom: Spacing.sm },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: Spacing.sm },
  switchTextContainer: { flex: 1, marginRight: Spacing.md },
  switchLabel: { fontSize: 15, fontWeight: "500" },
  switchDescription: { fontSize: 12, marginTop: 2 },
  styleGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.md },
  styleChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1 },
  styleChipText: { fontSize: 13, fontWeight: "500" },
  saveBtn: {
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
  saveBtnIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontSize: 17, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.2 },
});
