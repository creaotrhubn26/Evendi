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

interface DressDetails {
  // Butikk
  appointmentRequired: boolean;
  appointmentDurationMinutes: number | null;
  maxGuestsPerAppointment: number | null;
  walkInsAccepted: boolean;
  privateFittingAvailable: boolean;
  weekendAppointmentsAvailable: boolean;
  eveningAppointmentsAvailable: boolean;

  // Utvalg
  designerBrands: string[];
  sizeRangeMin: number | null;
  sizeRangeMax: number | null;
  plusSizeAvailable: boolean;
  petiteSizeAvailable: boolean;
  customDesignAvailable: boolean;

  // Prisklasse
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  sampleSaleAvailable: boolean;

  // Endringer / tilpasning
  inHouseAlterations: boolean;
  alterationsIncludedInPrice: boolean;
  alterationsCost: number | null;
  numberOfFittings: number | null;
  rushAlterationsAvailable: boolean;

  // Tilbehør
  veilsAvailable: boolean;
  shoesAvailable: boolean;
  jewelryAvailable: boolean;
  headpiecesAvailable: boolean;
  lingerieAvailable: boolean;
  accessoriesIncludedInPackage: boolean;

  // Styling
  personalStylistIncluded: boolean;
  dressPreservationOffered: boolean;
  steamingOnPickup: boolean;

  // Bestilling & levering
  orderLeadWeeks: number | null;
  rushOrderAvailable: boolean;
  rushOrderSurcharge: number | null;
  shippingAvailable: boolean;
  internationalShipping: boolean;

  // Spesielt
  bridesmaidDressesAvailable: boolean;
  motherOfBrideDresses: boolean;
  flowerGirlDresses: boolean;
  groomAttireAvailable: boolean;
}

const defaultDetails: DressDetails = {
  appointmentRequired: true,
  appointmentDurationMinutes: null,
  maxGuestsPerAppointment: null,
  walkInsAccepted: false,
  privateFittingAvailable: true,
  weekendAppointmentsAvailable: true,
  eveningAppointmentsAvailable: false,

  designerBrands: [],
  sizeRangeMin: null,
  sizeRangeMax: null,
  plusSizeAvailable: true,
  petiteSizeAvailable: true,
  customDesignAvailable: false,

  priceRangeMin: null,
  priceRangeMax: null,
  sampleSaleAvailable: false,

  inHouseAlterations: true,
  alterationsIncludedInPrice: false,
  alterationsCost: null,
  numberOfFittings: null,
  rushAlterationsAvailable: false,

  veilsAvailable: true,
  shoesAvailable: false,
  jewelryAvailable: false,
  headpiecesAvailable: true,
  lingerieAvailable: false,
  accessoriesIncludedInPackage: false,

  personalStylistIncluded: true,
  dressPreservationOffered: false,
  steamingOnPickup: true,

  orderLeadWeeks: null,
  rushOrderAvailable: false,
  rushOrderSurcharge: null,
  shippingAvailable: false,
  internationalShipping: false,

  bridesmaidDressesAvailable: false,
  motherOfBrideDresses: false,
  flowerGirlDresses: false,
  groomAttireAvailable: false,
};

const DESIGNER_BRANDS = [
  "Pronovias",
  "Vera Wang",
  "Maggie Sottero",
  "Justin Alexander",
  "Sottero & Midgley",
  "Rosa Clará",
  "Allure Bridals",
  "Mori Lee",
  "Essence of Australia",
  "Lillian West",
];

export default function DressDetailsScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<any>;
}) {
  const { theme } = useTheme();
  const { isWedding } = useEventType();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [details, setDetails] = useState<DressDetails>(defaultDetails);

  useEffect(() => {
    AsyncStorage.getItem(VENDOR_STORAGE_KEY).then((data) => {
      if (data) setSessionToken(JSON.parse(data).sessionToken);
    });
  }, []);

  const { data: savedData, isLoading } = useQuery({
    queryKey: ["/api/vendor/dress-details"],
    queryFn: async () => {
      if (!sessionToken) return null;
      const response = await fetch(
        new URL("/api/vendor/category-details", getApiUrl()).toString() +
          "?category=dress",
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
          body: JSON.stringify({ category: "dress", details }),
        }
      );
      if (!response.ok) throw new Error((await response.json()).message || "Kunne ikke lagre");
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/dress-details"] });
      showToast("Brudekjoledetaljene er oppdatert");
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(error.message);
    },
  });

  const updateDetail = <K extends keyof DressDetails>(key: K, value: DressDetails[K]) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const toggleBrand = (brand: string) => {
    setDetails((prev) => ({
      ...prev,
      designerBrands: prev.designerBrands.includes(brand)
        ? prev.designerBrands.filter((b) => b !== brand)
        : [...prev.designerBrands, brand],
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
          draftKey={`DressDetailsScreen-${label}`}
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
              <EvendiIcon name="heart" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
                Brudekjoledetaljer
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
            <EvendiIcon name="heart" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
              Brudekjoledetaljer
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
        {/* Butikk / Bestilling */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("calendar", "Bestilling & Timebestilling")}
          {renderSwitch("Timebestilling påkrevd", details.appointmentRequired, (v) => updateDetail("appointmentRequired", v))}
          {renderInput("Varighet per time", details.appointmentDurationMinutes?.toString() || "", (v) => updateDetail("appointmentDurationMinutes", v ? parseInt(v) : null), { placeholder: "90", keyboardType: "number-pad", suffix: "min" })}
          {renderInput("Maks gjester per time", details.maxGuestsPerAppointment?.toString() || "", (v) => updateDetail("maxGuestsPerAppointment", v ? parseInt(v) : null), { placeholder: "4", keyboardType: "number-pad" })}
          {renderSwitch("Drop-in velkommen", details.walkInsAccepted, (v) => updateDetail("walkInsAccepted", v))}
          {renderSwitch("Privat prøving tilgjengelig", details.privateFittingAvailable, (v) => updateDetail("privateFittingAvailable", v), "Eksklusiv butikktid")}
          {renderSwitch("Helgetimer tilgjengelig", details.weekendAppointmentsAvailable, (v) => updateDetail("weekendAppointmentsAvailable", v))}
          {renderSwitch("Kveldstimer tilgjengelig", details.eveningAppointmentsAvailable, (v) => updateDetail("eveningAppointmentsAvailable", v))}
        </View>

        {/* Utvalg */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("shopping-bag", "Utvalg")}
          <ThemedText style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: Spacing.sm }]}>
            Designermerker
          </ThemedText>
          <View style={styles.styleGrid}>
            {DESIGNER_BRANDS.map((brand) => (
              <Pressable
                key={brand}
                onPress={() => toggleBrand(brand)}
                style={[
                  styles.styleChip,
                  { borderColor: details.designerBrands.includes(brand) ? theme.accent : theme.border },
                  details.designerBrands.includes(brand) && { backgroundColor: theme.accent + "15" },
                ]}
              >
                <ThemedText
                  style={[
                    styles.styleChipText,
                    { color: details.designerBrands.includes(brand) ? theme.accent : theme.textSecondary },
                  ]}
                >
                  {brand}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.rowInputs}>
            {renderInput("Størrelse fra", details.sizeRangeMin?.toString() || "", (v) => updateDetail("sizeRangeMin", v ? parseInt(v) : null), { placeholder: "34", keyboardType: "number-pad" })}
            {renderInput("Størrelse til", details.sizeRangeMax?.toString() || "", (v) => updateDetail("sizeRangeMax", v ? parseInt(v) : null), { placeholder: "56", keyboardType: "number-pad" })}
          </View>
          {renderSwitch("Store størrelser", details.plusSizeAvailable, (v) => updateDetail("plusSizeAvailable", v))}
          {renderSwitch("Petite-størrelser", details.petiteSizeAvailable, (v) => updateDetail("petiteSizeAvailable", v))}
          {renderSwitch("Skreddersydd design", details.customDesignAvailable, (v) => updateDetail("customDesignAvailable", v), "Unik kjole på bestilling")}
        </View>

        {/* Prisklasse */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("credit-card", "Prisklasse")}
          <View style={styles.rowInputs}>
            {renderInput("Fra pris", details.priceRangeMin?.toString() || "", (v) => updateDetail("priceRangeMin", v ? parseInt(v) : null), { placeholder: "10000", keyboardType: "number-pad", suffix: "kr" })}
            {renderInput("Til pris", details.priceRangeMax?.toString() || "", (v) => updateDetail("priceRangeMax", v ? parseInt(v) : null), { placeholder: "60000", keyboardType: "number-pad", suffix: "kr" })}
          </View>
          {renderSwitch("Sample sale / brukt-salg", details.sampleSaleAvailable, (v) => updateDetail("sampleSaleAvailable", v), "Prøvekjoler til redusert pris")}
        </View>

        {/* Endringer */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("scissors", "Endringer & Tilpasning")}
          {renderSwitch("Egne skreddere i butikk", details.inHouseAlterations, (v) => updateDetail("inHouseAlterations", v))}
          {details.inHouseAlterations && (
            <>
              {renderSwitch("Endringer inkludert i pris", details.alterationsIncludedInPrice, (v) => updateDetail("alterationsIncludedInPrice", v))}
              {!details.alterationsIncludedInPrice && renderInput("Endringskostnad fra", details.alterationsCost?.toString() || "", (v) => updateDetail("alterationsCost", v ? parseInt(v) : null), { placeholder: "3000", keyboardType: "number-pad", suffix: "kr" })}
              {renderInput("Antall prøver", details.numberOfFittings?.toString() || "", (v) => updateDetail("numberOfFittings", v ? parseInt(v) : null), { placeholder: "3", keyboardType: "number-pad" })}
              {renderSwitch("Hasteendringer mulig", details.rushAlterationsAvailable, (v) => updateDetail("rushAlterationsAvailable", v))}
            </>
          )}
        </View>

        {/* Tilbehør */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("gift", "Tilbehør")}
          {renderSwitch("Slør tilgjengelig", details.veilsAvailable, (v) => updateDetail("veilsAvailable", v))}
          {renderSwitch("Brudesko", details.shoesAvailable, (v) => updateDetail("shoesAvailable", v))}
          {renderSwitch("Smykker", details.jewelryAvailable, (v) => updateDetail("jewelryAvailable", v))}
          {renderSwitch("Hodepynt / tiara", details.headpiecesAvailable, (v) => updateDetail("headpiecesAvailable", v))}
          {renderSwitch("Undertøy / shapewear", details.lingerieAvailable, (v) => updateDetail("lingerieAvailable", v))}
          {renderSwitch("Tilbehør inkludert i pakke", details.accessoriesIncludedInPackage, (v) => updateDetail("accessoriesIncludedInPackage", v))}
        </View>

        {/* Styling */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("star", "Styling & Service")}
          {renderSwitch("Personlig stylist inkludert", details.personalStylistIncluded, (v) => updateDetail("personalStylistIncluded", v))}
          {renderSwitch("Kjoleoppbevaring tilbys", details.dressPreservationOffered, (v) => updateDetail("dressPreservationOffered", v), "Profesjonell rens og oppbevaring")}
          {renderSwitch("Damping ved henting", details.steamingOnPickup, (v) => updateDetail("steamingOnPickup", v))}
        </View>

        {/* Bestilling & Levering */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("truck", "Bestilling & Levering")}
          {renderInput("Leveringstid bestilling", details.orderLeadWeeks?.toString() || "", (v) => updateDetail("orderLeadWeeks", v ? parseInt(v) : null), { placeholder: "16", keyboardType: "number-pad", suffix: "uker" })}
          {renderSwitch("Hastebestilling mulig", details.rushOrderAvailable, (v) => updateDetail("rushOrderAvailable", v))}
          {details.rushOrderAvailable && renderInput("Hastegebyr", details.rushOrderSurcharge?.toString() || "", (v) => updateDetail("rushOrderSurcharge", v ? parseInt(v) : null), { placeholder: "3000", keyboardType: "number-pad", suffix: "kr" })}
          {renderSwitch("Leveranse/frakt tilgjengelig", details.shippingAvailable, (v) => updateDetail("shippingAvailable", v))}
          {details.shippingAvailable && renderSwitch("Internasjonal frakt", details.internationalShipping, (v) => updateDetail("internationalShipping", v))}
        </View>

        {/* Andre antrekk */}
        <View style={[styles.formCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {renderSectionHeader("users", "Andre antrekk")}
          {renderSwitch("Brudepikekjoler", details.bridesmaidDressesAvailable, (v) => updateDetail("bridesmaidDressesAvailable", v))}
          {renderSwitch("Brudens mor-antrekk", details.motherOfBrideDresses, (v) => updateDetail("motherOfBrideDresses", v))}
          {renderSwitch("Blomepikeantrekk", details.flowerGirlDresses, (v) => updateDetail("flowerGirlDresses", v))}
          {renderSwitch("Brudgommens antrekk", details.groomAttireAvailable, (v) => updateDetail("groomAttireAvailable", v))}
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
              <ThemedText style={styles.saveBtnText}>Lagre brudekjoledetaljer</ThemedText>
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
