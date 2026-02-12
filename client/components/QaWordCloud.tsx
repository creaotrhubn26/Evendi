import React, { useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";
import { QaQuestion } from "@/lib/types";

interface QaWordCloudProps {
  questions: QaQuestion[];
  onTagPress?: (tag: string) => void;
  selectedTag?: string | null;
}

interface TagWeight {
  tag: string;
  count: number;
  weight: number; // 0-1 normalized
}

const TAG_COLORS = [
  "#1E6BFF",
  "#00D2C6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
];

export function QaWordCloud({ questions, onTagPress, selectedTag }: QaWordCloudProps) {
  const { theme } = useTheme();

  const tagWeights: TagWeight[] = useMemo(() => {
    const tagCounts = new Map<string, number>();

    questions.forEach((q) => {
      q.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });

      // Also extract keywords from question text
      const words = q.text.toLowerCase().split(/\s+/);
      const stopWords = new Set([
        "og", "i", "er", "det", "en", "et", "til", "for", "på", "med", "av",
        "som", "kan", "har", "vil", "hva", "hvordan", "når", "hvor", "hvem",
        "the", "is", "a", "an", "to", "for", "in", "of", "and", "with",
        "how", "what", "when", "where", "who", "which", "this", "that",
        "?", "!", ".", ",", "de", "vi", "jeg", "du", "den", "dere",
      ]);

      words.forEach((word) => {
        const clean = word.replace(/[^a-zæøåäö0-9]/gi, "");
        if (clean.length > 3 && !stopWords.has(clean)) {
          tagCounts.set(clean, (tagCounts.get(clean) || 0) + 1);
        }
      });
    });

    const entries = Array.from(tagCounts.entries())
      .filter(([, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    const maxCount = Math.max(...entries.map(([, c]) => c), 1);
    const minCount = Math.min(...entries.map(([, c]) => c), 1);
    const range = maxCount - minCount || 1;

    return entries.map(([tag, count]) => ({
      tag,
      count,
      weight: (count - minCount) / range,
    }));
  }, [questions]);

  if (tagWeights.length === 0) {
    return (
      <View style={[styles.emptyContainer, { borderColor: theme.border }]}>
        <ThemedText style={{ color: theme.textMuted, textAlign: "center" }}>
          Spørsmålssky vises her når det kommer inn spørsmål
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.cloudContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
      <View style={styles.cloudHeader}>
        <ThemedText style={[styles.cloudTitle, { color: theme.text }]}>
          🔥 Populære temaer
        </ThemedText>
        <ThemedText style={[styles.cloudSubtitle, { color: theme.textSecondary }]}>
          Trykk for å filtrere
        </ThemedText>
      </View>
      <View style={styles.cloud}>
        {tagWeights.map((tw, index) => {
          const fontSize = 13 + tw.weight * 16;
          const color = TAG_COLORS[index % TAG_COLORS.length];
          const isSelected = selectedTag === tw.tag;

          return (
            <Animated.View
              key={tw.tag}
              entering={FadeIn.delay(index * 50).duration(300)}
            >
              <Pressable
                onPress={() => onTagPress?.(tw.tag)}
                style={[
                  styles.tagBubble,
                  {
                    backgroundColor: isSelected ? color + "30" : color + "15",
                    borderColor: isSelected ? color : "transparent",
                    borderWidth: isSelected ? 2 : 0,
                    paddingHorizontal: Spacing.sm + tw.weight * 8,
                    paddingVertical: Spacing.xs + tw.weight * 4,
                  },
                ]}
              >
                <ThemedText
                  style={{
                    fontSize,
                    fontWeight: tw.weight > 0.5 ? "700" : "500",
                    color,
                  }}
                >
                  {tw.tag}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 10,
                    color: color + "AA",
                    marginLeft: 4,
                  }}
                >
                  {tw.count}
                </ThemedText>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cloudContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cloudHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cloudTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cloudSubtitle: {
    fontSize: 12,
  },
  cloud: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  tagBubble: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.full,
  },
  emptyContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    minHeight: 100,
  },
});
