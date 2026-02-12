import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EvendiIcon } from '@/components/EvendiIcon';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '../components/ThemedText';
import { Button } from '../components/Button';
import { VendorCategoryMarketplace } from '@/components/VendorCategoryMarketplace';
import { useTheme } from '../hooks/useTheme';
import { Colors, Spacing } from '../constants/theme';
import { PlanningStackParamList } from '../navigation/PlanningStackNavigator';
import PersistentTextInput from "@/components/PersistentTextInput";

type TabType = 'sessions' | 'timeline';
type NavigationProp = NativeStackNavigationProp<PlanningStackParamList>;

const TIMELINE_STEPS = [
  { key: 'photographerSelected', label: 'Fotograf/Videograf valgt', icon: 'check-circle' as const },
  { key: 'sessionBooked', label: 'Foto-/Videosesjon booket', icon: 'calendar' as const },
  { key: 'contractSigned', label: 'Kontrakt signert', icon: 'file-text' as const },
  { key: 'depositPaid', label: 'Depositum betalt', icon: 'credit-card' as const },
  { key: 'deliveryPlanned', label: 'Leveranse planlagt', icon: 'truck' as const },
];

export function FotoVideografScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('sessions');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleFindProvider = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('VendorMatching', { category: 'photo-video' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Marketplace hero + search + vendor cards + CTA */}
        <VendorCategoryMarketplace
          category="photo-video"
          categoryName="Foto & Video"
          icon="camera"
          subtitle="Fotograf og videograf i ett"
        />

        {/* Tab bar */}
        <View style={[styles.tabBar, { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
          <Pressable
            style={[styles.tab, activeTab === 'sessions' && styles.activeTab]}
            onPress={() => {
              setActiveTab('sessions');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <ThemedText style={[styles.tabText, activeTab === 'sessions' && { color: Colors.dark.accent }]}>
              Økter
            </ThemedText>
            {activeTab === 'sessions' && <View style={[styles.tabIndicator, { backgroundColor: Colors.dark.accent }]} />}
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'timeline' && styles.activeTab]}
            onPress={() => {
              setActiveTab('timeline');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <ThemedText style={[styles.tabText, activeTab === 'timeline' && { color: Colors.dark.accent }]}>
              Tidslinje
            </ThemedText>
            {activeTab === 'timeline' && <View style={[styles.tabIndicator, { backgroundColor: Colors.dark.accent }]} />}
          </Pressable>
        </View>

        {/* Tab content */}
        {activeTab === 'sessions' ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.emptyState}>
            <EvendiIcon name="camera" size={48} color={theme.textMuted} style={{ opacity: 0.5 }} />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              Ingen foto-/videoøkter ennå
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
              Bruk søket ovenfor for å finne en leverandør som tilbyr både foto og video.
            </ThemedText>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.timelineContainer}>
            {TIMELINE_STEPS.map((step) => (
              <View key={step.key} style={styles.timelineItem}>
                <View style={[styles.timelineIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
                  <EvendiIcon name={step.icon} size={20} color={theme.textMuted} />
                </View>
                <View style={styles.timelineContent}>
                  <ThemedText style={styles.timelineLabel}>{step.label}</ThemedText>
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {},
  tabText: { fontSize: 15, fontWeight: '600' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', maxWidth: 280 },
  timelineContainer: { gap: Spacing.lg, padding: Spacing.lg },
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
});
