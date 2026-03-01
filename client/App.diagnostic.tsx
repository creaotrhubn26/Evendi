import React from "react";
import { View, Text, StyleSheet } from "react-native";
import DiagnosticScreen from "@/screens/DiagnosticScreen";

// TEMPORARY DIAGNOSTIC VERSION - Replace with full App.tsx after testing
export default function App() {
  console.log("[App-Diagnostic] Rendering minimal diagnostic version");
  return (
    <View style={styles.container}>
      <Text style={styles.banner}>Diagnostikkmodus aktiv</Text>
      <DiagnosticScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    textAlign: "center",
    paddingVertical: 6,
    fontSize: 12,
    color: "#FFFFFF",
    backgroundColor: "#1E6BFF",
  },
});
