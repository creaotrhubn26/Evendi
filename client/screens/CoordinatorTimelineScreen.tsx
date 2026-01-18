import React, { useEffect, useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, FlatList, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getCoordinatorCoupleProfile, getCoordinatorSchedule, exchangeCoordinatorCode } from "@/lib/api-coordinator";

export default function CoordinatorTimelineScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [code, setCode] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [weddingDate, setWeddingDate] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [events, setEvents] = useState<{ id: string; time: string; title: string; icon?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleExchange = async () => {
    if (!code.trim()) {
      Alert.alert("Feil", "Angi tilgangskode");
      return;
    }
    setLoading(true);
    try {
      const { token } = await exchangeCoordinatorCode(code.trim());
      setAccessToken(token);
      const [profile, schedule] = await Promise.all([
        getCoordinatorCoupleProfile(token),
        getCoordinatorSchedule(token),
      ]);
      setWeddingDate(profile.weddingDate || null);
      setDisplayName(profile.displayName || null);
      setEvents(schedule);
      useEffect(() => {
        // Web deep link: /coordinator/<token>
        if (Platform.OS === "web") {
          const path = window.location.pathname;
          const match = path.match(/\/coordinator\/(\w+)/i);
          if (match && match[1]) {
            const token = match[1];
            setAccessToken(token);
            (async () => {
              try {
                const [profile, schedule] = await Promise.all([
                  getCoordinatorCoupleProfile(token),
                  getCoordinatorSchedule(token),
                ]);
                setWeddingDate(profile.weddingDate || null);
                setDisplayName(profile.displayName || null);
                setEvents(schedule);
              } catch (err) {
                Alert.alert("Feil", (err as Error).message || "Kunne ikke hente program");
              }
            })();
          }
        }
      }, []);
    } catch (err) {
      Alert.alert("Feil", (err as Error).message || "Kunne ikke hente program");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const renderItem = ({ item, index }: { item: { id: string; time: string; title: string; icon?: string }; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <View style={[styles.timelineItem]}>
        <View style={styles.timeColumn}>
          <ThemedText style={[styles.time, { color: Colors.dark.accent }]}>{item.time}</ThemedText>
        </View>
        <View style={styles.dotColumn}>
          <View style={[styles.dot, { backgroundColor: Colors.dark.accent }]}>
            <Feather name={(item.icon as any) || "circle"} size={12} color="#1A1A1A" />
          </View>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
        </View>
        <View style={[styles.eventCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }] }>
          <ThemedText style={styles.eventTitle}>{item.title}</ThemedText>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingBottom: insets.bottom + Spacing.lg }] }>
      <View style={[styles.headerCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }] }>
        <Feather name="calendar" size={20} color={Colors.dark.accent} />
        <ThemedText style={styles.headerTitle}>Koordinator – tidslinje</ThemedText>
        {displayName ? (
          <ThemedText style={[styles.headerName, { color: theme.text }] }>{displayName}</ThemedText>
        ) : null}
        <ThemedText style={[styles.headerDate, { color: theme.textSecondary }]}>{formatDate(weddingDate)}</ThemedText>
      </View>

      {!accessToken ? (
        <View style={[styles.accessCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText style={[styles.accessLabel, { color: theme.textSecondary }]}>Tilgangskode</ThemedText>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Angi kode"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundSecondary }]}
          />
          <Button onPress={handleExchange} disabled={loading}>
            {loading ? "Laster..." : "Hent program"}
          </Button>
        </View>
      ) : null}

      {accessToken ? (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCard: { padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: "center", margin: Spacing.lg },
  headerTitle: { marginTop: Spacing.xs, fontWeight: "600" },
  headerName: { marginTop: Spacing.xs, fontSize: 16, fontWeight: "600" },
  headerDate: { marginTop: Spacing.xs, fontSize: 14 },
  accessCard: { marginHorizontal: Spacing.lg, padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing.md },
  accessLabel: { fontSize: 12 },
  input: { borderWidth: 1, borderRadius: BorderRadius.sm, padding: Spacing.md },
  timelineItem: { flexDirection: "row", marginBottom: Spacing.sm },
  timeColumn: { width: 50, alignItems: "flex-end", paddingRight: Spacing.md },
  time: { fontSize: 14, fontWeight: "600" },
  dotColumn: { alignItems: "center", width: 30 },
  dot: { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center", zIndex: 1 },
  line: { width: 2, flex: 1, marginTop: -2 },
  eventCard: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, borderWidth: 1, marginLeft: Spacing.sm },
  eventTitle: { fontSize: 15, fontWeight: "500" },
});
