import React from "react";
import { View, Text, StyleSheet } from "react-native";
import DiagnosticScreen from "@/screens/DiagnosticScreen";

// TEMPORARY DIAGNOSTIC VERSION - Replace with full App.tsx after testing
export default function App() {
  console.log("[App-Diagnostic] Rendering minimal diagnostic version");
  return <DiagnosticScreen />;
}
