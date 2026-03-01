import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";

import { useTheme } from "@/hooks/useTheme";

interface HeaderTitleProps {
  title?: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  const { designSettings, isDark } = useTheme();
  const logoSource = designSettings.logoUrl
    ? { uri: designSettings.logoUrl }
    : require("../../assets/images/Evendi_logo_norsk_tagline.png");
  const isRemoteLogo = !!designSettings.logoUrl;

  if (!designSettings.logoUseHeader) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.textTitle}>
          {title || designSettings.appName || "Evendi"}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isDark && <View style={styles.logoGlow} />}
      <Image 
        source={logoSource} 
        style={[styles.logo, isRemoteLogo ? styles.remoteLogo : styles.localLogo, isDark && styles.logoDark]} 
        resizeMode="contain" 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  logo: {
    width: 300,
    height: 80,
  },
  remoteLogo: {
    width: 260,
    height: 72,
  },
  localLogo: {
    width: 300,
    height: 80,
  },
  logoDark: {
    opacity: 0.95,
  },
  logoGlow: {
    position: "absolute",
    width: 320,
    height: 100,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 50,
    zIndex: -1,
  },
  textTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
});
