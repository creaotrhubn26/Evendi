import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { SwipeableRow } from "@/components/SwipeableRow";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { getVendorConfig } from "@/lib/vendor-adapter";
import { getSpeeches } from "@/lib/storage";
import { Speech } from "@/lib/types";

const VENDOR_STORAGE_KEY = "wedflow_vendor_session";

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
};

export default function VendorMusikkScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<Navigation>();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [speeches, setSpeeches] = useState<Speech[]>([]);

  const vendorConfig = getVendorConfig(null, "Musikk");

  // Load speeches for music coordination
  const speechesQuery = useQuery<Speech[]>({
    queryKey: ['speeches'],
    queryFn: async () => {
      const data = await getSpeeches();
      return Array.isArray(data) ? data : [];
    },
  });

  useCallback(() => {
    if (speechesQuery.data) {
      setSpeeches(speechesQuery.data || []);
    }
  }, [speechesQuery.data])();

  useEffect(() => {
    const loadSession = async () => {
      const data = await AsyncStorage.getItem(VENDOR_STORAGE_KEY);
      if (!data) {
        navigation.replace("VendorLogin");
        return;
      }
      const parsed = JSON.parse(data);
      setSessionToken(parsed?.sessionToken || null);
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

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchProducts(), refetchOffers()]);
    setIsRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goToProducts = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("ProductCreate");
  };

  const goToOffers = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("OfferCreate");
  };

  const handleDelete = (id: string, type: 'product' | 'offer') => {
    Alert.alert(`Slett ${type === 'product' ? 'produkt' : 'tilbud'}`, "Er du sikker?", [
      { text: "Avbryt", style: "cancel" },
      { text: "Slett", style: "destructive", onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) },
    ]);
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
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>Publiser musikk- og DJ-pakker, og send tilbud raskt.</ThemedText>

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
            <Feather name="music" size={18} color={theme.textSecondary} />
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
            <Feather name="file-text" size={18} color={theme.textSecondary} />
          </View>
          <ThemedText style={[styles.cardBody, { color: theme.textSecondary }]}>Send tilbud med timepriser og tilgjengelighet.</ThemedText>
          <Button style={styles.cardButton} onPress={goToOffers}>Send tilbud</Button>
        </Pressable>
      </View>

      <View style={[styles.infoBox, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <Feather name="info" size={16} color={theme.textSecondary} />
        <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>Legg til lyd-eksempler og spillelister for å øke konvertering.</ThemedText>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Produkter</ThemedText>
          {productsLoading ? <ActivityIndicator size="small" color={theme.accent} /> : null}
        </View>
        {products.length === 0 ? (
          <View style={styles.emptyRow}>
            <Feather name="music" size={18} color={theme.accent} />
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
                  <Feather name="chevron-right" size={18} color={theme.textSecondary} />
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
            <Feather name="file-text" size={18} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>Ingen tilbud ennå</ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Send tilbud til brudeparet</ThemedText>
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
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>{o.totalAmount} {o.currency || 'NOK'}</ThemedText>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{o.status}</ThemedText>
                    <Feather name="chevron-right" size={18} color={theme.textSecondary} />
                  </View>
                </Pressable>
              </SwipeableRow>
            </Animated.View>
          ))
        )}
      </View>

      {speeches.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Taler ({speeches.length})</ThemedText>
            <Feather name="mic" size={18} color={theme.textSecondary} />
          </View>
          <ThemedText style={[styles.speechSubtitle, { color: theme.textMuted }]}>
            Pause/senk musikken når taler starter
          </ThemedText>
          
          {speeches
            .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
            .map((speech, idx) => {
              const statusColor = speech.status === 'speaking' ? '#f59e0b' : 
                                 speech.status === 'done' ? '#16a34a' : theme.textSecondary;
              const statusIcon = speech.status === 'speaking' ? 'mic' :
                                speech.status === 'done' ? 'check-circle' : 'clock';

              return (
                <Animated.View key={speech.id} entering={FadeInDown.delay(idx * 30)}>
                  <View
                    style={[
                      styles.speechRow,
                      { 
                        borderBottomColor: theme.border,
                        borderLeftWidth: 3,
                        borderLeftColor: statusColor,
                        backgroundColor: speech.status === 'speaking' ? '#f59e0b10' : 'transparent',
                      }
                    ]}
                  >
                    <View style={[styles.speechIconCircle, { backgroundColor: statusColor + '20' }]}>
                      <Feather name={statusIcon} size={16} color={statusColor} />
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
