import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { InitialState } from "@react-navigation/native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProviderCompat } from "@/components/KeyboardProviderCompat";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DesignProvider } from "@/lib/DesignProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { DialogProvider } from "@/components/DialogProvider";

export default function App() {
  console.log("[App] Component mounting");
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<InitialState | undefined>(undefined);
  const PERSISTENCE_KEY = "evendi_nav_state";

  useEffect(() => {
    console.log("[App] useEffect - Starting state restoration");
    const restoreState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(PERSISTENCE_KEY);
        if (savedState) {
          console.log("[App] Restored navigation state");
          setInitialState(JSON.parse(savedState));
        } else {
          console.log("[App] No saved navigation state");
        }
      } catch (error) {
        console.error("[App] Error restoring state:", error);
      } finally {
        console.log("[App] Setting isReady = true");
        setIsReady(true);
      }
    };

    restoreState();
  }, []);

  const handleStateChange = useCallback(async (state: InitialState | undefined) => {
    try {
      if (state) {
        await AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
      }
    } catch {
      // Best-effort persistence
    }
  }, []);

  if (!isReady) {
    console.log("[App] Waiting for ready state...");
    return null;
  }

  console.log("[App] Rendering app with initialState:", !!initialState);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <DesignProvider>
          <SafeAreaProvider>
            <ToastProvider>
              <DialogProvider>
                <GestureHandlerRootView style={styles.root}>
                  <KeyboardProviderCompat>
                    <NavigationContainer initialState={initialState} onStateChange={handleStateChange}>
                      <RootStackNavigator skipSplash={Boolean(initialState)} />
                    </NavigationContainer>
                    <StatusBar style="auto" />
                  </KeyboardProviderCompat>
                </GestureHandlerRootView>
              </DialogProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </DesignProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
