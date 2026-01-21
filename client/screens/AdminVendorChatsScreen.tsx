import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useHeaderHeight } from "@react-navigation/elements";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

interface AdminConvWithVendor {
  conv: {
    id: string;
    vendorId: string;
    lastMessageAt: string;
    adminUnreadCount: number;
    vendorUnreadCount: number;
  };
  vendor: { id: string; email: string; businessName: string } | null;
}

type Props = NativeStackScreenProps<any, "AdminVendorChats">;

export default function AdminVendorChatsScreen({ route, navigation }: Props) {
  const { adminKey } = route.params as any;
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();

  const [conversations, setConversations] = useState<AdminConvWithVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchConversations = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const url = new URL("/api/admin/vendor-admin-conversations", getApiUrl());
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) throw new Error("Kunne ikke hente samtaler");
      const data = await res.json();
      setConversations(data);
    } catch (e) {
      console.error(e);
      Alert.alert("Feil", (e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!adminKey) return;
    let closedByUs = false;
    let reconnectTimer: any = null;

    const connect = () => {
      try {
        const wsUrl = getApiUrl().replace(/^http/, "ws") + `/ws/admin/vendor-admin-list?adminKey=${encodeURIComponent(adminKey)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse((event as any).data);
            if (data?.type === "conv-update" && data.payload?.conversationId) {
              const { conversationId, lastMessageAt, adminUnreadCount } = data.payload as { conversationId: string; lastMessageAt?: string; adminUnreadCount?: number };
              setConversations((prev) => {
                const list = [...prev];
                const idx = list.findIndex((c) => c.conv.id === conversationId);
                if (idx >= 0) {
                  const updated = { ...list[idx] };
                  updated.conv = {
                    ...updated.conv,
                    lastMessageAt: lastMessageAt || updated.conv.lastMessageAt,
                    adminUnreadCount: typeof adminUnreadCount === "number" ? adminUnreadCount : updated.conv.adminUnreadCount,
                  } as any;
                  list[idx] = updated;
                  // Move to top if new lastMessageAt
                  if (lastMessageAt) {
                    list.sort((a, b) => new Date(b.conv.lastMessageAt).getTime() - new Date(a.conv.lastMessageAt).getTime());
                  }
                  return list;
                } else {
                  // If unknown conversation, do a light refresh
                  fetchConversations(false);
                  return prev;
                }
              });
            }
          } catch {}
        };
        ws.onclose = () => {
          if (!closedByUs) reconnectTimer = setTimeout(connect, 3000);
        };
      } catch {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();
    return () => {
      closedByUs = true;
      try { wsRef.current?.close(); } catch {}
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [adminKey]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Wedflow Support - Leverandører</ThemedText>
        <ThemedText style={styles.subtitle}>Meldinger fra leverandører</ThemedText>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: Spacing.lg }} color={theme.accent} />}
      {!loading && conversations.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={48} color={theme.textMuted} />
          <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>Ingen meldinger ennå</ThemedText>
        </View>
      )}
      {!loading && (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.conv.id}
          contentContainerStyle={{ padding: Spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchConversations(false); }} />}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.card,
                {
                  backgroundColor: item.conv.adminUnreadCount > 0 ? theme.accent + "10" : theme.backgroundSecondary,
                  borderColor: item.conv.adminUnreadCount > 0 ? theme.accent : theme.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("AdminVendorMessages", {
                  conversationId: item.conv.id,
                  vendorName: item.vendor?.businessName || item.vendor?.email || "Ukjent",
                  adminKey,
                });
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <ThemedText style={styles.vendorName}>{item.vendor?.businessName || "Ukjent leverandør"}</ThemedText>
                  <ThemedText style={[styles.vendorEmail, { color: theme.textSecondary }]}>{item.vendor?.email}</ThemedText>
                  <ThemedText style={[styles.lastMessage, { color: theme.textMuted }]}>
                    Sist: {new Date(item.conv.lastMessageAt).toLocaleString()}
                  </ThemedText>
                </View>
                {item.conv.adminUnreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                    <ThemedText style={styles.badgeText}>{item.conv.adminUnreadCount}</ThemedText>
                  </View>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.md },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 12, opacity: 0.6, marginTop: 2 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 14, marginTop: Spacing.md },
  card: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardInfo: { flex: 1 },
  vendorName: { fontSize: 16, fontWeight: "600", marginBottom: Spacing.xs },
  vendorEmail: { fontSize: 13, marginBottom: Spacing.xs },
  lastMessage: { fontSize: 12 },
  badge: { minWidth: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
});
