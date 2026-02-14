import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  type SharedValue,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useDesignSettings } from "@/hooks/useDesignSettings";
import { getAppLanguage, type AppLanguage } from "@/lib/storage";

const FALLBACK_LOGO = require("../../assets/images/Evendi_logo_norsk_tagline.png");

function adjustHexColor(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return hex;
  }

  const num = parseInt(normalized, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getGradientStops(background: string, isDark: boolean): [string, string, string] {
  const base = background || (isDark ? "#0f1624" : "#f8f9fc");
  if (!/^#[0-9a-fA-F]{6}$/.test(base)) {
    return isDark
      ? ["#0f1624", "#121826", "#0d0f1a"]
      : ["#f8f9fc", "#ffffff", "#f5f6fa"];
  }

  return isDark
    ? [adjustHexColor(base, -14), base, adjustHexColor(base, 8)]
    : [adjustHexColor(base, 12), "#ffffff", adjustHexColor(base, 4)];
}

export default function SplashScreen() {
  const systemColorScheme = useColorScheme();
  const { settings } = useDesignSettings();
  const [appLanguage, setAppLanguage] = useState<AppLanguage>("nb");
  
  // Use design settings darkMode if available, otherwise fall back to system
  const isDark = settings?.darkMode ?? (systemColorScheme === "dark");
  const colorScheme = isDark ? "dark" : "light";
  const colors = Colors[colorScheme];
  const primaryColor = settings?.primaryColor ?? colors.accent;
  const backgroundColor = settings?.backgroundColor ?? colors.backgroundRoot;
  const appName = settings?.appName ?? "Evendi";
  const tagline = appLanguage === "en"
    ? settings?.appTaglineEn ?? "Your Event. Perfectly Matched."
    : settings?.appTagline ?? "Ditt arrangement. Perfekt Match.";
  const logoSource = settings?.logoUrl
    ? { uri: settings.logoUrl }
    : FALLBACK_LOGO;
  const showLogo = settings?.logoUseSplash ?? true;
  const gradientStops = getGradientStops(backgroundColor, isDark);
  
  // Debug: log the color scheme
  console.log("SplashScreen - isDark:", isDark, "darkMode setting:", settings?.darkMode, "system:", systemColorScheme);
  
  // Logo fade and scale animations
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);

  // Dolly zoom effect (scale only for React Native compatibility)
  const contentScale = useSharedValue(1);

  // Text animations
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);

  // Accent line animation
  const lineScale = useSharedValue(0);

  // Overall fade out at the end
  const fadeOutOpacity = useSharedValue(1);

  useEffect(() => {
    getAppLanguage().then((lang) => {
      if (lang) setAppLanguage(lang);
    });

    // Logo animation: fade in and scale (0-1200ms)
    logoOpacity.value = withTiming(1, {
      duration: 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    logoScale.value = withTiming(1, {
      duration: 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // Accent line animation (1200-2000ms)
    lineScale.value = withDelay(
      1200,
      withTiming(1, {
        duration: 1200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // Subtitle animation (2000-2800ms)
    subtitleOpacity.value = withDelay(
      2000,
      withTiming(1, {
        duration: 1200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    subtitleTranslateY.value = withDelay(
      2000,
      withTiming(0, {
        duration: 1200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // Dolly zoom starting at 3000ms (cinematic push-in, scale only for React Native)
    contentScale.value = withDelay(
      3000,
      withTiming(1.08, {
        duration: 4500,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      })
    );

    // Cinematic fade out (5500-6800ms)
    fadeOutOpacity.value = withDelay(
      5500,
      withTiming(0, {
        duration: 1300,
        easing: Easing.bezier(0.33, 0, 0.67, 1),
      })
    );

    return () => {
    };
  }, [contentScale, fadeOutOpacity, lineScale, logoOpacity, logoScale, subtitleOpacity, subtitleTranslateY]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const lineAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: lineScale.value }],
  }));

  const fadeOutStyle = useAnimatedStyle(() => ({
    opacity: fadeOutOpacity.value,
  }));

  const dollyZoomStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: contentScale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.container, fadeOutStyle]}>
      <LinearGradient
        colors={gradientStops}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={
          colorScheme === "light"
            ? ["rgba(0,0,0,0.03)", "rgba(0,0,0,0)"]
            : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0)"]
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.vignette}
      />

      <Animated.View style={[styles.content, dollyZoomStyle]}>
        {/* Logo */}
        <Animated.View style={logoAnimatedStyle}>
          {showLogo ? (
            <Image source={logoSource} style={styles.logo} resizeMode="contain" />
          ) : (
            <ThemedText style={[styles.appName, { color: primaryColor }]}>
              {appName}
            </ThemedText>
          )}
        </Animated.View>

        {/* Accent line */}
        <Animated.View
          style={[
            styles.accentLine,
            { backgroundColor: primaryColor },
            lineAnimatedStyle,
          ]}
        />

        {/* Subtitle text */}
        <Animated.View style={subtitleAnimatedStyle}>
          <ThemedText style={[styles.subtitle, { color: primaryColor }]}>
            {tagline}
          </ThemedText>
        </Animated.View>

      </Animated.View>

      {/* Subtle bottom accent */}
      <View style={[styles.bottomAccent, { backgroundColor: `${primaryColor}20` }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    gap: 24,
  },
  logo: {
    width: 280,
    height: 280,
  },
  accentLine: {
    width: 60,
    height: 3,
    borderRadius: 1.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 42,
    fontWeight: "600",
    letterSpacing: 1,
  },
  bottomAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
  },
});
