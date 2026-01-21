import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
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
  conv: { id: string; vendorId: string; lastMessageAt: string; adminUnreadCount: number };
  vendor: { id: string; email: string; businessName: string } | null;
}

interface AdminMessage {
  id: string;
  conversationId: string;
  senderType: "vendor" | "admin";
  senderId: string;
  body: string;
  createdAt: string;
}

type Props = NativeStackScreenProps<any, "AdminVendorMessages">;

export default function AdminVendorMessagesScreen({ route, navigation }: Props) {
  const { conversationId, vendorName, adminKey } = route.params as any;
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();

  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsTypingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [vendorTypingWs, setVendorTypingWs] = useState(false);

  const fetchMessages = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const url = new URL(`/api/admin/vendor-admin-conversations/${conversationId}/messages`, getApiUrl());
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) throw new Error("Kunne ikke hente meldinger");
      const data = await res.json();
      setMessages(data.reverse());
    } catch (e) {
      console.error(e);
      Alert.alert("Feil", (e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    try {
      setSending(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const url = new URL(`/api/admin/vendor-admin-conversations/${conversationId}/messages`, getApiUrl());
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({ body: replyText.trim() }),
      });
      if (!res.ok) throw new Error("Kunne ikke sende svar");
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setReplyText("");
    } catch (e) {
      Alert.alert("Feil", (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const notifyTyping = async () => {
    try {
      const url = new URL(`/api/admin/vendor-admin-conversations/${conversationId}/typing`, getApiUrl());
      await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${adminKey}` } });
    } catch {}
  };

  const handleChangeText = (text: string) => {
    setReplyText(text);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    // Fire immediately and then debounce further calls for 2s
    notifyTyping();
    typingTimerRef.current = setTimeout(() => {}, 2000) as unknown as NodeJS.Timeout;
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  // WS subscribe for live updates
  useEffect(() => {
    if (!adminKey || !conversationId) return;
    let closedByUs = false;
    let reconnectTimer: any = null;

    const connect = () => {
      try {
        const wsUrl = getApiUrl().replace(/^http/, "ws") + `/ws/admin/vendor-admin?adminKey=${encodeURIComponent(adminKey)}&conversationId=${encodeURIComponent(conversationId)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse((event as any).data);
            if (data?.type === "message" && data.payload) {
              const msg = data.payload as AdminMessage;
              setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
            } else if (data?.type === "typing" && data.payload?.sender === "vendor") {
              setVendorTypingWs(true);
              if (wsTypingTimerRef.current) clearTimeout(wsTypingTimerRef.current);
              wsTypingTimerRef.current = setTimeout(() => setVendorTypingWs(false), 4000) as unknown as NodeJS.Timeout;
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
      if (wsTypingTimerRef.current) clearTimeout(wsTypingTimerRef.current);
    };
  }, [adminKey, conversationId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{vendorName || "Leverandør"}</ThemedText>
        <ThemedText style={styles.subtitle}>Wedflow Support Chat</ThemedText>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: Spacing.lg }} color={theme.accent} />}
      {!loading && (
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: Spacing.md, paddingTop: 0 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMessages(false); }} />}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.senderType === "vendor"
                  ? [styles.vendorBubble, { backgroundColor: theme.backgroundSecondary }]
                  : [styles.adminBubble, { backgroundColor: theme.accent + "20" }],
              ]}
            >
              <ThemedText style={[styles.senderLabel, { color: item.senderType === "admin" ? theme.accent : theme.textSecondary }]}>
                {item.senderType === "admin" ? "Du (Admin)" : "Leverandør"}
              </ThemedText>
              <ThemedText style={styles.body}>{item.body}</ThemedText>
              <ThemedText style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</ThemedText>
            </View>
          )}
        />
      )}

      {vendorTypingWs && (
        <View style={{ paddingHorizontal: Spacing.md, paddingBottom: 4 }}>
          <ThemedText style={{ fontSize: 12, color: theme.textMuted }}>Leverandør skriver…</ThemedText>
        </View>
      )}

      <View style={[styles.inputBar, { backgroundColor: theme.backgroundSecondary }]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Svar på melding…"
          placeholderTextColor={theme.textMuted}
          value={replyText}
          onChangeText={handleChangeText}
          editable={!loading && !sending}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, { backgroundColor: theme.accent }]}
          onPress={sendReply}
          disabled={sending || !replyText.trim()}
        >
          {sending ? <ActivityIndicator color="#FFFFFF" /> : <Feather name="send" size={18} color="#FFFFFF" />}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 12, opacity: 0.6, marginTop: 2 },
  bubble: { borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  vendorBubble: { alignSelf: "flex-start" },
  adminBubble: { alignSelf: "flex-end" },
  senderLabel: { fontSize: 11, fontWeight: "600", marginBottom: Spacing.xs },
  body: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 11, opacity: 0.6, marginTop: 4 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", padding: Spacing.sm, gap: Spacing.sm },
  input: { flex: 1, maxHeight: 100, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: "#2D2D2D" },
  sendBtn: { height: 44, width: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
