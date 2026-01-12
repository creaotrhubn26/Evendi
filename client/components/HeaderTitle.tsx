import React from "react";
import { View, StyleSheet, Image } from "react-native";

interface HeaderTitleProps {
  title?: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/wedflow-logo.png")}
        style={styles.logo}
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
});
