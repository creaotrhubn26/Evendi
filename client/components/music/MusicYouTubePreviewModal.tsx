import React from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { Button } from "@/components/Button";
import { EvendiIcon } from "@/components/EvendiIcon";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";

type Props = {
  visible: boolean;
  videoId: string | null;
  title?: string | null;
  onClose: () => void;
  onOpenYouTube: (videoId: string) => void;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  mutedTextColor: string;
};

export function MusicYouTubePreviewModal({
  visible,
  videoId,
  title,
  onClose,
  onOpenYouTube,
  backgroundColor,
  borderColor,
  textColor,
  mutedTextColor,
}: Props) {
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?playsinline=1&autoplay=1&rel=0`
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={[styles.modalCard, { backgroundColor, borderColor }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText style={[styles.title, { color: textColor }]} numberOfLines={1}>
                {title || "YouTube preview"}
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: mutedTextColor }]}>
                Embed preview + fallback til YouTube
              </ThemedText>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <EvendiIcon name="x" size={18} color={mutedTextColor} />
            </Pressable>
          </View>

          <View style={[styles.playerContainer, { borderColor }]}>
            {embedUrl ? (
              <WebView
                source={{ uri: embedUrl }}
                style={styles.player}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
              />
            ) : (
              <View style={styles.placeholder}>
                <ThemedText style={{ color: mutedTextColor }}>Ingen video valgt</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Button
              onPress={() => {
                if (!videoId) return;
                onOpenYouTube(videoId);
              }}
              style={styles.actionButton}
            >
              {Platform.OS === "web" ? "Åpne i ny fane" : "Åpne i YouTube"}
            </Button>
            <Button onPress={onClose} style={styles.actionButtonSecondary}>
              Lukk
            </Button>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
  },
  playerContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    minHeight: 220,
    backgroundColor: "#000000",
  },
  player: {
    height: 220,
    width: "100%",
    backgroundColor: "#000000",
  },
  placeholder: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonSecondary: {
    flex: 1,
    opacity: 0.85,
  },
});
