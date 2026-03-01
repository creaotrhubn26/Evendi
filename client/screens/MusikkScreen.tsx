import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, Linking, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EvendiIcon } from '@/components/EvendiIcon';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCoupleProfile } from '@/lib/api-couples';
import { TraditionHintBanner } from '@/components/TraditionHintBanner';
import {
  getMusicData,
  updateMusicPreferences,
  MusicTimeline,
  MusicPreferences,
  MusicMatcherProfile,
  MusicRecommendation,
  MusicSet,
  MusicSetItem,
  CoupleOfferSummary,
  getMusicMatcherProfile,
  updateMusicMatcherProfile,
  getMusicMoments,
  getMusicRecommendations,
  getMusicSets,
  createMusicSet,
  addMusicSetItem,
  updateMusicSetItem,
  deleteMusicSetItem,
  reorderMusicSetItems,
  exportMusicShareLinks,
  getMusicYouTubeConnectUrl,
  disconnectMusicYouTube,
  exportMusicYouTubePlaylist,
  updateMusicVendorPermission,
  getCoupleOffers,
} from '@/lib/api-couple-data';
import { ThemedText } from '../components/ThemedText';
import { Button } from '../components/Button';
import { VendorCategoryMarketplace } from '@/components/VendorCategoryMarketplace';
import { useTheme } from '../hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { PlanningStackParamList } from '../navigation/PlanningStackNavigator';
import { getSpeeches } from '@/lib/storage';
import { Speech } from '@/lib/types';
import { showToast } from '@/lib/toast';
import { PersistentTextInput } from '@/components/PersistentTextInput';
import { MusicRecommendationCard } from '@/components/music/MusicRecommendationCard';
import { MusicYouTubePreviewModal } from '@/components/music/MusicYouTubePreviewModal';

type TabType = 'matcher' | 'set_builder' | 'export' | 'bookings' | 'timeline';
type NavigationProp = NativeStackNavigationProp<PlanningStackParamList>;

type SessionFeedback = Record<string, {
  moreLikeThis?: string[];
  tooSlow?: string[];
  tooRomantic?: string[];
  moreDhol?: boolean;
}>;

const TIMELINE_STEPS = [
  { key: 'musicianSelected', label: 'Musikk/DJ valgt', icon: 'check-circle' as const },
  { key: 'setlistDiscussed', label: 'Set-liste diskutert', icon: 'list' as const },
  { key: 'contractSigned', label: 'Kontrakt signert', icon: 'file-text' as const },
  { key: 'depositPaid', label: 'Depositum betalt', icon: 'credit-card' as const },
];

const CULTURE_OPTIONS = [
  'sikh',
  'pakistansk',
  'indisk',
  'norsk',
  'muslimsk',
  'mixed',
  'somalisk',
  'arabisk',
  'tyrkisk',
  'iransk',
  'kinesisk',
  'thai',
  'filipino',
];

const LANGUAGE_OPTIONS = [
  'hindi',
  'punjabi',
  'urdu',
  'english',
  'norwegian',
  'arabic',
  'somali',
  'farsi',
  'turkish',
  'instrumental',
];

const COUPLE_STORAGE_KEY = 'evendi_couple_session';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const videoIdFromInput = (value: string): string | null => {
  const input = value.trim();
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  try {
    const normalized = input.startsWith('http') ? input : `https://${input}`;
    const parsed = new URL(normalized);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim();
      return id || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v') || null;
    }
    return null;
  } catch {
    return null;
  }
};

const prettifyLabel = (value: string) => value.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export function MusikkScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('matcher');
  const [refreshing, setRefreshing] = useState(false);
  const [speeches, setSpeeches] = useState<Speech[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<MusicPreferences>({
    spotifyPlaylistUrl: '',
    youtubePlaylistUrl: '',
    entranceSong: '',
    firstDanceSong: '',
    lastSong: '',
    doNotPlay: '',
    additionalNotes: '',
  });
  const [savingPreferences, setSavingPreferences] = useState(false);

  const [matcherDraft, setMatcherDraft] = useState<MusicMatcherProfile | null>(null);
  const [selectedMomentKey, setSelectedMomentKey] = useState<string | null>(null);
  const [recommendationsByMoment, setRecommendationsByMoment] = useState<Record<string, MusicRecommendation[]>>({});
  const [sessionFeedback, setSessionFeedback] = useState<SessionFeedback>({});

  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [newSetTitle, setNewSetTitle] = useState('');
  const [manualSongTitle, setManualSongTitle] = useState('');
  const [manualSongArtist, setManualSongArtist] = useState('');
  const [manualSongYoutubeInput, setManualSongYoutubeInput] = useState('');

  const [shareLinksResult, setShareLinksResult] = useState<null | {
    setId: string;
    setTitle: string;
    totalLinks: number;
    links: {
      itemId: string;
      title: string;
      artist?: string | null;
      youtubeVideoId: string;
      url: string;
      momentKey?: string | null;
      dropMarkerSeconds?: number | null;
    }[];
  }>(null);
  const [latestExportJob, setLatestExportJob] = useState<null | {
    youtubePlaylistUrl?: string | null;
    exportedTrackCount: number;
    status: string;
  }>(null);

  const [offerPermissionDraft, setOfferPermissionDraft] = useState<Record<string, boolean>>({});

  const [previewVideo, setPreviewVideo] = useState<{ videoId: string; title: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadSession = async () => {
        const data = await AsyncStorage.getItem(COUPLE_STORAGE_KEY);
        if (!data) return;
        const parsed = JSON.parse(data);
        setSessionToken(parsed?.sessionToken || null);
      };
      const loadSpeeches = async () => {
        try {
          const data = await getSpeeches();
          setSpeeches(Array.isArray(data) ? data : []);
        } catch {
          setSpeeches([]);
        }
      };
      loadSession();
      loadSpeeches();
    }, [])
  );

  const { data: coupleProfile } = useQuery({
    queryKey: ['coupleProfile'],
    queryFn: async () => {
      if (!sessionToken) throw new Error('No session');
      return getCoupleProfile(sessionToken);
    },
    enabled: !!sessionToken,
  });

  const { data: musicData } = useQuery({
    queryKey: ['music-data'],
    queryFn: getMusicData,
  });

  const matcherProfileQuery = useQuery({
    queryKey: ['music-matcher-profile'],
    queryFn: getMusicMatcherProfile,
  });

  const momentsQuery = useQuery({
    queryKey: ['music-moments'],
    queryFn: getMusicMoments,
  });

  const setsQuery = useQuery({
    queryKey: ['music-sets'],
    queryFn: getMusicSets,
  });

  const offersQuery = useQuery({
    queryKey: ['couple-offers'],
    queryFn: getCoupleOffers,
  });

  const timeline: MusicTimeline = musicData?.timeline ?? {
    musicianSelected: false,
    setlistDiscussed: false,
    contractSigned: false,
    depositPaid: false,
    budget: 0,
  };

  const musicSets = useMemo<MusicSet[]>(() => setsQuery.data ?? [], [setsQuery.data]);
  const selectedSet = useMemo(
    () => musicSets.find((set) => set.id === selectedSetId) || null,
    [musicSets, selectedSetId]
  );

  const acceptedOffers = useMemo(
    () => (offersQuery.data || []).filter((offer: CoupleOfferSummary) => offer.status === 'accepted'),
    [offersQuery.data]
  );

  useEffect(() => {
    if (!musicData?.preferences) return;
    setPreferences({
      spotifyPlaylistUrl: musicData.preferences.spotifyPlaylistUrl || '',
      youtubePlaylistUrl: musicData.preferences.youtubePlaylistUrl || '',
      entranceSong: musicData.preferences.entranceSong || '',
      firstDanceSong: musicData.preferences.firstDanceSong || '',
      lastSong: musicData.preferences.lastSong || '',
      doNotPlay: musicData.preferences.doNotPlay || '',
      additionalNotes: musicData.preferences.additionalNotes || '',
    });
  }, [musicData?.preferences]);

  useEffect(() => {
    if (!matcherProfileQuery.data) return;
    setMatcherDraft((current) =>
      current
        ? current
        : {
            preferredCultures: matcherProfileQuery.data.preferredCultures || [],
            preferredLanguages: matcherProfileQuery.data.preferredLanguages || [],
            vibeLevel: matcherProfileQuery.data.vibeLevel ?? 50,
            energyLevel: matcherProfileQuery.data.energyLevel ?? 50,
            cleanLyricsOnly: matcherProfileQuery.data.cleanLyricsOnly ?? true,
            selectedMoments: matcherProfileQuery.data.selectedMoments || [],
          }
    );
  }, [matcherProfileQuery.data]);

  useEffect(() => {
    if (musicSets.length === 0) {
      setSelectedSetId(null);
      return;
    }
    setSelectedSetId((current) => current || musicSets[0].id);
  }, [musicSets]);

  useEffect(() => {
    if (!matcherDraft) return;
    if (selectedMomentKey && matcherDraft.selectedMoments.includes(selectedMomentKey)) return;
    setSelectedMomentKey(matcherDraft.selectedMoments[0] || null);
  }, [matcherDraft, selectedMomentKey]);

  const updatePreferencesMutation = useMutation({
    mutationFn: updateMusicPreferences,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['music-data'] }),
  });

  const saveMatcherMutation = useMutation({
    mutationFn: updateMusicMatcherProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['music-matcher-profile'] });
      setMatcherDraft({
        preferredCultures: data.preferredCultures || [],
        preferredLanguages: data.preferredLanguages || [],
        vibeLevel: data.vibeLevel ?? 50,
        energyLevel: data.energyLevel ?? 50,
        cleanLyricsOnly: data.cleanLyricsOnly ?? true,
        selectedMoments: data.selectedMoments || [],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const recommendationsMutation = useMutation({
    mutationFn: getMusicRecommendations,
    onSuccess: (data) => {
      setRecommendationsByMoment(data.recommendations || {});
    },
  });

  const createSetMutation = useMutation({
    mutationFn: createMusicSet,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['music-sets'] });
      setSelectedSetId(created.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const addSetItemMutation = useMutation({
    mutationFn: ({ setId, data }: { setId: string; data: Partial<MusicSetItem> }) => addMusicSetItem(setId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['music-sets'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const updateSetItemMutation = useMutation({
    mutationFn: ({ setId, itemId, data }: { setId: string; itemId: string; data: Partial<MusicSetItem> }) =>
      updateMusicSetItem(setId, itemId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['music-sets'] }),
  });

  const deleteSetItemMutation = useMutation({
    mutationFn: ({ setId, itemId }: { setId: string; itemId: string }) => deleteMusicSetItem(setId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['music-sets'] }),
  });

  const reorderSetItemsMutation = useMutation({
    mutationFn: ({ setId, orderedItemIds }: { setId: string; orderedItemIds: string[] }) => reorderMusicSetItems(setId, orderedItemIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['music-sets'] }),
  });

  const shareLinksMutation = useMutation({
    mutationFn: exportMusicShareLinks,
    onSuccess: (result) => setShareLinksResult(result),
  });

  const disconnectYoutubeMutation = useMutation({
    mutationFn: disconnectMusicYouTube,
  });

  const youtubeExportMutation = useMutation({
    mutationFn: exportMusicYouTubePlaylist,
    onSuccess: (job) => {
      setLatestExportJob({
        youtubePlaylistUrl: job.youtubePlaylistUrl,
        exportedTrackCount: job.exportedTrackCount,
        status: job.status,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const updateOfferPermissionMutation = useMutation({
    mutationFn: ({ offerId, value }: { offerId: string; value: boolean }) => updateMusicVendorPermission(offerId, value),
    onSuccess: (_, variables) => {
      setOfferPermissionDraft((prev) => ({ ...prev, [variables.offerId]: variables.value }));
    },
  });

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  };

  const isValidPlaylistUrl = useCallback((value: string, type: 'spotify' | 'youtube') => {
    const normalized = normalizeUrl(value);
    if (!normalized) return true;
    try {
      const parsed = new URL(normalized);
      if (type === 'spotify') {
        return parsed.hostname.includes('spotify.com');
      }
      return parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be');
    } catch {
      return false;
    }
  }, []);

  const spotifyError = useMemo(() => {
    if (!preferences.spotifyPlaylistUrl) return '';
    return isValidPlaylistUrl(preferences.spotifyPlaylistUrl, 'spotify') ? '' : 'Ugyldig Spotify-lenke';
  }, [preferences.spotifyPlaylistUrl, isValidPlaylistUrl]);

  const youtubeError = useMemo(() => {
    if (!preferences.youtubePlaylistUrl) return '';
    return isValidPlaylistUrl(preferences.youtubePlaylistUrl, 'youtube') ? '' : 'Ugyldig YouTube-lenke';
  }, [preferences.youtubePlaylistUrl, isValidPlaylistUrl]);

  const handleSavePreferences = async () => {
    if (spotifyError || youtubeError) {
      showToast('Sjekk Spotify- og YouTube-lenkene før du lagrer.');
      return;
    }
    setSavingPreferences(true);
    try {
      await updatePreferencesMutation.mutateAsync({
        spotifyPlaylistUrl: preferences.spotifyPlaylistUrl?.trim() || null,
        youtubePlaylistUrl: preferences.youtubePlaylistUrl?.trim() || null,
        entranceSong: preferences.entranceSong?.trim() || null,
        firstDanceSong: preferences.firstDanceSong?.trim() || null,
        lastSong: preferences.lastSong?.trim() || null,
        doNotPlay: preferences.doNotPlay?.trim() || null,
        additionalNotes: preferences.additionalNotes?.trim() || null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showToast('Kunne ikke lagre musikkønsker');
    } finally {
      setSavingPreferences(false);
    }
  };

  const openPlaylistLink = async (url: string) => {
    if (!url.trim()) return;
    const finalUrl = normalizeUrl(url);
    try {
      const canOpen = await Linking.canOpenURL(finalUrl);
      if (!canOpen) {
        showToast('Kan ikke åpne denne lenken.');
        return;
      }
      await Linking.openURL(finalUrl);
    } catch {
      showToast('Kunne ikke åpne lenken.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['music-data'] }),
      queryClient.invalidateQueries({ queryKey: ['music-matcher-profile'] }),
      queryClient.invalidateQueries({ queryKey: ['music-moments'] }),
      queryClient.invalidateQueries({ queryKey: ['music-sets'] }),
      queryClient.invalidateQueries({ queryKey: ['couple-offers'] }),
    ]);
    setRefreshing(false);
  };

  const toggleArrayValue = (items: string[], value: string) => {
    if (items.includes(value)) return items.filter((item) => item !== value);
    return [...items, value];
  };

  const toggleMomentSelection = (momentKey: string) => {
    setMatcherDraft((current) => {
      if (!current) return current;
      const nextMoments = toggleArrayValue(current.selectedMoments || [], momentKey);
      return {
        ...current,
        selectedMoments: nextMoments,
      };
    });
  };

  const runRecommendations = async () => {
    if (!matcherDraft) return;
    if ((matcherDraft.selectedMoments || []).length === 0) {
      showToast('Velg minst ett moment først.');
      return;
    }
    try {
      await recommendationsMutation.mutateAsync({
        moments: matcherDraft.selectedMoments,
        limitPerMoment: 12,
        feedbackByMoment: sessionFeedback,
      });
    } catch {
      showToast('Kunne ikke hente anbefalinger nå.');
    }
  };

  const saveMatcherProfile = async () => {
    if (!matcherDraft) return;
    try {
      await saveMatcherMutation.mutateAsync(matcherDraft);
    } catch {
      showToast('Kunne ikke lagre matcher-profil');
    }
  };

  const handleFeedback = (kind: 'more_like_this' | 'too_slow' | 'too_romantic' | 'more_dhol', recommendation: MusicRecommendation) => {
    setSessionFeedback((current) => {
      const base = current[recommendation.momentKey] || {};
      const update = { ...base };
      if (kind === 'more_like_this') {
        update.moreLikeThis = Array.from(new Set([...(update.moreLikeThis || []), recommendation.youtubeVideoId]));
      }
      if (kind === 'too_slow') {
        update.tooSlow = Array.from(new Set([...(update.tooSlow || []), recommendation.youtubeVideoId]));
      }
      if (kind === 'too_romantic') {
        update.tooRomantic = Array.from(new Set([...(update.tooRomantic || []), recommendation.youtubeVideoId]));
      }
      if (kind === 'more_dhol') {
        update.moreDhol = true;
      }
      return {
        ...current,
        [recommendation.momentKey]: update,
      };
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const ensureTargetSetId = async () => {
    if (selectedSetId) return selectedSetId;
    if (musicSets.length > 0) {
      setSelectedSetId(musicSets[0].id);
      return musicSets[0].id;
    }
    const created = await createSetMutation.mutateAsync({
      title: 'Main Wedding Set',
      description: 'Generated from Music Matcher',
      visibility: 'private',
    });
    return created.id;
  };

  const addRecommendationToSet = async (recommendation: MusicRecommendation) => {
    try {
      const setId = await ensureTargetSetId();
      await addSetItemMutation.mutateAsync({
        setId,
        data: {
          songId: recommendation.songId,
          youtubeVideoId: recommendation.youtubeVideoId,
          title: recommendation.title,
          artist: recommendation.artist,
          momentKey: recommendation.momentKey,
        },
      });
      showToast('Lagt til i set');
    } catch {
      showToast('Kunne ikke legge til låt i set');
    }
  };

  const createSetFromInput = async () => {
    const title = newSetTitle.trim();
    if (!title) {
      showToast('Skriv et navn for set-listen.');
      return;
    }
    try {
      await createSetMutation.mutateAsync({ title, visibility: 'private' });
      setNewSetTitle('');
    } catch {
      showToast('Kunne ikke opprette set');
    }
  };

  const addManualSetItem = async () => {
    if (!selectedSet) {
      showToast('Velg eller opprett en set-liste først.');
      return;
    }
    const videoId = videoIdFromInput(manualSongYoutubeInput);
    if (!videoId) {
      showToast('Legg inn gyldig YouTube-lenke eller video-id.');
      return;
    }
    const title = manualSongTitle.trim();
    if (!title) {
      showToast('Legg inn låttittel.');
      return;
    }
    try {
      await addSetItemMutation.mutateAsync({
        setId: selectedSet.id,
        data: {
          youtubeVideoId: videoId,
          title,
          artist: manualSongArtist.trim() || null,
          momentKey: selectedMomentKey,
        },
      });
      setManualSongTitle('');
      setManualSongArtist('');
      setManualSongYoutubeInput('');
    } catch {
      showToast('Kunne ikke legge til manuell låt.');
    }
  };

  const moveSetItem = async (itemId: string, direction: -1 | 1) => {
    if (!selectedSet) return;
    const ordered = [...selectedSet.items].sort((a, b) => a.position - b.position);
    const index = ordered.findIndex((item) => item.id === itemId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;

    const reordered = [...ordered];
    const temp = reordered[index];
    reordered[index] = reordered[nextIndex];
    reordered[nextIndex] = temp;

    try {
      await reorderSetItemsMutation.mutateAsync({
        setId: selectedSet.id,
        orderedItemIds: reordered.map((item) => item.id),
      });
    } catch {
      showToast('Kunne ikke endre rekkefølge.');
    }
  };

  const updateDropMarker = async (item: MusicSetItem, nextValue: number | null) => {
    if (!selectedSet) return;
    try {
      await updateSetItemMutation.mutateAsync({
        setId: selectedSet.id,
        itemId: item.id,
        data: { dropMarkerSeconds: nextValue },
      });
    } catch {
      showToast('Kunne ikke oppdatere drop marker.');
    }
  };

  const removeSetItem = async (itemId: string) => {
    if (!selectedSet) return;
    try {
      await deleteSetItemMutation.mutateAsync({ setId: selectedSet.id, itemId });
    } catch {
      showToast('Kunne ikke fjerne låten.');
    }
  };

  const connectYouTube = async () => {
    try {
      const result = await getMusicYouTubeConnectUrl();
      const canOpen = await Linking.canOpenURL(result.url);
      if (!canOpen) {
        showToast('Kunne ikke åpne YouTube OAuth-lenke.');
        return;
      }
      await Linking.openURL(result.url);
    } catch {
      showToast('Kunne ikke starte YouTube-tilkobling');
    }
  };

  const exportShareLinks = async () => {
    if (!selectedSetId) {
      showToast('Velg en set-liste først.');
      return;
    }
    try {
      await shareLinksMutation.mutateAsync(selectedSetId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showToast('Kunne ikke eksportere lenkeliste');
    }
  };

  const exportYouTubePlaylist = async () => {
    if (!selectedSetId) {
      showToast('Velg en set-liste først.');
      return;
    }
    const selectedSetName = musicSets.find((set) => set.id === selectedSetId)?.title || 'Evendi Music Set';
    try {
      await youtubeExportMutation.mutateAsync({
        setId: selectedSetId,
        title: selectedSetName,
        privacyStatus: 'unlisted',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kunne ikke eksportere YouTube-playlist';
      showToast(message);
    }
  };

  const disconnectYouTube = async () => {
    try {
      await disconnectYoutubeMutation.mutateAsync();
      showToast('YouTube er koblet fra.');
    } catch {
      showToast('Kunne ikke koble fra YouTube.');
    }
  };

  const toggleVendorPermission = async (offerId: string) => {
    const nextValue = !offerPermissionDraft[offerId];
    try {
      await updateOfferPermissionMutation.mutateAsync({ offerId, value: nextValue });
      showToast(nextValue ? 'Vendor-eksport tillatt for tilbudet.' : 'Vendor-samtykke trukket tilbake.');
    } catch {
      showToast('Kunne ikke oppdatere samtykke nå.');
    }
  };

  const openYouTubeLink = async (videoId: string) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        showToast('Kunne ikke åpne YouTube-lenke.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      showToast('Kunne ikke åpne YouTube-lenke.');
    }
  };

  const tabButton = (tab: TabType, label: string) => (
    <Pressable
      key={tab}
      style={[styles.tab, activeTab === tab && styles.activeTab]}
      onPress={() => {
        setActiveTab(tab);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <ThemedText style={[styles.tabText, activeTab === tab && { color: Colors.dark.accent }]}>
        {label}
      </ThemedText>
      {activeTab === tab && <View style={[styles.tabIndicator, { backgroundColor: Colors.dark.accent }]} />}
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <VendorCategoryMarketplace
          category="music"
          categoryName="Musikk & DJ"
          icon="music"
          subtitle="Band, DJ og musikere for arrangementet"
          selectedTraditions={coupleProfile?.selectedTraditions}
        />

        {(coupleProfile?.selectedTraditions?.length ?? 0) > 0 && (
          <TraditionHintBanner
            traditions={coupleProfile?.selectedTraditions || []}
            category="music"
          />
        )}

        <View style={[styles.tabBar, { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}> 
          {tabButton('matcher', 'Matcher')}
          {tabButton('set_builder', 'Set Builder')}
          {tabButton('export', 'Eksport')}
          {tabButton('bookings', 'Bookinger')}
          {tabButton('timeline', 'Tidslinje')}
        </View>

        {activeTab === 'matcher' && (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
              <View style={styles.sectionHeadRow}>
                <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Music Matcher-profil</ThemedText>
                {matcherProfileQuery.isLoading && <ActivityIndicator size="small" color={theme.accent} />}
              </View>

              {!matcherDraft ? (
                <ThemedText style={[styles.helperText, { color: theme.textMuted }]}>Laster matcher-profil...</ThemedText>
              ) : (
                <>
                  <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Kulturpakker</ThemedText>
                  <View style={styles.chipWrap}>
                    {CULTURE_OPTIONS.map((culture) => {
                      const active = matcherDraft.preferredCultures.includes(culture);
                      return (
                        <Pressable
                          key={culture}
                          onPress={() =>
                            setMatcherDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    preferredCultures: toggleArrayValue(current.preferredCultures, culture),
                                  }
                                : current
                            )
                          }
                          style={[
                            styles.chip,
                            {
                              borderColor: active ? theme.accent : theme.border,
                              backgroundColor: active ? `${theme.accent}22` : theme.backgroundSecondary,
                            },
                          ]}
                        >
                          <ThemedText style={{ color: active ? theme.accent : theme.textSecondary, fontSize: 11, fontWeight: '600' }}>
                            {prettifyLabel(culture)}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Språkpreferanse</ThemedText>
                  <View style={styles.chipWrap}>
                    {LANGUAGE_OPTIONS.map((language) => {
                      const active = matcherDraft.preferredLanguages.includes(language);
                      return (
                        <Pressable
                          key={language}
                          onPress={() =>
                            setMatcherDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    preferredLanguages: toggleArrayValue(current.preferredLanguages, language),
                                  }
                                : current
                            )
                          }
                          style={[
                            styles.chip,
                            {
                              borderColor: active ? theme.accent : theme.border,
                              backgroundColor: active ? `${theme.accent}22` : theme.backgroundSecondary,
                            },
                          ]}
                        >
                          <ThemedText style={{ color: active ? theme.accent : theme.textSecondary, fontSize: 11, fontWeight: '600' }}>
                            {prettifyLabel(language)}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.sliderCard}>
                    <View style={styles.sliderHeader}>
                      <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Vibe (tradisjonell ↔ moderne)</ThemedText>
                      <ThemedText style={[styles.sliderValue, { color: theme.accent }]}>{matcherDraft.vibeLevel}</ThemedText>
                    </View>
                    <View style={styles.sliderRow}>
                      <Pressable
                        onPress={() =>
                          setMatcherDraft((current) =>
                            current ? { ...current, vibeLevel: clamp(current.vibeLevel - 5, 0, 100) } : current
                          )
                        }
                        style={[styles.sliderIconBtn, { borderColor: theme.border }]}
                      >
                        <EvendiIcon name="minus" size={14} color={theme.textSecondary} />
                      </Pressable>
                      <View style={[styles.sliderTrack, { backgroundColor: theme.backgroundSecondary }]}> 
                        <View style={[styles.sliderFill, { width: `${matcherDraft.vibeLevel}%`, backgroundColor: theme.accent }]} />
                      </View>
                      <Pressable
                        onPress={() =>
                          setMatcherDraft((current) =>
                            current ? { ...current, vibeLevel: clamp(current.vibeLevel + 5, 0, 100) } : current
                          )
                        }
                        style={[styles.sliderIconBtn, { borderColor: theme.border }]}
                      >
                        <EvendiIcon name="plus" size={14} color={theme.textSecondary} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.sliderCard}>
                    <View style={styles.sliderHeader}>
                      <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Energi (lav ↔ høy)</ThemedText>
                      <ThemedText style={[styles.sliderValue, { color: theme.accent }]}>{matcherDraft.energyLevel}</ThemedText>
                    </View>
                    <View style={styles.sliderRow}>
                      <Pressable
                        onPress={() =>
                          setMatcherDraft((current) =>
                            current ? { ...current, energyLevel: clamp(current.energyLevel - 5, 0, 100) } : current
                          )
                        }
                        style={[styles.sliderIconBtn, { borderColor: theme.border }]}
                      >
                        <EvendiIcon name="minus" size={14} color={theme.textSecondary} />
                      </Pressable>
                      <View style={[styles.sliderTrack, { backgroundColor: theme.backgroundSecondary }]}> 
                        <View style={[styles.sliderFill, { width: `${matcherDraft.energyLevel}%`, backgroundColor: theme.accent }]} />
                      </View>
                      <Pressable
                        onPress={() =>
                          setMatcherDraft((current) =>
                            current ? { ...current, energyLevel: clamp(current.energyLevel + 5, 0, 100) } : current
                          )
                        }
                        style={[styles.sliderIconBtn, { borderColor: theme.border }]}
                      >
                        <EvendiIcon name="plus" size={14} color={theme.textSecondary} />
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    onPress={() =>
                      setMatcherDraft((current) =>
                        current
                          ? { ...current, cleanLyricsOnly: !current.cleanLyricsOnly }
                          : current
                      )
                    }
                    style={[styles.toggleRow, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
                  >
                    <View>
                      <ThemedText style={[styles.toggleTitle, { color: theme.text }]}>Clean lyrics / familievennlig</ThemedText>
                      <ThemedText style={[styles.toggleSubtitle, { color: theme.textMuted }]}>Filtrer bort explicit tracks</ThemedText>
                    </View>
                    <View style={[styles.togglePill, { backgroundColor: matcherDraft.cleanLyricsOnly ? theme.success : theme.textMuted }]}>
                      <ThemedText style={styles.togglePillText}>{matcherDraft.cleanLyricsOnly ? 'ON' : 'OFF'}</ThemedText>
                    </View>
                  </Pressable>

                  <View style={styles.sectionHeadRow}>
                    <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Event moments</ThemedText>
                    <ThemedText style={[styles.helperText, { color: theme.textMuted }]}>
                      {matcherDraft.selectedMoments.length} valgt
                    </ThemedText>
                  </View>

                  <View style={styles.chipWrap}>
                    {(momentsQuery.data || []).map((moment) => {
                      const active = matcherDraft.selectedMoments.includes(moment.key);
                      return (
                        <Pressable
                          key={moment.id}
                          onPress={() => toggleMomentSelection(moment.key)}
                          style={[
                            styles.chip,
                            {
                              borderColor: active ? theme.accent : theme.border,
                              backgroundColor: active ? `${theme.accent}22` : theme.backgroundSecondary,
                            },
                          ]}
                        >
                          <ThemedText style={{ color: active ? theme.accent : theme.textSecondary, fontSize: 11, fontWeight: '600' }}>
                            {moment.title}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.actionRow}>
                    <Button onPress={saveMatcherProfile} style={styles.inlineButton}>
                      {saveMatcherMutation.isPending ? 'Lagrer...' : 'Lagre profil'}
                    </Button>
                    <Button onPress={runRecommendations} style={styles.inlineButton}>
                      {recommendationsMutation.isPending ? 'Henter...' : 'Hent anbefalinger'}
                    </Button>
                  </View>
                </>
              )}
            </View>

            <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
              <View style={styles.sectionHeadRow}>
                <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Anbefalinger per moment</ThemedText>
                {recommendationsMutation.isPending && <ActivityIndicator size="small" color={theme.accent} />}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                {(matcherDraft?.selectedMoments || []).map((momentKey) => {
                  const active = selectedMomentKey === momentKey;
                  return (
                    <Pressable
                      key={momentKey}
                      onPress={() => setSelectedMomentKey(momentKey)}
                      style={[
                        styles.offerChip,
                        {
                          borderColor: active ? theme.accent : theme.border,
                          backgroundColor: active ? theme.accent : theme.backgroundSecondary,
                        },
                      ]}
                    >
                      <ThemedText style={{ color: active ? theme.buttonText : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                        {prettifyLabel(momentKey)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {selectedMomentKey && (recommendationsByMoment[selectedMomentKey] || []).length > 0 ? (
                <View style={styles.recommendationsList}>
                  {(recommendationsByMoment[selectedMomentKey] || []).map((recommendation) => (
                    <MusicRecommendationCard
                      key={`${recommendation.momentKey}-${recommendation.youtubeVideoId}`}
                      recommendation={recommendation}
                      onAdd={addRecommendationToSet}
                      onFeedback={handleFeedback}
                      onOpenYouTube={(videoId) => setPreviewVideo({ videoId, title: recommendation.title })}
                      borderColor={theme.border}
                      backgroundColor={theme.backgroundSecondary}
                      textColor={theme.text}
                      subTextColor={theme.textSecondary}
                      accentColor={theme.accent}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <EvendiIcon name="music" size={18} color={theme.textMuted} />
                  <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>Hent anbefalinger for å se 10-20 låter per moment.</ThemedText>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {activeTab === 'set_builder' && (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Set Builder</ThemedText>
              <ThemedText style={[styles.helperText, { color: theme.textMuted }]}>Bygg rekkefølge, marker DROP HERE og rediger låter.</ThemedText>

              <View style={styles.createSetRow}>
                <TextInput
                  value={newSetTitle}
                  onChangeText={setNewSetTitle}
                  placeholder="Nytt set-navn"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                />
                <Button onPress={createSetFromInput} style={styles.createSetButton}>
                  Opprett
                </Button>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                {musicSets.map((set) => {
                  const active = selectedSetId === set.id;
                  return (
                    <Pressable
                      key={set.id}
                      onPress={() => setSelectedSetId(set.id)}
                      style={[
                        styles.offerChip,
                        {
                          borderColor: active ? theme.accent : theme.border,
                          backgroundColor: active ? theme.accent : theme.backgroundSecondary,
                        },
                      ]}
                    >
                      <ThemedText style={{ color: active ? theme.buttonText : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                        {set.title}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.manualAddCard}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Legg til manuell låt</ThemedText>
                <TextInput
                  value={manualSongTitle}
                  onChangeText={setManualSongTitle}
                  placeholder="Låttittel"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                />
                <TextInput
                  value={manualSongArtist}
                  onChangeText={setManualSongArtist}
                  placeholder="Artist (valgfritt)"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                />
                <TextInput
                  value={manualSongYoutubeInput}
                  onChangeText={setManualSongYoutubeInput}
                  placeholder="YouTube URL eller video-id"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                />
                <Button onPress={addManualSetItem}>Legg til i set</Button>
              </View>

              {!selectedSet ? (
                <View style={styles.emptyState}>
                  <EvendiIcon name="list" size={18} color={theme.textMuted} />
                  <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>Ingen set-liste valgt enda.</ThemedText>
                </View>
              ) : (
                <View style={styles.setItemList}>
                  {[...selectedSet.items]
                    .sort((a, b) => a.position - b.position)
                    .map((item, index, arr) => (
                      <View
                        key={item.id}
                        style={[styles.setItemRow, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
                      >
                        <View style={styles.setItemTitleRow}>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.setItemTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</ThemedText>
                            <ThemedText style={[styles.setItemSub, { color: theme.textSecondary }]} numberOfLines={1}>
                              {item.artist || 'Ukjent artist'}
                              {item.momentKey ? ` • ${prettifyLabel(item.momentKey)}` : ''}
                            </ThemedText>
                          </View>
                          <ThemedText style={[styles.itemIndex, { color: theme.textMuted }]}>{index + 1}/{arr.length}</ThemedText>
                        </View>

                        <View style={styles.setActionsRow}>
                          <Pressable
                            onPress={() => moveSetItem(item.id, -1)}
                            disabled={index === 0}
                            style={[styles.smallIconBtn, { borderColor: theme.border, opacity: index === 0 ? 0.4 : 1 }]}
                          >
                            <EvendiIcon name="chevron-up" size={14} color={theme.textSecondary} />
                          </Pressable>
                          <Pressable
                            onPress={() => moveSetItem(item.id, 1)}
                            disabled={index === arr.length - 1}
                            style={[styles.smallIconBtn, { borderColor: theme.border, opacity: index === arr.length - 1 ? 0.4 : 1 }]}
                          >
                            <EvendiIcon name="chevron-down" size={14} color={theme.textSecondary} />
                          </Pressable>
                          <Pressable
                            onPress={() => updateDropMarker(item, item.dropMarkerSeconds ? Math.max(0, item.dropMarkerSeconds - 5) : 0)}
                            style={[styles.smallIconBtn, { borderColor: theme.border }]}
                          >
                            <EvendiIcon name="minus" size={14} color={theme.textSecondary} />
                          </Pressable>
                          <Pressable
                            onPress={() => updateDropMarker(item, item.dropMarkerSeconds ? item.dropMarkerSeconds + 5 : 30)}
                            style={[styles.smallIconBtn, { borderColor: theme.border }]}
                          >
                            <EvendiIcon name="plus" size={14} color={theme.textSecondary} />
                          </Pressable>
                          <Pressable
                            onPress={() => updateDropMarker(item, item.dropMarkerSeconds ? null : 45)}
                            style={[styles.dropBtn, { borderColor: theme.accent, backgroundColor: `${theme.accent}20` }]}
                          >
                            <ThemedText style={{ color: theme.accent, fontSize: 11, fontWeight: '700' }}>
                              {item.dropMarkerSeconds ? `DROP ${item.dropMarkerSeconds}s` : 'DROP HERE'}
                            </ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() => removeSetItem(item.id)}
                            style={[styles.smallIconBtn, { borderColor: theme.border }]}
                          >
                            <EvendiIcon name="trash" size={14} color={theme.error} />
                          </Pressable>
                        </View>
                      </View>
                    ))}

                  {selectedSet.items.length === 0 && (
                    <View style={styles.emptyState}>
                      <EvendiIcon name="music" size={18} color={theme.textMuted} />
                      <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>Ingen låter i dette settet ennå.</ThemedText>
                    </View>
                  )}
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {activeTab === 'export' && (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Eksport</ThemedText>
              <ThemedText style={[styles.helperText, { color: theme.textMuted }]}>Del lenker eller opprett YouTube-playlist (unlisted).</ThemedText>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                {musicSets.map((set) => {
                  const active = selectedSetId === set.id;
                  return (
                    <Pressable
                      key={set.id}
                      onPress={() => setSelectedSetId(set.id)}
                      style={[
                        styles.offerChip,
                        {
                          borderColor: active ? theme.accent : theme.border,
                          backgroundColor: active ? theme.accent : theme.backgroundSecondary,
                        },
                      ]}
                    >
                      <ThemedText style={{ color: active ? theme.buttonText : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                        {set.title}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.actionRow}>
                <Button onPress={exportShareLinks} style={styles.inlineButton}>
                  {shareLinksMutation.isPending ? 'Eksporterer...' : 'Share link list'}
                </Button>
                <Button onPress={connectYouTube} style={styles.inlineButton}>
                  Connect YouTube
                </Button>
              </View>

              <View style={styles.actionRow}>
                <Button onPress={disconnectYouTube} style={styles.inlineButton}>
                  {disconnectYoutubeMutation.isPending ? 'Kobler fra...' : 'Disconnect'}
                </Button>
                <Button onPress={exportYouTubePlaylist} style={styles.inlineButton}>
                  {youtubeExportMutation.isPending ? 'Eksporterer...' : 'Create playlist'}
                </Button>
              </View>

              {latestExportJob?.youtubePlaylistUrl ? (
                <Pressable
                  onPress={() => openPlaylistLink(latestExportJob.youtubePlaylistUrl || '')}
                  style={[styles.exportResultCard, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
                >
                  <ThemedText style={[styles.exportResultTitle, { color: theme.text }]}>Siste YouTube-eksport</ThemedText>
                  <ThemedText style={[styles.exportResultText, { color: theme.textSecondary }]}>Status: {latestExportJob.status}</ThemedText>
                  <ThemedText style={[styles.exportResultText, { color: theme.textSecondary }]}>Låter: {latestExportJob.exportedTrackCount}</ThemedText>
                  <ThemedText style={[styles.exportResultLink, { color: theme.accent }]} numberOfLines={1}>
                    {latestExportJob.youtubePlaylistUrl}
                  </ThemedText>
                </Pressable>
              ) : null}

              {shareLinksResult ? (
                <View style={[styles.exportResultCard, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}> 
                  <ThemedText style={[styles.exportResultTitle, { color: theme.text }]}>
                    Delbar lenkeliste ({shareLinksResult.totalLinks})
                  </ThemedText>
                  {shareLinksResult.links.map((link) => (
                    <Pressable key={link.itemId} onPress={() => openPlaylistLink(link.url)} style={styles.linkRow}>
                      <EvendiIcon name="external-link" size={14} color={theme.accent} />
                      <ThemedText style={[styles.linkText, { color: theme.accent }]} numberOfLines={1}>
                        {link.title} - {link.url}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <View style={[styles.permissionCard, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}> 
                <ThemedText style={[styles.exportResultTitle, { color: theme.text }]}>Samtykke for vendor-eksport</ThemedText>
                <ThemedText style={[styles.helperText, { color: theme.textMuted }]}>Aktiver per akseptert tilbud.</ThemedText>
                {acceptedOffers.length > 0 ? (
                  <Button
                    onPress={() => navigation.navigate('CoupleOffers')}
                    style={styles.inlineButton}
                  >
                    Åpne tilbud
                  </Button>
                ) : null}

                {acceptedOffers.length === 0 ? (
                  <ThemedText style={[styles.helperText, { color: theme.textMuted }]}>Ingen aksepterte tilbud funnet.</ThemedText>
                ) : (
                  acceptedOffers.map((offer) => {
                    const active = !!offerPermissionDraft[offer.id];
                    return (
                      <View key={offer.id} style={styles.permissionRow}>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={[styles.permissionTitle, { color: theme.text }]}>{offer.title}</ThemedText>
                          <ThemedText style={[styles.permissionSub, { color: theme.textSecondary }]}>
                            {offer.vendor?.businessName || 'Leverandør'}
                          </ThemedText>
                        </View>
                        <Pressable
                          onPress={() => toggleVendorPermission(offer.id)}
                          style={[
                            styles.permissionToggle,
                            {
                              borderColor: active ? theme.success : theme.border,
                              backgroundColor: active ? `${theme.success}22` : theme.backgroundDefault,
                            },
                          ]}
                        >
                          <ThemedText style={{ color: active ? theme.success : theme.textSecondary, fontSize: 11, fontWeight: '700' }}>
                            {active ? 'Tillatt' : 'Ikke tillatt'}
                          </ThemedText>
                        </Pressable>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </Animated.View>
        )}

        {activeTab === 'bookings' && (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Spillelister & ønskelåter</ThemedText>
              <ThemedText style={[styles.helperText, { color: theme.textMuted }]}>Legg inn lenker og spesielle sanger som inngang og første dans.</ThemedText>

              <View style={styles.prefField}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Spotify spilleliste</ThemedText>
                <View style={styles.prefRow}>
                  <PersistentTextInput
                    draftKey="MusikkScreen-input-2"
                    style={[styles.prefInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                    placeholder="https://open.spotify.com/..."
                    placeholderTextColor={theme.textMuted}
                    value={preferences.spotifyPlaylistUrl || ''}
                    onChangeText={(value) => setPreferences((prev) => ({ ...prev, spotifyPlaylistUrl: value }))}
                    onBlur={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        spotifyPlaylistUrl: normalizeUrl(prev.spotifyPlaylistUrl || ''),
                      }))
                    }
                  />
                  <Pressable
                    onPress={() => openPlaylistLink(preferences.spotifyPlaylistUrl || '')}
                    style={[styles.prefLinkBtn, { borderColor: theme.border }]}
                  >
                    <EvendiIcon name="external-link" size={16} color={theme.textSecondary} />
                  </Pressable>
                </View>
                {spotifyError ? <ThemedText style={styles.prefError}>{spotifyError}</ThemedText> : null}
              </View>

              <View style={styles.prefField}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>YouTube spilleliste</ThemedText>
                <View style={styles.prefRow}>
                  <PersistentTextInput
                    draftKey="MusikkScreen-input-3"
                    style={[styles.prefInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                    placeholder="https://youtube.com/playlist?..."
                    placeholderTextColor={theme.textMuted}
                    value={preferences.youtubePlaylistUrl || ''}
                    onChangeText={(value) => setPreferences((prev) => ({ ...prev, youtubePlaylistUrl: value }))}
                    onBlur={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        youtubePlaylistUrl: normalizeUrl(prev.youtubePlaylistUrl || ''),
                      }))
                    }
                  />
                  <Pressable
                    onPress={() => openPlaylistLink(preferences.youtubePlaylistUrl || '')}
                    style={[styles.prefLinkBtn, { borderColor: theme.border }]}
                  >
                    <EvendiIcon name="external-link" size={16} color={theme.textSecondary} />
                  </Pressable>
                </View>
                {youtubeError ? <ThemedText style={styles.prefError}>{youtubeError}</ThemedText> : null}
              </View>

              <View style={styles.prefField}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Inngangssang</ThemedText>
                <PersistentTextInput
                  draftKey="MusikkScreen-input-4"
                  style={[styles.prefInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  placeholder="Artist - Sang"
                  placeholderTextColor={theme.textMuted}
                  value={preferences.entranceSong || ''}
                  onChangeText={(value) => setPreferences((prev) => ({ ...prev, entranceSong: value }))}
                />
              </View>

              <View style={styles.prefField}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Første dans</ThemedText>
                <PersistentTextInput
                  draftKey="MusikkScreen-input-5"
                  style={[styles.prefInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  placeholder="Artist - Sang"
                  placeholderTextColor={theme.textMuted}
                  value={preferences.firstDanceSong || ''}
                  onChangeText={(value) => setPreferences((prev) => ({ ...prev, firstDanceSong: value }))}
                />
              </View>

              <View style={styles.prefField}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Siste sang</ThemedText>
                <PersistentTextInput
                  draftKey="MusikkScreen-input-6"
                  style={[styles.prefInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  placeholder="Artist - Sang"
                  placeholderTextColor={theme.textMuted}
                  value={preferences.lastSong || ''}
                  onChangeText={(value) => setPreferences((prev) => ({ ...prev, lastSong: value }))}
                />
              </View>

              <View style={styles.prefField}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Ikke spill</ThemedText>
                <PersistentTextInput
                  draftKey="MusikkScreen-input-7"
                  style={[styles.prefInput, styles.prefNotes, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  placeholder="Sanger eller sjangre som må unngås"
                  placeholderTextColor={theme.textMuted}
                  value={preferences.doNotPlay || ''}
                  onChangeText={(value) => setPreferences((prev) => ({ ...prev, doNotPlay: value }))}
                  multiline
                />
              </View>

              <View style={styles.prefField}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Ekstra notater</ThemedText>
                <PersistentTextInput
                  draftKey="MusikkScreen-input-8"
                  style={[styles.prefInput, styles.prefNotes, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  placeholder="F.eks. ønsket stemning eller sjanger"
                  placeholderTextColor={theme.textMuted}
                  value={preferences.additionalNotes || ''}
                  onChangeText={(value) => setPreferences((prev) => ({ ...prev, additionalNotes: value }))}
                  multiline
                />
              </View>

              <Button onPress={handleSavePreferences} style={styles.savePreferencesButton}>
                {savingPreferences ? 'Lagrer...' : 'Lagre musikkønsker'}
              </Button>
            </View>
          </Animated.View>
        )}

        {activeTab === 'timeline' && (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}> 
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Musikk forberedelse</ThemedText>

              {TIMELINE_STEPS.map((step) => {
                const isDone = Boolean((timeline as unknown as Record<string, boolean>)[step.key]);
                return (
                  <View key={step.key} style={styles.timelineItem}>
                    <View style={[styles.timelineIconCircle, { backgroundColor: isDone ? `${theme.success}22` : theme.backgroundSecondary }]}> 
                      <EvendiIcon name={step.icon} size={20} color={isDone ? theme.success : theme.textMuted} />
                    </View>
                    <View style={styles.timelineContent}>
                      <ThemedText style={[styles.timelineLabel, { color: theme.text }]}>{step.label}</ThemedText>
                    </View>
                  </View>
                );
              })}

              {speeches.length > 0 && (
                <>
                  <ThemedText style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.lg }]}>Taler ({speeches.length})</ThemedText>
                  <ThemedText style={[styles.helperText, { color: theme.textMuted }]}>Pause musikken når taler starter</ThemedText>

                  {speeches
                    .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
                    .map((speech) => {
                      const statusColor =
                        speech.status === 'speaking' ? '#f59e0b' : speech.status === 'done' ? '#16a34a' : theme.textSecondary;
                      const statusIcon = speech.status === 'speaking' ? 'mic' : speech.status === 'done' ? 'check-circle' : 'clock';

                      return (
                        <View
                          key={speech.id}
                          style={[
                            styles.speechItem,
                            {
                              borderLeftWidth: 3,
                              borderLeftColor: statusColor,
                              backgroundColor: speech.status === 'speaking' ? '#f59e0b15' : theme.backgroundSecondary,
                            },
                          ]}
                        >
                          <View style={[styles.timelineIconCircle, { backgroundColor: `${statusColor}20` }]}> 
                            <EvendiIcon name={statusIcon} size={18} color={statusColor} />
                          </View>
                          <View style={styles.speechContent}>
                            <View style={styles.speechHeader}>
                              <ThemedText style={[styles.speechTime, { color: theme.text, fontWeight: '600' }]}>{speech.time}</ThemedText>
                              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}> 
                                <ThemedText style={[styles.statusText, { color: statusColor }]}>
                                  {speech.status === 'speaking' ? 'NÅ' : speech.status === 'done' ? 'Ferdig' : 'Klar'}
                                </ThemedText>
                              </View>
                            </View>
                            <ThemedText style={[styles.speechName, { color: theme.text }]}>{speech.speakerName}</ThemedText>
                            <ThemedText style={[styles.speechRole, { color: theme.textSecondary }]}>{speech.role}</ThemedText>
                          </View>
                        </View>
                      );
                    })}
                </>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <MusicYouTubePreviewModal
        visible={!!previewVideo}
        videoId={previewVideo?.videoId || null}
        title={previewVideo?.title || null}
        onClose={() => setPreviewVideo(null)}
        onOpenYouTube={openYouTubeLink}
        backgroundColor={theme.backgroundDefault}
        borderColor={theme.border}
        textColor={theme.text}
        mutedTextColor={theme.textSecondary}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: Spacing.xl },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    flexWrap: 'wrap',
  },
  tab: {
    minWidth: '20%',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {},
  tabText: { fontSize: 14, fontWeight: '600' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  tabContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
  },
  sliderCard: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sliderIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  sliderFill: {
    height: 8,
    borderRadius: 999,
  },
  toggleRow: {
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  togglePill: {
    minWidth: 44,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  togglePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  inlineButton: {
    flex: 1,
  },
  horizontalChips: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  recommendationsList: {
    gap: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 12,
  },
  createSetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  createSetButton: {
    minWidth: 96,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    height: 42,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
    flex: 1,
  },
  manualAddCard: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  setItemList: {
    gap: Spacing.xs,
  },
  setItemRow: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  setItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  setItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  setItemSub: {
    fontSize: 12,
  },
  itemIndex: {
    fontSize: 11,
    fontWeight: '600',
  },
  setActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  smallIconBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  exportResultCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  exportResultTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  exportResultText: {
    fontSize: 12,
  },
  exportResultLink: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  linkRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  permissionCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  permissionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  permissionSub: {
    fontSize: 11,
  },
  permissionToggle: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  offerChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  prefField: {
    gap: Spacing.xs,
  },
  prefRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  prefInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  prefNotes: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  prefLinkBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefError: {
    fontSize: 12,
    color: '#EF5350',
  },
  savePreferencesButton: {
    marginTop: Spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timelineIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: { flex: 1 },
  timelineLabel: { fontSize: 15, fontWeight: '500' },
  speechItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  speechContent: {
    flex: 1,
  },
  speechHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  speechTime: {
    fontSize: 16,
  },
  speechName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  speechRole: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
