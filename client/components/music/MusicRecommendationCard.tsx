import React from "react";
import { View, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { EvendiIcon } from "@/components/EvendiIcon";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { MusicRecommendation } from "@/lib/api-couple-data";

type Props = {
  recommendation: MusicRecommendation;
  onAdd: (recommendation: MusicRecommendation) => void;
  onFeedback: (kind: "more_like_this" | "too_slow" | "too_romantic" | "more_dhol", recommendation: MusicRecommendation) => void;
  onOpenYouTube: (videoId: string) => void;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  subTextColor: string;
  accentColor: string;
};

export function MusicRecommendationCard({
  recommendation,
  onAdd,
  onFeedback,
  onOpenYouTube,
  borderColor,
  backgroundColor,
  textColor,
  subTextColor,
  accentColor,
}: Props) {
  const safeEnergy = Math.max(0, Math.min(100, recommendation.energyScore || 0));
  const safeMatch = Math.max(0, Math.min(100, recommendation.matchScore || 0));

  return (
    <View style={[styles.card, { borderColor, backgroundColor }]}>
      <View style={styles.headerRow}>
        <View style={styles.mainCol}>
          <ThemedText style={[styles.title, { color: textColor }]} numberOfLines={1}>{recommendation.title}</ThemedText>
          <ThemedText style={[styles.artist, { color: subTextColor }]} numberOfLines={1}>{recommendation.artist || "Unknown artist"}</ThemedText>
          <View style={[styles.energyTrack, { backgroundColor: `${accentColor}1A` }]}>
            <View style={[styles.energyFill, { width: `${safeEnergy}%`, backgroundColor: accentColor }]} />
          </View>
          <ThemedText style={[styles.energyText, { color: subTextColor }]}>Energy {safeEnergy}</ThemedText>
        </View>
        <View style={[styles.scoreBadge, { borderColor: accentColor, backgroundColor: `${accentColor}14` }]}>
          <ThemedText style={[styles.scoreLabel, { color: subTextColor }]}>Match</ThemedText>
          <ThemedText style={[styles.scoreText, { color: accentColor }]}>{safeMatch}</ThemedText>
        </View>
      </View>

      <View style={styles.tagsRow}>
        {(recommendation.tags || []).slice(0, 4).map((tag) => (
          <View key={tag} style={[styles.tag, { borderColor, backgroundColor: `${accentColor}12` }]}>
            <ThemedText style={[styles.tagText, { color: subTextColor }]}>{tag}</ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        <Pressable onPress={() => onOpenYouTube(recommendation.youtubeVideoId)} style={[styles.actionBtn, { borderColor }]}>
          <EvendiIcon name="play" size={14} color={subTextColor} />
          <ThemedText style={[styles.actionText, { color: subTextColor }]}>Preview</ThemedText>
        </Pressable>
        <Pressable onPress={() => onAdd(recommendation)} style={[styles.actionBtn, { borderColor, backgroundColor: `${accentColor}20` }]}>
          <EvendiIcon name="plus" size={14} color={accentColor} />
          <ThemedText style={[styles.actionText, { color: accentColor }]}>Add to set</ThemedText>
        </Pressable>
      </View>

      <View style={styles.feedbackRow}>
        <Pressable onPress={() => onFeedback("more_like_this", recommendation)} style={[styles.feedbackBtn, { borderColor }]}>
          <ThemedText style={[styles.feedbackText, { color: subTextColor }]}>+ Similar</ThemedText>
        </Pressable>
        <Pressable onPress={() => onFeedback("too_slow", recommendation)} style={[styles.feedbackBtn, { borderColor }]}>
          <ThemedText style={[styles.feedbackText, { color: subTextColor }]}>- Slow</ThemedText>
        </Pressable>
        <Pressable onPress={() => onFeedback("too_romantic", recommendation)} style={[styles.feedbackBtn, { borderColor }]}>
          <ThemedText style={[styles.feedbackText, { color: subTextColor }]}>- Romantic</ThemedText>
        </Pressable>
        <Pressable onPress={() => onFeedback("more_dhol", recommendation)} style={[styles.feedbackBtn, { borderColor }]}>
          <ThemedText style={[styles.feedbackText, { color: subTextColor }]}>+ Dhol</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
  },
  mainCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  artist: {
    fontSize: 12,
    fontWeight: "500",
  },
  energyTrack: {
    marginTop: 6,
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  energyFill: {
    height: "100%",
    borderRadius: 999,
  },
  energyText: {
    fontSize: 10,
    marginTop: 3,
    fontWeight: "600",
  },
  scoreBadge: {
    minWidth: 58,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    lineHeight: 10,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  feedbackRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  feedbackBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
