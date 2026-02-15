import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function DiagnosticScreen() {
  console.log("[DiagnosticScreen] Rendering");
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ Diagnostic Screen Rendering OK</Text>
      <Text style={styles.small}>If you see this, React Native web is working</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  small: {
    fontSize: 14,
    color: "#666",
  },
});
