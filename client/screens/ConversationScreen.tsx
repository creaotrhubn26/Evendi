import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { showToast } from "@/lib/toast";

const COUPLE_SESSION_KEY = "evendi_couple_session";

interface Message {
  id: string;
  conversationId: string;
  senderType: "couple" | "vendor";
  senderId: string;
  body: string;
  createdAt: string;
  readAt?: string;
  senderName?: string;
}

interface Conversation {
  id: string;
  coupleId: string;
  vendorId: string;
  vendorName: string;
  messages: Message[];
  lastMessageAt: string;
  coupleUnreadCount: number;
  vendorUnreadCount: number;
}

export default function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();

  const { conversationId, vendorName } = route.params || {};

  const [messageText, setMessageText] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Load couple session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem(COUPLE_SESSION_KEY);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          setSessionToken(session.sessionToken);
        }
      } catch (error) {
        console.error("Error loading couple session:", error);
      }
    };
    loadSession();
  }, []);

  // Fetch conversation and messages
  const { data: conversation, isLoading, refetch } = useQuery<Conversation>({
    queryKey: ["/api/conversation", conversationId],
    queryFn: async () => {
      const response = await fetch(
        new URL(
          `/api/conversation/${conversationId}`,
          getApiUrl()
        ).toString(),
        {
          headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
        }
      );

      if (response.ok) {
        return response.json();
      }
      throw new Error("Failed to fetch conversation");
    },
    enabled: !!conversationId && !!sessionToken && isFocused,
    refetchInterval: isFocused ? 5000 : false, // Poll every 5 seconds
    refetchIntervalInBackground: false,
  });

  // Auto-scroll to latest message
  useEffect(() => {
    if (conversation?.messages && conversation.messages.length > 0) {
      const frame = requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [conversation?.messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!messageText.trim()) {
        throw new Error("Melding kan ikke være tom");
      }

      const response = await fetch(
        new URL(
          `/api/conversation/${conversationId}/message`,
          getApiUrl()
        ).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            body: messageText,
            senderType: "couple",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kunne ikke sende melding");
      }
      return response.json();
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMessageText("");
      // Refetch conversation to get updated messages
      refetch();
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Feil ved sending"
      );
    },
  });

  const renderMessage = ({ item }: { item: Message }) => {
    const isCouple = item.senderType === "couple";
    const date = new Date(item.createdAt);
    const timeString = date.toLocaleTimeString("no-NO", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View
        style={[
          styles.messageContainer,
          isCouple ? styles.messageContainerRight : styles.messageContainerLeft,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isCouple ? theme.primary : theme.backgroundDefault,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              { color: isCouple ? "white" : theme.text },
            ]}
          >
            {item.body}
          </ThemedText>
          <ThemedText
            style={[
              styles.messageTime,
              { color: isCouple ? "rgba(255,255,255,0.7)" : theme.textSecondary },
            ]}
          >
            {timeString}
          </ThemedText>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background },
          styles.centerContent,
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.md, backgroundColor: theme.primary },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={10}
        >
          <Feather name="chevron-left" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>{vendorName}</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Online</ThemedText>
        </View>
        <Pressable
          style={styles.moreButton}
          onPress={() => {
            /* Menu options */
          }}
        >
          <Feather name="more-vertical" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Messages */}
      {conversation?.messages && conversation.messages.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={conversation.messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          scrollIndicatorInsets={{ right: 1 }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="message-circle" size={48} color={theme.textSecondary} />
          <ThemedText style={styles.emptyText}>Ingen meldinger ennå</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Start en samtale med {vendorName}
          </ThemedText>
        </View>
      )}

      {/* Input Area */}
      <View
        style={[
          styles.inputArea,
          { backgroundColor: theme.backgroundDefault, borderTopColor: theme.border },
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Skriv en melding..."
            placeholderTextColor={theme.textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor: theme.primary,
                opacity: messageText.trim().length > 0 ? 1 : 0.5,
              },
            ]}
            onPress={() => sendMessageMutation.mutate()}
            disabled={sendMessageMutation.isPending || !messageText.trim()}
          >
            {sendMessageMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Feather name="send" size={18} color="white" />
            )}
          </Pressable>
        </View>

        {/* Character count */}
        {messageText.length > 900 && (
          <ThemedText style={styles.charCount}>
            {messageText.length}/1000
          </ThemedText>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  messageContainer: {
    marginBottom: Spacing.md,
    flexDirection: "row",
  },
  messageContainerLeft: {
    justifyContent: "flex-start",
  },
  messageContainerRight: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: Spacing.sm,
  },
  inputArea: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
});
