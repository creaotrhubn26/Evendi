import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Linking, Modal, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { EvendiIcon, EvendiIconGlyphMap } from "@/components/EvendiIcon";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { SwipeableRow } from "@/components/SwipeableRow";
import { useTheme } from "@/hooks/useTheme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getCurrencyCode } from "@/lib/format-currency";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { getVendorConfig } from "@/lib/vendor-adapter";
import { useVendorProfile } from "@/hooks/useVendorProfile";
import { getSpeeches } from "@/lib/storage";
import { Speech } from "@/lib/types";
import { showToast } from "@/lib/toast";
import { showConfirm } from "@/lib/dialogs";
import { MusicYouTubePreviewModal } from "@/components/music/MusicYouTubePreviewModal";
const VENDOR_STORAGE_KEY = "evendi_vendor_session";
type Navigation = NativeStackNavigationProp<any>;
type VendorProduct = {
  id: string;
  title: string;
  description: string | null;
  unitPrice: number;
  unitType: string;
  imageUrl: string | null;
};
type VendorOffer = {
  id: string;
  title: string;
  status: string;
  totalAmount: number;
  currency: string | null;
  createdAt: string;
  couple?: {
    id: string;
    displayName: string;
    email: string;
  } | null;
};
type MusicPreferences = {
  spotifyPlaylistUrl: string | null;
  youtubePlaylistUrl: string | null;
  entranceSong: string | null;
  firstDanceSong: string | null;
  lastSong: string | null;
  doNotPlay: string | null;
  additionalNotes: string | null;
};
type MusicBrief = {
  couple?: {
    id: string;
    displayName: string | null;
    email: string | null;
    weddingDate: string | null;
    selectedTraditions?: string[] | null;
  };
  performances: { id: string; title: string; date: string; time?: string | null }[];
  setlists: { id: string; title: string; songs?: string | null; genre?: string | null }[];
  timeline: {
    musicianSelected: boolean;
    setlistDiscussed: boolean;
    contractSigned: boolean;
    depositPaid: boolean;
    budget: number;
  };
  preferences: MusicPreferences;
  matcherProfile?: {
    preferredCultures?: string[];
    preferredLanguages?: string[];
    vibeLevel?: number;
    energyLevel?: number;
    cleanLyricsOnly?: boolean;
    selectedMoments?: string[];
  } | null;
  offer?: {
    id: string;
    status: string;
  } | null;
  moments?: {
    id: string;
    key: string;
    title: string;
  }[];
  sets?: {
    id: string;
    title: string;
    offerId?: string | null;
    updatedByRole?: string | null;
    items: {
      id: string;
      title: string;
      artist?: string | null;
      youtubeVideoId?: string | null;
      momentKey?: string | null;
      position: number;
      dropMarkerSeconds?: number | null;
    }[];
  }[];
  vendorPermission?: {
    canExportYoutube?: boolean;
  } | null;
};
type CulturalVendor = {
  id: string;
  businessName: string;
  location: string | null;
  description: string | null;
  phone?: string | null;
  website?: string | null;
  categoryId?: string | null;
  culturalExpertise?: string[] | null;
  isFeatured?: boolean;
  isPrioritized?: boolean;
};
const CULTURE_LABELS: Record<string, string> = {
  norway: "Norsk",
  sweden: "Svensk",
  denmark: "Dansk",
  hindu: "Hindu",
  sikh: "Sikh",
  muslim: "Muslim",
  jewish: "Jødisk",
  chinese: "Kinesisk",
};
const CULTURE_ALIASES: Record<string, string> = {
  norsk: "norway",
  norwegian: "norway",
  sverige: "sweden",
  svensk: "sweden",
  danmark: "denmark",
  dansk: "denmark",
  indisk: "hindu",
  indian: "hindu",
  muslimsk: "muslim",
  jodisk: "jewish",
  jødisk: "jewish",
  kinesisk: "chinese",
};
const CULTURE_MUSIC_TIPS: Record<string, string[]> = {
  norway: [
    "Hardingfele eller fele til innmarsj gir en klassisk norsk stemning.",
    "Brudevals er et fast innslag for norske bryllup - avklar tempo og lengde. For andre arrangementer, planlegg åpningsdans eller prosesjon.",
  ],
  sweden: [
    "Svenske brudevalser og folketoner passer godt til seremonier og festlige overganger.",
  ],
  denmark: [
    "Danske arrangementer har ofte fellesdanser - planlegg tydelige overganger.",
  ],
  hindu: [
    "Avklar innslag til Sangeet eller inngangsmusikk i god tid.",
    "Hold klar rolige låter til ritualer, og energisk musikk til dans.",
  ],
  sikh: [
    "Laavan-seremonien følger tradisjonelle hymner - koordiner med Gurdwara.",
  ],
  muslim: [
    "Spill gjerne rolig bakgrunnsmusikk før Nikah og øk tempoet til festen.",
  ],
  jewish: [
    "Hora og Hava Nagila er klassiske - sjekk tempo og startpunkt.",
  ],
  chinese: [
    "Tradisjonell instrumentalmusikk passer godt ved te-seremoni.",
  ],
};
const normalizeCultureKey = (key: string) => {
  const normalized = key.trim().toLowerCase();
  return CULTURE_ALIASES[normalized] || normalized;
};

const extractYouTubeVideoId = (value: string): string | null => {
  const input = value.trim();
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  try {
    const normalized = input.startsWith("http") ? input : `https://${input}`;
    const parsed = new URL(normalized);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").trim();
      return id || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v") || null;
    }
    return null;
  } catch {
    return null;
  }
};

export default function VendorMusikkScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { getSetting } = useAppSettings();
  const navigation = useNavigation<Navigation>();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [speeches, setSpeeches] = useState<Speech[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [chatVendor, setChatVendor] = useState<CulturalVendor | null>(null);
  const [isChatPickerOpen, setIsChatPickerOpen] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [selectedMusicSetId, setSelectedMusicSetId] = useState<string | null>(null);
  const [manualSongTitle, setManualSongTitle] = useState("");
  const [manualSongArtist, setManualSongArtist] = useState("");
  const [manualSongYouTubeInput, setManualSongYouTubeInput] = useState("");
  const [isUpdatingSet, setIsUpdatingSet] = useState(false);
  const [isExportingSet, setIsExportingSet] = useState(false);
  const [lastExportUrl, setLastExportUrl] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{ videoId: string; title: string } | null>(null);
  const vendorProfileQuery = useVendorProfile(sessionToken);
  const vendorConfig = getVendorConfig(
    vendorProfileQuery.data?.category?.id ?? null,
    vendorProfileQuery.data?.category?.name ?? "Musikk",
    vendorProfileQuery.data?.category?.dashboardKey ?? null
  );
  // Load speeches for music coordination
  const speechesQuery = useQuery<Speech[]>({
    queryKey: ['speeches'],
    queryFn: async () => {
      const data = await getSpeeches();
      return Array.isArray(data) ? data : [];
    },
  });
  useEffect(() => {
    if (speechesQuery.data) {
      setSpeeches(speechesQuery.data || []);
    }
  }, [speechesQuery.data]);
  useEffect(() => {
    const loadSession = async () => {
      const data = await AsyncStorage.getItem(VENDOR_STORAGE_KEY);
      if (!data) {
        navigation.replace("VendorLogin");
        return;
      }
      const parsed = JSON.parse(data);
      setSessionToken(parsed?.sessionToken || null);
      setVendorId(parsed?.vendorId || null);
    };
    loadSession();
  }, [navigation]);
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery<VendorProduct[]>({
    queryKey: ["/api/vendor/products"],
    queryFn: async () => {
      if (!sessionToken) return [];
      const res = await fetch(new URL("/api/vendor/products", getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!sessionToken,
  });
  const { data: offers = [], isLoading: offersLoading, refetch: refetchOffers } = useQuery<VendorOffer[]>({
    queryKey: ["/api/vendor/offers"],
    queryFn: async () => {
      if (!sessionToken) return [];
      const res = await fetch(new URL("/api/vendor/offers", getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!sessionToken,
  });
  const acceptedOffers = useMemo(
    () => offers.filter((offer) => offer.status === "accepted"),
    [offers]
  );
  useEffect(() => {
    if (selectedOfferId) return;
    if (acceptedOffers.length > 0) {
      setSelectedOfferId(acceptedOffers[0].id);
    }
  }, [acceptedOffers, selectedOfferId]);
  const { data: musicBrief, isLoading: briefLoading, refetch: refetchBrief } = useQuery<MusicBrief | null>({
    queryKey: ["vendor-music-preferences", selectedOfferId],
    queryFn: async () => {
      if (!sessionToken || !selectedOfferId) return null;
      const res = await fetch(
        new URL(`/api/vendor/music/preferences/${selectedOfferId}`, getApiUrl()).toString(),
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      if (!res.ok) throw new Error("Kunne ikke hente musikkønsker");
      return res.json();
    },
    enabled: !!sessionToken && !!selectedOfferId,
  });
  const canEditSharedSets = musicBrief?.offer?.status === "accepted";
  const canExportToCoupleYoutube = !!musicBrief?.vendorPermission?.canExportYoutube;
  const sharedSets = useMemo(() => musicBrief?.sets || [], [musicBrief?.sets]);
  const selectedMusicSet = useMemo(
    () => sharedSets.find((set) => set.id === selectedMusicSetId) || null,
    [sharedSets, selectedMusicSetId]
  );
  useEffect(() => {
    if (sharedSets.length === 0) {
      setSelectedMusicSetId(null);
      return;
    }
    setSelectedMusicSetId((current) => {
      if (current && sharedSets.some((set) => set.id === current)) return current;
      return sharedSets[0].id;
    });
  }, [sharedSets]);
  const cultureKeys = useMemo(() => {
    const raw = musicBrief?.couple?.selectedTraditions || [];
    const normalized = raw.map(normalizeCultureKey).filter(Boolean);
    return Array.from(new Set(normalized));
  }, [musicBrief?.couple?.selectedTraditions]);
  const cultureLabels = useMemo(() => {
    return cultureKeys.map((key) => CULTURE_LABELS[key] || key);
  }, [cultureKeys]);
  const culturalTips = useMemo(() => {
    const tips = cultureKeys.flatMap((key) => CULTURE_MUSIC_TIPS[key] || []);
    return Array.from(new Set(tips));
  }, [cultureKeys]);
  const { data: culturalVendors = [], isLoading: cultureLoading, refetch: refetchCulture } = useQuery<CulturalVendor[]>({
    queryKey: ["vendor-music-culture", cultureKeys.join("|"), vendorId],
    queryFn: async () => {
      const res = await fetch(new URL("/api/vendors/matching?category=music", getApiUrl()).toString());
      if (!res.ok) return [];
      const data: CulturalVendor[] = await res.json();
      const cultureSet = new Set(cultureKeys);
      return data
        .filter((vendor) => (vendorId ? vendor.id !== vendorId : true))
        .filter((vendor) => {
          const expertise = vendor.culturalExpertise || [];
          return expertise.some((culture) => cultureSet.has(normalizeCultureKey(culture)));
        })
        .slice(0, 6);
    },
    enabled: cultureKeys.length > 0,
  });
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const refreshPromises: Promise<unknown>[] = [refetchProducts(), refetchOffers(), refetchBrief()];
    if (cultureKeys.length > 0) {
      refreshPromises.push(refetchCulture());
    }
    await Promise.all(refreshPromises);
    setIsRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [cultureKeys.length, refetchBrief, refetchCulture, refetchOffers, refetchProducts]);
  const goToProducts = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("ProductCreate");
  };
  const goToOffers = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("OfferCreate");
  };
  const handleDelete = (id: string, type: 'product' | 'offer') => {
    showConfirm({
      title: `Slett ${type === 'product' ? 'produkt' : 'tilbud'}`,
      message: "Er du sikker?",
      confirmLabel: "Slett",
      cancelLabel: "Avbryt",
      destructive: true,
    }).then((confirmed) => {
      if (confirmed) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  };
  const openLink = async (url?: string | null) => {
    if (!url) return;
    const finalUrl = url.startsWith("http") ? url : `https://${url}`;
    const canOpen = await Linking.canOpenURL(finalUrl);
    if (!canOpen) {
      showToast("Kan ikke åpne lenken.");
      return;
    }
    await Linking.openURL(finalUrl);
  };
  const openPhone = async (phone?: string | null) => {
    if (!phone) {
      showToast("Denne leverandoren har ikke registrert telefonnummer.");
      return;
    }
    const sanitized = phone.replace(/[^\d+]/g, "");
    if (!sanitized) {
      showToast("Telefonnummeret kunne ikke leses.");
      return;
    }
    const phoneUrl = `tel:${sanitized}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);
    if (!canOpen) {
      showToast("Kan ikke åpne telefonnummeret.");
      return;
    }
    await Linking.openURL(phoneUrl);
  };
  const openVendorProfile = (vendor: CulturalVendor) => {
    navigation.navigate("VendorPublicProfile", {
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      vendorDescription: vendor.description || null,
      vendorLocation: vendor.location || null,
      vendorPriceRange: null,
      vendorCategory: vendor.categoryId || "music",
      readOnly: true,
    });
  };
  const vendorMusicRequest = async (path: string, init?: RequestInit) => {
    if (!sessionToken) throw new Error("Mangler vendor-session");
    const response = await fetch(new URL(path, getApiUrl()).toString(), {
      ...init,
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Vendor music API-feil");
    }
    return response.json().catch(() => null);
  };
  const moveMusicSetItem = async (itemId: string, direction: -1 | 1) => {
    if (!selectedMusicSet || !canEditSharedSets) return;
    const ordered = [...(selectedMusicSet.items || [])].sort((a, b) => a.position - b.position);
    const index = ordered.findIndex((item) => item.id === itemId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;
    const reordered = [...ordered];
    const temp = reordered[index];
    reordered[index] = reordered[nextIndex];
    reordered[nextIndex] = temp;

    setIsUpdatingSet(true);
    try {
      await vendorMusicRequest(`/api/vendor/music/sets/${selectedMusicSet.id}/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ orderedItemIds: reordered.map((item) => item.id) }),
      });
      await refetchBrief();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Kunne ikke reordne sett");
    } finally {
      setIsUpdatingSet(false);
    }
  };
  const updateDropMarker = async (itemId: string, nextDropValue: number | null) => {
    if (!selectedMusicSet || !canEditSharedSets) return;
    setIsUpdatingSet(true);
    try {
      await vendorMusicRequest(`/api/vendor/music/sets/${selectedMusicSet.id}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ dropMarkerSeconds: nextDropValue }),
      });
      await refetchBrief();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Kunne ikke oppdatere drop marker");
    } finally {
      setIsUpdatingSet(false);
    }
  };
  const removeMusicSetItem = async (itemId: string) => {
    if (!selectedMusicSet || !canEditSharedSets) return;
    setIsUpdatingSet(true);
    try {
      await vendorMusicRequest(`/api/vendor/music/sets/${selectedMusicSet.id}/items/${itemId}`, {
        method: "DELETE",
      });
      await refetchBrief();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Kunne ikke fjerne låten");
    } finally {
      setIsUpdatingSet(false);
    }
  };
  const addManualMusicSetItem = async () => {
    if (!selectedMusicSet || !canEditSharedSets) return;
    const title = manualSongTitle.trim();
    const videoId = extractYouTubeVideoId(manualSongYouTubeInput);
    if (!title) {
      showToast("Legg inn låttittel");
      return;
    }
    if (!videoId) {
      showToast("Legg inn gyldig YouTube URL eller video-id");
      return;
    }

    setIsUpdatingSet(true);
    try {
      await vendorMusicRequest(`/api/vendor/music/sets/${selectedMusicSet.id}/items`, {
        method: "POST",
        body: JSON.stringify({
          title,
          artist: manualSongArtist.trim() || null,
          youtubeVideoId: videoId,
          momentKey: null,
        }),
      });
      setManualSongTitle("");
      setManualSongArtist("");
      setManualSongYouTubeInput("");
      await refetchBrief();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Kunne ikke legge til låt");
    } finally {
      setIsUpdatingSet(false);
    }
  };
  const exportMusicSetToYouTube = async () => {
    if (!selectedOfferId || !selectedMusicSet) return;
    if (!canExportToCoupleYoutube) {
      showToast("Paret må gi samtykke før eksport.");
      return;
    }
    setIsExportingSet(true);
    try {
      const job = await vendorMusicRequest(`/api/vendor/music/export/youtube-playlist/${selectedOfferId}`, {
        method: "POST",
        body: JSON.stringify({
          setId: selectedMusicSet.id,
          title: selectedMusicSet.title,
          privacyStatus: "unlisted",
        }),
      });
      setLastExportUrl(job?.youtubePlaylistUrl || null);
      await refetchBrief();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Kunne ikke eksportere YouTube-playlist");
    } finally {
      setIsExportingSet(false);
    }
  };
  const handleStartVendorChat = async (coupleId: string) => {
    if (!sessionToken || !chatVendor) return;
    if (!coupleId) {
      showToast("Kunne ikke finne paret for dette tilbudet.");
      return;
    }
    setIsStartingChat(true);
    try {
      const response = await fetch(new URL("/api/vendor/vendor-conversations", getApiUrl()).toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otherVendorId: chatVendor.id, coupleId }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Kunne ikke starte samtale");
      }
      const data = await response.json();
      setIsChatPickerOpen(false);
      setChatVendor(null);
      navigation.navigate("VendorChat", {
        conversationId: data.id,
        chatType: "vendor",
        coupleName: chatVendor.businessName,
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Kunne ikke starte samtale");
    } finally {
      setIsStartingChat(false);
    }
  };
  const openChatPicker = (vendor: CulturalVendor) => {
    if (acceptedOffers.length === 0) {
      showToast("Du trenger et akseptert tilbud for å velge par.");
      return;
    }
    setChatVendor(vendor);
    setIsChatPickerOpen(true);
  };
  if (!sessionToken) return null;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xl + insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={theme.accent}
        />
      }
    >
      <ThemedText style={[styles.title, { color: theme.text }]}>Musikk dashboard</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Publiser pakker for {vendorConfig.categoryName.toLowerCase()}, og send tilbud raskt.
      </ThemedText>
      <View style={styles.cardRow}>
        <Pressable
          onPress={goToProducts}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            pressed && { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <View style={styles.cardHeader}>
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Musikk-pakker</ThemedText>
            <EvendiIcon name="music" size={18} color={theme.textSecondary} />
          </View>
          <ThemedText style={[styles.cardBody, { color: theme.textSecondary }]}>Legg til pakker for band, DJ, eller musikere med timepriser og spilleliste.</ThemedText>
          <Button style={styles.cardButton} onPress={goToProducts}>Opprett pakke</Button>
        </Pressable>
        <Pressable
          onPress={goToOffers}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            pressed && { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <View style={styles.cardHeader}>
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Tilbud</ThemedText>
            <EvendiIcon name="file-text" size={18} color={theme.textSecondary} />
          </View>
          <ThemedText style={[styles.cardBody, { color: theme.textSecondary }]}>Send tilbud med timepriser og tilgjengelighet.</ThemedText>
          <Button style={styles.cardButton} onPress={goToOffers}>Send tilbud</Button>
        </Pressable>
      </View>
      <View style={[styles.infoBox, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <EvendiIcon name="info" size={16} color={theme.textSecondary} />
        <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>Legg til lyd-eksempler og spillelister for å øke konvertering.</ThemedText>
      </View>
      <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Produkter</ThemedText>
          {productsLoading ? <ActivityIndicator size="small" color={theme.accent} /> : null}
        </View>
        {products.length === 0 ? (
          <View style={styles.emptyRow}>
            <EvendiIcon name="music" size={18} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>Ingen pakker ennå</ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Legg til musikk-pakker for å komme i gang</ThemedText>
            </View>
            <Button onPress={goToProducts}>Opprett</Button>
          </View>
        ) : (
          products.map((p, idx) => (
            <Animated.View key={p.id} entering={FadeInDown.delay(idx * 30)}>
              <SwipeableRow onDelete={() => handleDelete(p.id, 'product')}>
                <Pressable onPress={goToProducts} style={[styles.listRow, { borderBottomColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ color: theme.text, fontWeight: "600" }}>{p.title}</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>{p.unitPrice} {p.unitType}</ThemedText>
                    {p.description ? <ThemedText numberOfLines={1} style={{ color: theme.textSecondary, fontSize: 12 }}>{p.description}</ThemedText> : null}
                  </View>
                  <EvendiIcon name="chevron-right" size={18} color={theme.textSecondary} />
                </Pressable>
              </SwipeableRow>
            </Animated.View>
          ))
        )}
      </View>
      <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Tilbud</ThemedText>
          {offersLoading ? <ActivityIndicator size="small" color={theme.accent} /> : null}
        </View>
        {offers.length === 0 ? (
          <View style={styles.emptyRow}>
            <EvendiIcon name="file-text" size={18} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>Ingen tilbud ennå</ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Send tilbud til kunden</ThemedText>
            </View>
            <Button onPress={goToOffers}>Send tilbud</Button>
          </View>
        ) : (
          offers.map((o, idx) => (
            <Animated.View key={o.id} entering={FadeInDown.delay(idx * 30)}>
              <SwipeableRow onDelete={() => handleDelete(o.id, 'offer')}>
                <Pressable onPress={goToOffers} style={[styles.listRow, { borderBottomColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ color: theme.text, fontWeight: "600" }}>{o.title}</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                      {o.totalAmount} {o.currency || getCurrencyCode(getSetting)}
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{o.status}</ThemedText>
                    <EvendiIcon name="chevron-right" size={18} color={theme.textSecondary} />
                  </View>
                </Pressable>
              </SwipeableRow>
            </Animated.View>
          ))
        )}
      </View>
      <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Musikkønsker</ThemedText>
          {briefLoading ? <ActivityIndicator size="small" color={theme.accent} /> : null}
        </View>
        {acceptedOffers.length === 0 ? (
          <View style={styles.emptyRow}>
            <EvendiIcon name="music" size={18} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>Ingen aksepterte tilbud</ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Musikkønsker vises når et tilbud er akseptert</ThemedText>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.offerSelectRow}>
              {acceptedOffers.map((offer) => (
                <Pressable
                  key={offer.id}
                  onPress={() => setSelectedOfferId(offer.id)}
                  style={[
                    styles.offerChip,
                    {
                      borderColor: theme.border,
                      backgroundColor: selectedOfferId === offer.id ? theme.accent : theme.backgroundSecondary,
                    },
                  ]}
                >
                  <ThemedText
                    style={{ color: selectedOfferId === offer.id ? theme.buttonText : theme.textSecondary, fontSize: 12, fontWeight: "600" }}
                  >
                    {offer.couple?.displayName || offer.title}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            {musicBrief ? (
              <View style={styles.musicBriefBody}>
                <ThemedText style={[styles.musicBriefTitle, { color: theme.text }]}>Kunde</ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                  {musicBrief.couple?.displayName || "Ukjent"}
                </ThemedText>
                {musicBrief.couple?.weddingDate ? (
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                    Arrangementsdato: {musicBrief.couple.weddingDate}
                  </ThemedText>
                ) : null}
                <View style={styles.musicBriefSection}>
                  <ThemedText style={[styles.musicBriefTitle, { color: theme.text }]}>Spillelister</ThemedText>
                  {musicBrief.preferences.spotifyPlaylistUrl ? (
                    <Pressable onPress={() => openLink(musicBrief.preferences.spotifyPlaylistUrl)}>
                      <ThemedText style={[styles.musicLink, { color: theme.accent }]}>Spotify</ThemedText>
                    </Pressable>
                  ) : null}
                  {musicBrief.preferences.youtubePlaylistUrl ? (
                    <Pressable onPress={() => openLink(musicBrief.preferences.youtubePlaylistUrl)}>
                      <ThemedText style={[styles.musicLink, { color: theme.accent }]}>YouTube</ThemedText>
                    </Pressable>
                  ) : null}
                  {!musicBrief.preferences.spotifyPlaylistUrl && !musicBrief.preferences.youtubePlaylistUrl ? (
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>Ingen lenker enda</ThemedText>
                  ) : null}
                </View>
                <View style={styles.musicBriefSection}>
                  <ThemedText style={[styles.musicBriefTitle, { color: theme.text }]}>Spesielle sanger</ThemedText>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                    Inngang: {musicBrief.preferences.entranceSong || "Ikke satt"}
                  </ThemedText>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                    Første dans: {musicBrief.preferences.firstDanceSong || "Ikke satt"}
                  </ThemedText>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                    Siste sang: {musicBrief.preferences.lastSong || "Ikke satt"}
                  </ThemedText>
                </View>
                {musicBrief.preferences.doNotPlay ? (
                  <View style={styles.musicBriefSection}>
                    <ThemedText style={[styles.musicBriefTitle, { color: theme.text }]}>Ikke spill</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                      {musicBrief.preferences.doNotPlay}
                    </ThemedText>
                  </View>
                ) : null}
                {musicBrief.preferences.additionalNotes ? (
                  <View style={styles.musicBriefSection}>
                    <ThemedText style={[styles.musicBriefTitle, { color: theme.text }]}>Notater</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                      {musicBrief.preferences.additionalNotes}
                    </ThemedText>
                  </View>
                ) : null}
                <View style={styles.musicBriefSection}>
                  <View style={styles.cultureHeaderRow}>
                    <ThemedText style={[styles.musicBriefTitle, { color: theme.text }]}>Delte set-lister</ThemedText>
                    <ThemedText style={{ color: canEditSharedSets ? theme.success : theme.textMuted, fontSize: 11, fontWeight: "700" }}>
                      {canEditSharedSets ? "Redigering aktiv" : "Kun lesetilgang"}
                    </ThemedText>
                  </View>
                  {sharedSets.length === 0 ? (
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                      Paret har ikke opprettet set-liste ennå.
                    </ThemedText>
                  ) : (
                    <>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChipRow}>
                        {sharedSets.map((set) => {
                          const active = selectedMusicSetId === set.id;
                          return (
                            <Pressable
                              key={set.id}
                              onPress={() => setSelectedMusicSetId(set.id)}
                              style={[
                                styles.offerChip,
                                {
                                  borderColor: active ? theme.accent : theme.border,
                                  backgroundColor: active ? theme.accent : theme.backgroundSecondary,
                                },
                              ]}
                            >
                              <ThemedText
                                style={{ color: active ? theme.buttonText : theme.textSecondary, fontSize: 12, fontWeight: "600" }}
                              >
                                {set.title}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </ScrollView>

                      {selectedMusicSet ? (
                        <View style={styles.sharedSetCard}>
                          <ThemedText style={[styles.musicBriefTitle, { color: theme.text }]}>Legg til låt manuelt</ThemedText>
                          <TextInput
                            value={manualSongTitle}
                            onChangeText={setManualSongTitle}
                            placeholder="Låttittel"
                            placeholderTextColor={theme.textMuted}
                            editable={canEditSharedSets && !isUpdatingSet}
                            style={[styles.setInput, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                          />
                          <TextInput
                            value={manualSongArtist}
                            onChangeText={setManualSongArtist}
                            placeholder="Artist (valgfritt)"
                            placeholderTextColor={theme.textMuted}
                            editable={canEditSharedSets && !isUpdatingSet}
                            style={[styles.setInput, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                          />
                          <TextInput
                            value={manualSongYouTubeInput}
                            onChangeText={setManualSongYouTubeInput}
                            placeholder="YouTube URL / video-id"
                            placeholderTextColor={theme.textMuted}
                            editable={canEditSharedSets && !isUpdatingSet}
                            style={[styles.setInput, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                          />
                          <Button onPress={addManualMusicSetItem} disabled={!canEditSharedSets || isUpdatingSet}>
                            {isUpdatingSet ? "Lagrer..." : "Add to set"}
                          </Button>

                          <View style={styles.sharedItemList}>
                            {[...(selectedMusicSet.items || [])]
                              .sort((a, b) => a.position - b.position)
                              .map((item, index, arr) => (
                                <View key={item.id} style={[styles.sharedItemRow, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}>
                                  <View style={styles.sharedItemTitleRow}>
                                    <View style={{ flex: 1 }}>
                                      <ThemedText style={{ color: theme.text, fontWeight: "700", fontSize: 13 }} numberOfLines={1}>
                                        {item.title}
                                      </ThemedText>
                                      <ThemedText style={{ color: theme.textSecondary, fontSize: 11 }} numberOfLines={1}>
                                        {item.artist || "Ukjent artist"}
                                        {item.momentKey ? ` • ${item.momentKey.replace(/_/g, " ")}` : ""}
                                      </ThemedText>
                                    </View>
                                    <ThemedText style={{ color: theme.textMuted, fontSize: 11 }}>
                                      {index + 1}/{arr.length}
                                    </ThemedText>
                                  </View>
                                  <View style={styles.sharedItemActions}>
                                    <Pressable
                                      onPress={() => moveMusicSetItem(item.id, -1)}
                                      disabled={!canEditSharedSets || index === 0 || isUpdatingSet}
                                      style={[styles.sharedIconBtn, { borderColor: theme.border, opacity: !canEditSharedSets || index === 0 || isUpdatingSet ? 0.45 : 1 }]}
                                    >
                                      <EvendiIcon name="chevron-up" size={14} color={theme.textSecondary} />
                                    </Pressable>
                                    <Pressable
                                      onPress={() => moveMusicSetItem(item.id, 1)}
                                      disabled={!canEditSharedSets || index === arr.length - 1 || isUpdatingSet}
                                      style={[styles.sharedIconBtn, { borderColor: theme.border, opacity: !canEditSharedSets || index === arr.length - 1 || isUpdatingSet ? 0.45 : 1 }]}
                                    >
                                      <EvendiIcon name="chevron-down" size={14} color={theme.textSecondary} />
                                    </Pressable>
                                    <Pressable
                                      onPress={() => updateDropMarker(item.id, item.dropMarkerSeconds ? Math.max(0, item.dropMarkerSeconds - 5) : 0)}
                                      disabled={!canEditSharedSets || isUpdatingSet}
                                      style={[styles.sharedIconBtn, { borderColor: theme.border, opacity: !canEditSharedSets || isUpdatingSet ? 0.45 : 1 }]}
                                    >
                                      <EvendiIcon name="minus" size={14} color={theme.textSecondary} />
                                    </Pressable>
                                    <Pressable
                                      onPress={() => updateDropMarker(item.id, item.dropMarkerSeconds ? item.dropMarkerSeconds + 5 : 30)}
                                      disabled={!canEditSharedSets || isUpdatingSet}
                                      style={[styles.sharedIconBtn, { borderColor: theme.border, opacity: !canEditSharedSets || isUpdatingSet ? 0.45 : 1 }]}
                                    >
                                      <EvendiIcon name="plus" size={14} color={theme.textSecondary} />
                                    </Pressable>
                                    <Pressable
                                      onPress={() => updateDropMarker(item.id, item.dropMarkerSeconds ? null : 45)}
                                      disabled={!canEditSharedSets || isUpdatingSet}
                                      style={[styles.dropMarkerBtn, { borderColor: theme.accent, backgroundColor: `${theme.accent}20`, opacity: !canEditSharedSets || isUpdatingSet ? 0.45 : 1 }]}
                                    >
                                      <ThemedText style={{ color: theme.accent, fontSize: 10, fontWeight: "700" }}>
                                        {item.dropMarkerSeconds ? `DROP ${item.dropMarkerSeconds}s` : "DROP HERE"}
                                      </ThemedText>
                                    </Pressable>
                                    {item.youtubeVideoId ? (
                                      <Pressable
                                        onPress={() => setPreviewVideo({ videoId: item.youtubeVideoId as string, title: item.title })}
                                        style={[styles.sharedIconBtn, { borderColor: theme.border }]}
                                      >
                                        <EvendiIcon name="play" size={14} color={theme.textSecondary} />
                                      </Pressable>
                                    ) : null}
                                    <Pressable
                                      onPress={() => removeMusicSetItem(item.id)}
                                      disabled={!canEditSharedSets || isUpdatingSet}
                                      style={[styles.sharedIconBtn, { borderColor: theme.border, opacity: !canEditSharedSets || isUpdatingSet ? 0.45 : 1 }]}
                                    >
                                      <EvendiIcon name="trash" size={14} color={theme.error} />
                                    </Pressable>
                                  </View>
                                </View>
                              ))}
                          </View>
                        </View>
                      ) : null}

                      <View style={styles.setExportSection}>
                        <Button onPress={exportMusicSetToYouTube} disabled={!canExportToCoupleYoutube || isExportingSet || !selectedMusicSet}>
                          {isExportingSet ? "Eksporterer..." : canExportToCoupleYoutube ? "Eksporter til parets YouTube" : "Mangler samtykke"}
                        </Button>
                        {lastExportUrl ? (
                          <Pressable onPress={() => openLink(lastExportUrl)} style={styles.exportLinkRow}>
                            <EvendiIcon name="external-link" size={13} color={theme.accent} />
                            <ThemedText style={[styles.musicLink, { color: theme.accent }]} numberOfLines={1}>{lastExportUrl}</ThemedText>
                          </Pressable>
                        ) : null}
                      </View>
                    </>
                  )}
                </View>
                {cultureKeys.length > 0 ? (
                  <View style={styles.musicBriefSection}>
                    <View style={styles.cultureHeaderRow}>
                      <ThemedText style={[styles.musicBriefTitle, { color: theme.text }]}>Kulturelle tips</ThemedText>
                      {cultureLoading ? <ActivityIndicator size="small" color={theme.accent} /> : null}
                    </View>
                    <View style={styles.cultureChipRow}>
                      {cultureLabels.map((label) => (
                        <View key={label} style={[styles.cultureChip, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}>
                          <ThemedText style={{ color: theme.textSecondary, fontSize: 11 }}>{label}</ThemedText>
                        </View>
                      ))}
                    </View>
                    {culturalTips.length > 0 ? (
                      culturalTips.map((tip, idx) => (
                        <View key={`${tip}-${idx}`} style={styles.tipRow}>
                          <EvendiIcon name="star" size={12} color={theme.accent} />
                          <ThemedText style={[styles.tipText, { color: theme.textSecondary }]}>{tip}</ThemedText>
                        </View>
                      ))
                    ) : (
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                        Ingen tips tilgjengelig ennå.
                      </ThemedText>
                    )}
                  </View>
                ) : null}
                {cultureKeys.length > 0 ? (
                  <View style={styles.musicBriefSection}>
                    <View style={styles.cultureHeaderRow}>
                      <ThemedText style={[styles.musicBriefTitle, { color: theme.text }]}>Matchende musikkleverandører</ThemedText>
                      {cultureLoading ? <ActivityIndicator size="small" color={theme.accent} /> : null}
                    </View>
                    {culturalVendors.length === 0 ? (
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                        Ingen leverandører med kulturmatch ennå.
                      </ThemedText>
                    ) : (
                      culturalVendors.map((vendor) => {
                        const expertiseLabels = (vendor.culturalExpertise || []).map((culture) => {
                          const normalized = normalizeCultureKey(culture);
                          return CULTURE_LABELS[normalized] || culture;
                        });
                        return (
                          <View key={vendor.id} style={[styles.cultureVendorRow, { borderColor: theme.border }]}>
                            <View style={{ flex: 1 }}>
                              <ThemedText style={{ color: theme.text, fontWeight: "600" }}>{vendor.businessName}</ThemedText>
                              {vendor.location ? (
                                <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>{vendor.location}</ThemedText>
                              ) : null}
                              {expertiseLabels.length > 0 ? (
                                <ThemedText style={{ color: theme.textMuted, fontSize: 11 }}>
                                  {expertiseLabels.join(", ")}
                                </ThemedText>
                              ) : null}
                              {(vendor.website || vendor.phone) ? (
                                <View style={styles.cultureVendorActions}>
                                  {vendor.website ? (
                                    <Pressable
                                      onPress={() => openLink(vendor.website)}
                                      style={[styles.cultureVendorAction, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
                                    >
                                      <EvendiIcon name="external-link" size={12} color={theme.textSecondary} />
                                      <ThemedText style={[styles.cultureVendorActionText, { color: theme.textSecondary }]}>Nettside</ThemedText>
                                    </Pressable>
                                  ) : null}
                                  {vendor.phone ? (
                                    <Pressable
                                      onPress={() => openPhone(vendor.phone)}
                                      style={[styles.cultureVendorAction, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
                                    >
                                      <EvendiIcon name="phone" size={12} color={theme.textSecondary} />
                                      <ThemedText style={[styles.cultureVendorActionText, { color: theme.textSecondary }]}>Ring</ThemedText>
                                    </Pressable>
                                  ) : null}
                                </View>
                              ) : null}
                              <View style={styles.cultureVendorActions}>
                                <Pressable
                                  onPress={() => openVendorProfile(vendor)}
                                  style={[styles.cultureVendorAction, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
                                >
                                  <EvendiIcon name="user" size={12} color={theme.textSecondary} />
                                  <ThemedText style={[styles.cultureVendorActionText, { color: theme.textSecondary }]}>Profil</ThemedText>
                                </Pressable>
                                <Pressable
                                  onPress={() => openChatPicker(vendor)}
                                  style={[styles.cultureVendorAction, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
                                >
                                  <EvendiIcon name="message-circle" size={12} color={theme.textSecondary} />
                                  <ThemedText style={[styles.cultureVendorActionText, { color: theme.textSecondary }]}>Chat</ThemedText>
                                </Pressable>
                              </View>
                            </View>
                            {vendor.isFeatured ? <EvendiIcon name="star" size={14} color={theme.accent} /> : null}
                          </View>
                        );
                      })
                    )}
                  </View>
                ) : null}
              </View>
            ) : (
              <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                Velg et akseptert tilbud for å se musikkønsker.
              </ThemedText>
            )}
          </>
        )}
      </View>
      {speeches.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Taler ({speeches.length})</ThemedText>
            <EvendiIcon name="mic" size={18} color={theme.textSecondary} />
          </View>
          <ThemedText style={[styles.speechSubtitle, { color: theme.textMuted }]}>
            Pause/senk musikken når taler starter
          </ThemedText>
          
          {speeches
            .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
            .map((speech, idx) => {
              const statusColor = speech.status === 'speaking' ? theme.warning :
                speech.status === 'done' ? theme.success : theme.textSecondary;
              const statusIcon: keyof typeof EvendiIconGlyphMap = speech.status === 'speaking' ? 'mic' :
                speech.status === 'done' ? 'check-circle' : 'clock';
              return (
                <Animated.View
                  key={speech.id || `${speech.speakerName}-${idx}`}
                  entering={FadeInDown.delay(idx * 30)}
                >
                  <View style={[styles.speechRow, { borderBottomColor: theme.border, backgroundColor: theme.backgroundSecondary }]}>
                    <View style={[styles.speechIconCircle, { backgroundColor: statusColor + '20' }]}>
                      <EvendiIcon name={statusIcon} size={16} color={statusColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.speechHeader}>
                        <ThemedText style={{ color: theme.text, fontWeight: '600', fontSize: 15 }}>
                          {speech.time} - {speech.speakerName}
                        </ThemedText>
                        <View style={[styles.speechStatusBadge, { backgroundColor: statusColor + '20' }]}>
                          <ThemedText style={{ color: statusColor, fontSize: 10, fontWeight: '700' }}>
                            {speech.status === 'speaking' ? '🔴 NÅ' : speech.status === 'done' ? 'Ferdig' : 'Klar'}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
                        {speech.role}
                      </ThemedText>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
        </View>
      )}
      <MusicYouTubePreviewModal
        visible={!!previewVideo}
        videoId={previewVideo?.videoId || null}
        title={previewVideo?.title || null}
        onClose={() => setPreviewVideo(null)}
        onOpenYouTube={(videoId) => openLink(`https://www.youtube.com/watch?v=${videoId}`)}
        backgroundColor={theme.backgroundDefault}
        borderColor={theme.border}
        textColor={theme.text}
        mutedTextColor={theme.textSecondary}
      />
      <Modal
        visible={isChatPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsChatPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsChatPickerOpen(false)}>
          <View
            style={[styles.modalCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Velg par</ThemedText>
              <Pressable onPress={() => setIsChatPickerOpen(false)}>
                <EvendiIcon name="x" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>
            <ThemedText style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Velg hvilket par denne leverandørsamtalen gjelder.</ThemedText>
            <View style={styles.modalList}>
              {acceptedOffers.map((offer) => (
                <Pressable
                  key={offer.id}
                  onPress={() => handleStartVendorChat(offer.couple?.id || "")}
                  style={[styles.modalRow, { borderColor: theme.border }]}
                  disabled={!offer.couple?.id || isStartingChat}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ color: theme.text, fontWeight: "600" }}>
                      {offer.couple?.displayName || offer.title}
                    </ThemedText>
                    {offer.couple?.email ? (
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>{offer.couple.email}</ThemedText>
                    ) : null}
                  </View>
                  {isStartingChat ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : (
                    <EvendiIcon name="chevron-right" size={18} color={theme.textSecondary} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "700", marginBottom: Spacing.xs },
  subtitle: { fontSize: 14, marginBottom: Spacing.lg },
  cardRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.lg },
  card: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardBody: { fontSize: 13, marginBottom: Spacing.md },
  cardButton: { marginTop: Spacing.sm },
  infoBox: { flexDirection: "row", gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.lg },
  infoText: { flex: 1, fontSize: 13 },
  sectionCard: { padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.md },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  emptyRow: { flexDirection: "row", gap: Spacing.md, alignItems: "center", paddingVertical: Spacing.md },
  emptyTitle: { fontSize: 14, fontWeight: "600" },
  emptySubtitle: { fontSize: 12, marginTop: 2 },
  listRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  offerCard: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  offerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  offerAction: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    alignSelf: "flex-start",
  },
  offerBrief: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  offerSelectRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  horizontalChipRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  offerChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  musicBriefBody: {
    gap: Spacing.sm,
  },
  musicBriefTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  musicBriefSection: {
    marginTop: Spacing.xs,
  },
  sharedSetCard: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  setInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    height: 40,
    paddingHorizontal: Spacing.sm,
    fontSize: 13,
  },
  sharedItemList: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  sharedItemRow: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  sharedItemTitleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  sharedItemActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    alignItems: "center",
  },
  sharedIconBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dropMarkerBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  setExportSection: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  exportLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  cultureHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  cultureChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  cultureChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginBottom: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
  },
  cultureVendorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  cultureVendorActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: 6,
  },
  cultureVendorAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  cultureVendorActionText: {
    fontSize: 11,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  modalList: {
    gap: Spacing.xs,
  },
  modalRow: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  musicLink: {
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  speechSubtitle: { fontSize: 12, marginBottom: Spacing.md },
  speechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  speechIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speechHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  speechStatusBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: 10,
  },
});
