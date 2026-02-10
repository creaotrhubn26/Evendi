import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { registerToastHandler } from "@/lib/toast";

const DEFAULT_DURATION_MS = 2000;

type ToastContextValue = {
  showToast: (message: string, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string, durationMs = DEFAULT_DURATION_MS) => {
    if (!text) return;
    const useNativeDriver = Platform.OS !== "web";

    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    setMessage(text);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver }),
    ]).start();

    hideTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver }),
        Animated.timing(translateY, { toValue: 12, duration: 180, useNativeDriver }),
      ]).start(() => {
        setMessage(null);
      });
    }, durationMs);
  }, [opacity, translateY]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  useEffect(() => {
    registerToastHandler(showToast);
    return () => registerToastHandler(null);
  }, [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <View
          pointerEvents="none"
          style={[styles.container, Platform.OS === "web" && styles.containerWeb, { paddingBottom: insets.bottom + 24 }]}
        >
          <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}
          >
            <Text style={styles.toastText}>{message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  containerWeb: {
    position: "fixed",
  },
  toast: {
    backgroundColor: "rgba(20, 20, 20, 0.92)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: "90%",
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
  },
});
