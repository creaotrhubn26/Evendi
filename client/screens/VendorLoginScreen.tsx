import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const VENDOR_STORAGE_KEY = "wedflow_vendor_session";

interface VendorSession {
  sessionToken: string;
  vendorId: string;
  email: string;
  businessName: string;
}

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function VendorLoginScreen({ navigation }: Props) {
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: string, value: string): string => {
    switch (field) {
      case "email":
        if (!value) return "E-post er påkrevd";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Ugyldig e-postadresse";
        return "";
      case "password":
        if (!value) return "Passord er påkrevd";
        return "";
      default:
        return "";
    }
  }, []);

  const handleBlur = useCallback((field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, [validateField]);

  const getFieldStyle = useCallback((field: string) => {
    if (touched[field] && errors[field]) {
      return { borderColor: "#DC3545" };
    }
    return {};
  }, [touched, errors]);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const session = await AsyncStorage.getItem(VENDOR_STORAGE_KEY);
    if (session) {
      navigation.replace("VendorDashboard");
    }
  };

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/vendors/login", { email, password });
      return response.json();
    },
    onSuccess: async (data) => {
      if (data.vendor && data.vendor.status === "approved" && data.sessionToken) {
        const session: VendorSession = {
          sessionToken: data.sessionToken,
          vendorId: data.vendor.id,
          email: data.vendor.email,
          businessName: data.vendor.businessName,
        };
        await AsyncStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(session));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace("VendorDashboard");
      } else if (data.vendor && data.vendor.status === "pending") {
        Alert.alert("Venter på godkjenning", "Din søknad er under behandling. Du vil få beskjed når den er godkjent.");
      } else if (data.vendor && data.vendor.status === "rejected") {
        Alert.alert("Søknad avvist", "Din søknad ble dessverre avvist. Ta kontakt for mer informasjon.");
      } else {
        Alert.alert("Feil", "Kunne ikke logge inn. Prøv igjen.");
      }
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Feil", error.message || "Ugyldig e-post eller passord.");
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Mangler informasjon", "Fyll ut e-post og passord.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    loginMutation.mutate();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.xl },
        ]}
      >
        <Image
          source={require("../../assets/images/wedflow-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <ThemedText style={styles.title}>Leverandørportal</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Logg inn for å administrere dine leveranser
        </ThemedText>

        <View style={styles.form}>
          <View>
            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }, getFieldStyle("email")]}>
              <Feather name="mail" size={18} color={touched.email && errors.email ? "#DC3545" : theme.textMuted} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="E-post"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                onBlur={() => handleBlur("email", email)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            {touched.email && errors.email ? (
              <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
            ) : null}
          </View>

          <View>
            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }, getFieldStyle("password")]}>
              <Feather name="lock" size={18} color={touched.password && errors.password ? "#DC3545" : theme.textMuted} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Passord"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                onBlur={() => handleBlur("password", password)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={theme.textMuted} />
              </Pressable>
            </View>
            {touched.password && errors.password ? (
              <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
            ) : null}
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loginMutation.isPending}
            style={[styles.loginBtn, { backgroundColor: Colors.dark.accent, opacity: loginMutation.isPending ? 0.6 : 1 }]}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <ThemedText style={styles.loginBtnText}>Logg inn</ThemedText>
            )}
          </Pressable>
        </View>

        <ThemedText style={[styles.registerText, { color: theme.textSecondary }]}>
          Har du ikke en konto?
        </ThemedText>
        <Pressable
          onPress={() => navigation.navigate("VendorRegistration")}
          style={styles.registerLink}
        >
          <ThemedText style={[styles.registerLinkText, { color: Colors.dark.accent }]}>
            Registrer deg som leverandør
          </ThemedText>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  logo: {
    width: 300,
    height: 80,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  form: {
    width: "100%",
    gap: Spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 50,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  loginBtn: {
    height: 50,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  loginBtnText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  registerText: {
    fontSize: 14,
    marginTop: Spacing.xl,
  },
  registerLink: {
    marginTop: Spacing.xs,
  },
  registerLinkText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: "#DC3545",
    marginTop: 4,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
});
