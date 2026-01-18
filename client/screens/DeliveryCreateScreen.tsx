import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  ScrollView,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

const VENDOR_STORAGE_KEY = "wedflow_vendor_session";

interface DeliveryItemInput {
  type: "gallery" | "video" | "website" | "download" | "contract" | "document" | "other";
  label: string;
  url: string;
  description: string;
}

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { delivery?: any } }, "params">;
}

const ITEM_TYPES = [
  { value: "gallery" as const, label: "Bildegalleri", icon: "image" },
  { value: "video" as const, label: "Video", icon: "video" },
  { value: "website" as const, label: "Nettside", icon: "globe" },
  { value: "download" as const, label: "Nedlasting", icon: "download" },
  { value: "contract" as const, label: "Kontrakt", icon: "file-text" },
  { value: "document" as const, label: "Dokument", icon: "file" },
  { value: "other" as const, label: "Annet", icon: "link" },
];

export default function DeliveryCreateScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  
  const editingDelivery = route.params?.delivery;
  const isEditMode = !!editingDelivery;

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [coupleName, setCoupleName] = useState("");
  const [coupleEmail, setCoupleEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [items, setItems] = useState<DeliveryItemInput[]>([
    { type: "gallery", label: "", url: "", description: "" },
  ]);
  const [showGoogleDriveHelp, setShowGoogleDriveHelp] = useState(false);

  // Convert Google Drive share links to direct image URLs
  const convertGoogleDriveUrl = (url: string): string => {
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    const fileId = fileMatch?.[1] || openMatch?.[1];
    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    return url;
  };

  useEffect(() => {
    loadSession();
  }, []);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingDelivery) {
      setCoupleName(editingDelivery.coupleName || "");
      setCoupleEmail(editingDelivery.coupleEmail || "");
      setTitle(editingDelivery.title || "");
      setDescription(editingDelivery.description || "");
      setWeddingDate(editingDelivery.weddingDate || "");
      if (editingDelivery.items && editingDelivery.items.length > 0) {
        setItems(editingDelivery.items.map((item: any) => ({
          type: item.type || "gallery",
          label: item.label || "",
          url: item.url || "",
          description: item.description || "",
        })));
      }
    }
  }, [editingDelivery]);

  const loadSession = async () => {
    const session = await AsyncStorage.getItem(VENDOR_STORAGE_KEY);
    if (session) {
      setSessionToken(JSON.parse(session).sessionToken);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!sessionToken) {
        throw new Error("Vennligst logg inn på nytt");
      }
      
      const url = isEditMode 
        ? new URL(`/api/vendor/deliveries/${editingDelivery.id}`, getApiUrl()).toString()
        : new URL("/api/vendor/deliveries", getApiUrl()).toString();
        
      const response = await fetch(url, {
        method: isEditMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          coupleName,
          coupleEmail: coupleEmail || undefined,
          title,
          description: description || undefined,
          weddingDate: weddingDate || undefined,
          items: items.filter((i) => i.label && i.url),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || (isEditMode ? "Kunne ikke oppdatere leveranse" : "Kunne ikke opprette leveranse"));
      }
      return response.json();
    },
    onSuccess: async (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (!isEditMode) {
        await Clipboard.setStringAsync(data.delivery.accessCode);
        Alert.alert(
          "Leveranse opprettet!",
          `Tilgangskode: ${data.delivery.accessCode}\n\nKoden er kopiert til utklippstavlen. Del denne med brudeparet.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert("Oppdatert!", "Leveransen er oppdatert.", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/deliveries"] });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Feil", error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!sessionToken) throw new Error("Ikke innlogget");

      const response = await fetch(
        new URL(`/api/vendor/deliveries/${editingDelivery.id}`, getApiUrl()).toString(),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kunne ikke slette leveranse");
      }

      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/deliveries"] });
      navigation.goBack();
    },
    onError: (error: Error) => {
      Alert.alert("Feil", error.message);
    },
  });

  const handleDelete = () => {
    Alert.alert(
      "Slett leveranse",
      `Er du sikker på at du vil slette "${title}"?`,
      [
        { text: "Avbryt", style: "cancel" },
        { text: "Slett", style: "destructive", onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  const addItem = () => {
    setItems([...items, { type: "gallery", label: "", url: "", description: "" }]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const updateItem = (index: number, field: keyof DeliveryItemInput, value: string) => {
    const newItems = [...items];
    // Auto-convert Google Drive URLs when updating URL field for gallery type
    if (field === "url" && newItems[index].type === "gallery") {
      value = convertGoogleDriveUrl(value);
    }
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = () => {
    if (!sessionToken) {
      Alert.alert("Feil", "Vennligst logg inn på nytt.");
      return;
    }

    if (!coupleName || !title) {
      Alert.alert("Mangler informasjon", "Fyll ut navn på brudeparet og tittel.");
      return;
    }

    const validItems = items.filter((i) => i.label && i.url);
    if (validItems.length === 0) {
      Alert.alert("Mangler lenker", "Legg til minst én lenke med etikett og URL.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveMutation.mutate();
  };

  const getIconName = (iconName: string): keyof typeof Feather.glyphMap => {
    const map: Record<string, keyof typeof Feather.glyphMap> = {
      image: "image",
      video: "video",
      globe: "globe",
      download: "download",
      "file-text": "file-text",
      file: "file",
      link: "link",
    };
    return map[iconName] || "link";
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md, backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIconCircle, { backgroundColor: theme.accent }]}>
            <Feather name="package" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
              {isEditMode ? "Rediger leveranse" : "Ny leveranse"}
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {isEditMode ? "Oppdater leveranseinfo" : "Del innhold med brudeparet"}
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
          <Feather name="x" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: theme.accent + "15" }]}>
              <Feather name="users" size={16} color={theme.accent} />
            </View>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Brudepar</ThemedText>
          </View>
          <View style={styles.section}>
          <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <Feather name="users" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Navn på brudeparet *"
              placeholderTextColor={theme.textMuted}
              value={coupleName}
              onChangeText={setCoupleName}
            />
          </View>
          <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <Feather name="mail" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="E-post (valgfritt)"
              placeholderTextColor={theme.textMuted}
              value={coupleEmail}
              onChangeText={setCoupleEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <Feather name="calendar" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Bryllupsdato (valgfritt)"
              placeholderTextColor={theme.textMuted}
              value={weddingDate}
              onChangeText={setWeddingDate}
            />
          </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: theme.accent + "15" }]}>
              <Feather name="file-text" size={16} color={theme.accent} />
            </View>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Leveranse</ThemedText>
          </View>
          <View style={styles.section}>
          <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <Feather name="tag" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Tittel *"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>
          <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text }]}
              placeholder="Beskrivelse (valgfritt)"
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
          </View>
        </View>

        <View style={styles.itemsHeader}>
          <View style={styles.itemsHeaderLeft}>
            <View style={[styles.sectionIconCircle, { backgroundColor: theme.accent + "15" }]}>
              <Feather name="link" size={16} color={theme.accent} />
            </View>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Lenker</ThemedText>
          </View>
          <Pressable 
            onPress={addItem} 
            style={({ pressed }) => [
              styles.addItemBtn, 
              { backgroundColor: pressed ? theme.accent : theme.accent + "15" }
            ]}
          >
            <Feather name="plus" size={16} color={theme.accent} />
            <ThemedText style={[styles.addItemText, { color: theme.accent }]}>Legg til</ThemedText>
          </Pressable>
        </View>

        {items.map((item, index) => (
          <View key={index} style={[styles.itemCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <View style={styles.itemHeader}>
              <ThemedText style={[styles.itemNumber, { color: theme.textMuted }]}>Lenke {index + 1}</ThemedText>
              {items.length > 1 ? (
                <Pressable onPress={() => removeItem(index)} style={styles.removeBtn}>
                  <Feather name="x" size={18} color="#EF5350" />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.typeSelector}>
              {ITEM_TYPES.map((type) => (
                <Pressable
                  key={type.value}
                  onPress={() => {
                    updateItem(index, "type", type.value);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: Spacing.sm + 2,
                    borderRadius: BorderRadius.sm,
                    borderWidth: item.type === type.value ? 0 : 1,
                    backgroundColor: item.type === type.value ? theme.accent : theme.backgroundRoot,
                    borderColor: theme.border,
                  }]}
                >
                  <Feather
                    name={getIconName(type.icon)}
                    size={16}
                    color={item.type === type.value ? "#FFFFFF" : theme.textSecondary}
                  />
                </Pressable>
              ))}
            </View>

            <View style={[styles.itemInput, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Etikett (f.eks. Bryllupsbilder)"
                placeholderTextColor={theme.textMuted}
                value={item.label}
                onChangeText={(v) => updateItem(index, "label", v)}
              />
            </View>

            <View style={[styles.itemInput, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={item.type === "gallery" ? "Google Drive eller bilde-URL" : "URL (https://...)"}
                placeholderTextColor={theme.textMuted}
                value={item.url}
                onChangeText={(v) => updateItem(index, "url", v)}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
            
            {/* Google Drive hint for gallery type */}
            {item.type === "gallery" && !item.url ? (
              <View style={styles.urlHintRow}>
                <ThemedText style={[styles.urlHint, { color: theme.textMuted }]}>
                  💡 Lim inn Google Drive-lenke – konverteres automatisk!
                </ThemedText>
                <Pressable 
                  onPress={() => setShowGoogleDriveHelp(true)}
                  style={[styles.helpBtn, { backgroundColor: theme.accent + "15" }]}
                >
                  <Feather name="help-circle" size={14} color={theme.accent} />
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}

        <Pressable
          onPress={handleSubmit}
          disabled={saveMutation.isPending}
          style={({ pressed }) => [
            styles.submitBtn,
            { 
              backgroundColor: theme.accent, 
              opacity: saveMutation.isPending ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <View style={styles.submitBtnIcon}>
                <Feather name="check" size={18} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.submitBtnText}>
                {isEditMode ? "Lagre endringer" : "Opprett leveranse"}
              </ThemedText>
            </>
          )}
        </Pressable>

        {isEditMode && (
          <Pressable
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
            style={({ pressed }) => [
              styles.deleteBtn,
              { 
                backgroundColor: "#F44336" + "15",
                opacity: deleteMutation.isPending ? 0.5 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator color="#F44336" />
            ) : (
              <>
                <Feather name="trash-2" size={18} color="#F44336" />
                <ThemedText style={[styles.deleteBtnText, { color: "#F44336" }]}>
                  Slett leveranse
                </ThemedText>
              </>
            )}
          </Pressable>
        )}
      </KeyboardAwareScrollViewCompat>

      {/* Google Drive Help Modal */}
      <Modal
        visible={showGoogleDriveHelp}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGoogleDriveHelp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            {/* Header with Google logo */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Image 
                  source={{ uri: "https://www.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png" }}
                  style={styles.googleDriveLogo}
                />
                <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                  Google Drive Oppsett
                </ThemedText>
              </View>
              <Pressable 
                onPress={() => setShowGoogleDriveHelp(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <ThemedText style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                Følg disse trinnene for å dele bilder fra Google Drive:
              </ThemedText>

              {/* Step 1 */}
              <View style={styles.helpStep}>
                <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
                  <ThemedText style={styles.stepNumberText}>1</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
                    Åpne Google Drive
                  </ThemedText>
                  <ThemedText style={[styles.stepDesc, { color: theme.textMuted }]}>
                    Gå til drive.google.com eller åpne Google Drive-appen
                  </ThemedText>
                </View>
              </View>

              {/* Step 2 */}
              <View style={styles.helpStep}>
                <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
                  <ThemedText style={styles.stepNumberText}>2</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
                    Velg bildet og åpne delings-innstillinger
                  </ThemedText>
                  <ThemedText style={[styles.stepDesc, { color: theme.textMuted }]}>
                    Høyreklikk på bildet → "Del" eller klikk på de tre prikkene → "Del"
                  </ThemedText>
                </View>
              </View>

              {/* Step 3 - Important! */}
              <View style={[styles.helpStep, styles.importantStep, { borderColor: theme.accent }]}>
                <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
                  <ThemedText style={styles.stepNumberText}>3</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
                    Endre til "Alle med lenken" ⚠️
                  </ThemedText>
                  <ThemedText style={[styles.stepDesc, { color: theme.textMuted }]}>
                    Under "Generell tilgang", klikk på "Begrenset" og endre til{" "}
                    <ThemedText style={{ fontWeight: "700", color: theme.text }}>
                      "Alle med lenken"
                    </ThemedText>
                  </ThemedText>
                  <View style={[styles.warningBox, { backgroundColor: "#FFF3E0" }]}>
                    <Feather name="alert-triangle" size={16} color="#FF9800" />
                    <ThemedText style={styles.warningText}>
                      Viktig: Hvis bildet forblir "Begrenset", vil det ikke vises i appen!
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Step 4 */}
              <View style={styles.helpStep}>
                <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
                  <ThemedText style={styles.stepNumberText}>4</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
                    Kopier lenken
                  </ThemedText>
                  <ThemedText style={[styles.stepDesc, { color: theme.textMuted }]}>
                    Klikk "Kopier lenke" eller kopier URL-en fra adressefeltet
                  </ThemedText>
                </View>
              </View>

              {/* Step 5 */}
              <View style={styles.helpStep}>
                <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
                  <ThemedText style={styles.stepNumberText}>5</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
                    Lim inn i appen
                  </ThemedText>
                  <ThemedText style={[styles.stepDesc, { color: theme.textMuted }]}>
                    Lim inn lenken i URL-feltet – den konverteres automatisk til et bilde!
                  </ThemedText>
                </View>
              </View>

              {/* Supported formats */}
              <View style={[styles.supportedFormats, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <ThemedText style={[styles.formatsTitle, { color: theme.text }]}>
                  ✅ Støttede lenkeformater:
                </ThemedText>
                <ThemedText style={[styles.formatExample, { color: theme.textMuted }]}>
                  • drive.google.com/file/d/ABC123/view
                </ThemedText>
                <ThemedText style={[styles.formatExample, { color: theme.textMuted }]}>
                  • drive.google.com/open?id=ABC123
                </ThemedText>
              </View>

              {/* Open Google Drive button */}
              <Pressable
                onPress={() => {
                  Linking.openURL("https://drive.google.com");
                  setShowGoogleDriveHelp(false);
                }}
                style={({ pressed }) => [
                  styles.openDriveBtn,
                  { 
                    backgroundColor: pressed ? "#1a73e8" : "#4285F4",
                  }
                ]}
              >
                <Image 
                  source={{ uri: "https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" }}
                  style={styles.googleGLogo}
                />
                <ThemedText style={styles.openDriveBtnText}>
                  Åpne Google Drive
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  content: {
    paddingHorizontal: Spacing.lg,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
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
    letterSpacing: -0.2,
  },
  section: {
    gap: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  textAreaContainer: {
    height: 100,
    alignItems: "flex-start",
    paddingVertical: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  textArea: {
    height: "100%",
    textAlignVertical: "top",
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  itemsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  addItemText: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  itemNumber: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF535015",
  },
  typeSelector: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  itemInput: {
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
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
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  // URL hint and help button styles
  urlHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  urlHint: {
    fontSize: 12,
    flex: 1,
  },
  helpBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  googleDriveLogo: {
    width: 28,
    height: 28,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalCloseBtn: {
    padding: Spacing.xs,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  helpStep: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  importantStep: {
    backgroundColor: "rgba(66, 133, 244, 0.05)",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginLeft: -Spacing.md,
    marginRight: -Spacing.md,
    paddingLeft: Spacing.md + Spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  warningText: {
    fontSize: 12,
    color: "#E65100",
    flex: 1,
    lineHeight: 18,
  },
  supportedFormats: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  formatsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  formatExample: {
    fontSize: 12,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  openDriveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  googleGLogo: {
    width: 20,
    height: 20,
  },
  openDriveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
