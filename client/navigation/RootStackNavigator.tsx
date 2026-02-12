import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import SplashScreen from "@/screens/SplashScreen";
import CoupleLoginScreen from "@/screens/CoupleLoginScreen";
import VendorLoginScreen from "@/screens/VendorLoginScreen";
import VendorRegistrationScreen from "@/screens/VendorRegistrationScreen";
import VendorDashboardScreen from "@/screens/VendorDashboardScreen";
import VendorPaymentScreen from "@/screens/VendorPaymentScreen";
import VendorAdminChatScreen from "@/screens/VendorAdminChatScreen";
import VendorProfileScreen from "@/screens/VendorProfileScreen";
import VendorCateringScreen from "@/screens/VendorCateringScreen";
import VendorBlomsterScreen from "@/screens/VendorBlomsterScreen";
import VendorKakeScreen from "@/screens/VendorKakeScreen";
import VendorTransportScreen from "@/screens/VendorTransportScreen";
import VendorHaarMakeupScreen from "@/screens/VendorHaarMakeupScreen";
import VendorFotografScreen from "@/screens/VendorFotografScreen";
import VendorVideografScreen from "@/screens/VendorVideografScreen";
import VendorMusikkScreen from "@/screens/VendorMusikkScreen";
import VendorVenueScreen from "@/screens/VendorVenueScreen";
import VendorPlanleggerScreen from "@/screens/VendorPlanleggerScreen";
import VendorFotoVideografScreen from "@/screens/VendorFotoVideografScreen";
import VendorDetailScreen from "@/screens/VendorDetailScreen";
import DeliveryCreateScreen from "@/screens/DeliveryCreateScreen";
import InspirationCreateScreen from "@/screens/InspirationCreateScreen";
import ProductCreateScreen from "@/screens/ProductCreateScreen";
import OfferCreateScreen from "@/screens/OfferCreateScreen";
import VendorChatScreen from "@/screens/VendorChatScreen";
import AdminLoginScreen from "@/screens/AdminLoginScreen";
import AdminDashboardScreen from "@/screens/AdminDashboardScreen";
import AdminVendorsScreen from "@/screens/AdminVendorsScreen";
import AdminDesignScreen from "@/screens/AdminDesignScreen";
import AdminInspirationsScreen from "@/screens/AdminInspirationsScreen";
import AdminCategoriesScreen from "@/screens/AdminCategoriesScreen";
import AdminSettingsScreen from "@/screens/AdminSettingsScreen";
import AdminSmokeTestScreen from "@/screens/AdminSmokeTestScreen";
import AdminChecklistsScreen from "@/screens/AdminChecklistsScreen";
import AdminVendorChatsScreen from "@/screens/AdminVendorChatsScreen";
import AdminVendorMessagesScreen from "@/screens/AdminVendorMessagesScreen";
import AdminFAQScreen from "@/screens/AdminFAQScreen";
import AdminAppSettingsScreen from "@/screens/AdminAppSettingsScreen";
import AdminWhatsNewScreen from "@/screens/AdminWhatsNewScreen";
import AdminVideoGuidesScreen from "@/screens/AdminVideoGuidesScreen";
import AdminSubscriptionsScreen from "@/screens/AdminSubscriptionsScreen";
import AdminPreviewScreen from "@/screens/AdminPreviewScreen";
import StatusScreen from "@/screens/StatusScreen";
import VendorHelpScreen from "@/screens/VendorHelpScreen";
import WhatsNewScreen from "@/screens/WhatsNewScreen";
import DocumentationScreen from "@/screens/DocumentationScreen";
import VideoGuidesScreen from "@/screens/VideoGuidesScreen";
import LandingScreen from "@/screens/LandingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemedText } from "@/components/ThemedText";
import {
  VenueDetailsScreen,
  PhotographerDetailsScreen,
  FloristDetailsScreen,
  CateringDetailsScreen,
  MusicDetailsScreen,
  CakeDetailsScreen,
  BeautyDetailsScreen,
  TransportDetailsScreen,
  PlannerDetailsScreen,
  PhotoVideoDetailsScreen,
  DressDetailsScreen,
} from "@/screens/vendor-details";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  VendorLogin: undefined;
  VendorDashboard: undefined;
  VendorProfile: undefined;
  VendorRegistration: undefined;
  VendorPayment: undefined;
  VendorCatering: undefined;
  VendorBlomster: undefined;
  VendorKake: undefined;
  VendorTransport: undefined;
  VendorHaarMakeup: undefined;
  VendorFotograf: undefined;
  VendorVideograf: undefined;
  VendorMusikk: undefined;
  VendorVenue: undefined;
  VendorPlanlegger: undefined;
  VendorFotoVideograf: undefined;
  // Vendor detail screens
  VenueDetails: undefined;
  PhotographerDetails: undefined;
  FloristDetails: undefined;
  CateringDetails: undefined;
  MusicDetails: undefined;
  CakeDetails: undefined;
  BeautyDetails: undefined;
  TransportDetails: undefined;
  PlannerDetails: undefined;
  PhotoVideoDetails: undefined;
  DressDetails: undefined;
  DeliveryCreate: { delivery?: any; coupleId?: string; coupleName?: string; coupleEmail?: string; weddingDate?: string; projectId?: string; timelineId?: string };
  InspirationCreate: undefined;
  ProductCreate: { product?: any };
  OfferCreate: undefined;
  VendorChat: {
    conversationId: string;
    coupleName?: string;
    chatType?: "couple" | "vendor";
    conversationType?: "couple" | "vendor";
  };
  VendorPublicProfile: {
    vendorId: string;
    vendorName: string;
    vendorDescription?: string | null;
    vendorLocation?: string | null;
    vendorPriceRange?: string | null;
    vendorCategory?: string | null;
    readOnly?: boolean;
  };
  VendorAdminChat: undefined;
  VendorHelp: undefined;
  AdminLogin: undefined;
  AdminMain: { adminKey: string };
  AdminVendors: { adminKey: string };
  AdminDesign: { adminKey: string };
  AdminInspirations: { adminKey: string };
  AdminCategories: { adminKey: string };
  AdminSettings: { adminKey: string };
  AdminSmokeTest: { adminKey: string };
  AdminChecklists: { adminKey: string };
  AdminFAQ: { adminKey: string };
  AdminAppSettings: { adminKey: string };
  AdminWhatsNew: { adminKey: string };
  AdminVideoGuides: { adminKey: string };
  AdminSubscriptions: { adminKey: string };
  AdminPreview: { adminKey: string };
  AdminVendorChats: { adminKey: string };
  AdminVendorMessages: { conversationId: string; vendorName: string; adminKey: string };
  Status: undefined;
  WhatsNew: { category?: "vendor" | "couple" };
  Documentation: { adminKey?: string };
  VideoGuides: undefined;
  Landing: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const COUPLE_STORAGE_KEY = "evendi_couple_session";
const VENDOR_STORAGE_KEY = "evendi_vendor_session";
const ADMIN_STORAGE_KEY = "evendi_admin_key";

export default function RootStackNavigator({ skipSplash = false }: { skipSplash?: boolean }) {
  const screenOptions = useScreenOptions();
  const { designSettings } = useTheme();
  const [showSplash, setShowSplash] = useState(!skipSplash);
  const [authMode, setAuthMode] = useState<"none" | "couple" | "vendor" | "admin">("none");
  const [isLoading, setIsLoading] = useState(true);
  const [storedAdminKey, setStoredAdminKey] = useState("");
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>("Login");
  const adminLogoSource = designSettings.logoUrl
    ? { uri: designSettings.logoUrl }
    : require("../../assets/images/Evendi_logo_norsk_tagline.png");
  const renderAdminHeaderTitle = () => {
    if (designSettings.logoUseAdminHeader) {
      return (
        <Image
          source={adminLogoSource}
          style={{ width: 300, height: 80 }}
          resizeMode="contain"
        />
      );
    }

    return (
      <ThemedText style={{ fontSize: 20, fontWeight: "600" }}>
        {designSettings.appName || "Evendi"}
      </ThemedText>
    );
  };

  const handleCoupleLogout = async () => {
    await AsyncStorage.removeItem(COUPLE_STORAGE_KEY);
    setAuthMode("none");
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [coupleSession, vendorSession, adminKey] = await Promise.all([
          AsyncStorage.getItem(COUPLE_STORAGE_KEY),
          AsyncStorage.getItem(VENDOR_STORAGE_KEY),
          AsyncStorage.getItem(ADMIN_STORAGE_KEY),
        ]);
        setStoredAdminKey(adminKey || "");

        if (coupleSession) {
          setAuthMode("couple");
          setInitialRoute("Main");
        } else if (vendorSession) {
          setAuthMode("vendor");
          setInitialRoute("VendorDashboard");
        } else if (adminKey) {
          setAuthMode("admin");
          setInitialRoute("AdminMain");
        } else {
          setAuthMode("none");
          setInitialRoute("Login");
        }
      } catch {
        setAuthMode("none");
        setStoredAdminKey("");
        setInitialRoute("Login");
      }
      setIsLoading(false);
    };

    if (skipSplash || Platform.OS === "web") {
      checkAuth().finally(() => setShowSplash(false));
      return;
    }

    // Show splash for 3.5 seconds, then check auth
    const timer = setTimeout(() => {
      setShowSplash(false);
      checkAuth();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || showSplash) {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      initialRouteName={authMode === "couple" ? "Main" : initialRoute}
      key={authMode}
    >
      {authMode !== "couple" ? (
        <>
          <Stack.Screen
            name="Login"
            options={{
              headerShown: false,
            }}
          >
            {(props) => (
              <CoupleLoginScreen
                {...props}
                onLoginSuccess={() => setAuthMode("couple")}
              />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="VendorLogin"
            component={VendorLoginScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="VendorPublicProfile"
            component={VendorDetailScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorRegistration"
            component={VendorRegistrationScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="VendorDashboard"
            component={VendorDashboardScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorCatering"
            component={VendorCateringScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorBlomster"
            component={VendorBlomsterScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorKake"
            component={VendorKakeScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorTransport"
            component={VendorTransportScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorHaarMakeup"
            component={VendorHaarMakeupScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorFotograf"
            component={VendorFotografScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorVideograf"
            component={VendorVideografScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorMusikk"
            component={VendorMusikkScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorVenue"
            component={VendorVenueScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorPlanlegger"
            component={VendorPlanleggerScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorFotoVideograf"
            component={VendorFotoVideografScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorPayment"
            component={VendorPaymentScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="VendorProfile"
            component={VendorProfileScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          {/* Vendor Category Detail Screens */}
          <Stack.Screen
            name="VenueDetails"
            component={VenueDetailsScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="PhotographerDetails"
            component={PhotographerDetailsScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="FloristDetails"
            component={FloristDetailsScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="CateringDetails"
            component={CateringDetailsScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="MusicDetails"
            component={MusicDetailsScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="CakeDetails"
            component={CakeDetailsScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="BeautyDetails"
            component={BeautyDetailsScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="TransportDetails"
            component={TransportDetailsScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="PlannerDetails"
            component={PlannerDetailsScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="PhotoVideoDetails"
            component={PhotoVideoDetailsScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="DressDetails"
            component={DressDetailsScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="DeliveryCreate"
            component={DeliveryCreateScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="InspirationCreate"
            component={InspirationCreateScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="ProductCreate"
            component={ProductCreateScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="OfferCreate"
            component={OfferCreateScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="VendorChat"
            component={VendorChatScreen}
            options={({ route }) => ({
              title: route.params?.coupleName || "Chat",
              headerBackVisible: false,
              presentation: "modal",
            })}
          />
          <Stack.Screen
            name="AdminLogin"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          >
            {(props) => (
              <AdminLoginScreen
                {...props}
                initialAdminKey={storedAdminKey}
                onLoginSuccess={async (adminKey) => {
                  setStoredAdminKey(adminKey);
                  try {
                    await AsyncStorage.setItem(ADMIN_STORAGE_KEY, adminKey);
                  } catch {
                    // Best-effort persistence
                  }
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="AdminMain"
            component={AdminDashboardScreen}
            initialParams={{ adminKey: storedAdminKey }}
            options={{
              headerShown: true,
              headerTitle: renderAdminHeaderTitle,
            }}
          />
          <Stack.Screen
            name="AdminVendors"
            component={AdminVendorsScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AdminDesign"
            component={AdminDesignScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AdminInspirations"
            component={AdminInspirationsScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AdminCategories"
            component={AdminCategoriesScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AdminSettings"
            component={AdminSettingsScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AdminSmokeTest"
            component={AdminSmokeTestScreen}
            options={{
              headerTitle: renderAdminHeaderTitle,
            }}
          />
          <Stack.Screen
            name="AdminChecklists"
            component={AdminChecklistsScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AdminFAQ"
            component={AdminFAQScreen}
            options={{
              headerTitle: renderAdminHeaderTitle,
            }}
          />
          <Stack.Screen
            name="AdminAppSettings"
            component={AdminAppSettingsScreen}
            options={{
              headerTitle: renderAdminHeaderTitle,
            }}
          />
          <Stack.Screen
            name="AdminWhatsNew"
            component={AdminWhatsNewScreen}
            options={{
              headerTitle: renderAdminHeaderTitle,
            }}
          />
          <Stack.Screen
            name="AdminVideoGuides"
            component={AdminVideoGuidesScreen}
            options={{
              headerTitle: renderAdminHeaderTitle,
            }}
          />
          <Stack.Screen
            name="AdminSubscriptions"
            component={AdminSubscriptionsScreen}
            options={{
              headerTitle: renderAdminHeaderTitle,
            }}
          />
          <Stack.Screen
            name="AdminPreview"
            component={AdminPreviewScreen}
            options={{
              headerTitle: renderAdminHeaderTitle,
            }}
          />
          <Stack.Screen
            name="WhatsNew"
            component={WhatsNewScreen}
            options={{
              headerTitle: renderAdminHeaderTitle,
            }}
          />
          <Stack.Screen
            name="AdminVendorChats"
            component={AdminVendorChatsScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AdminVendorMessages"
            component={AdminVendorMessagesScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VendorAdminChat"
            component={VendorAdminChatScreen}
            options={{
              headerTitle: renderAdminHeaderTitle,
            }}
          />
          <Stack.Screen
            name="VendorHelp"
            component={VendorHelpScreen}
            options={{
              headerTitle: renderAdminHeaderTitle,
            }}
          />
          <Stack.Screen
            name="Status"
            component={StatusScreen}
            options={{
              headerTitle: renderAdminHeaderTitle,
            }}
          />
          <Stack.Screen
            name="Landing"
            component={LandingScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Documentation"
            component={DocumentationScreen}
            options={{
              headerTitle: renderAdminHeaderTitle,
            }}
          />
          <Stack.Screen
            name="VideoGuides"
            component={VideoGuidesScreen}
            options={{
              headerTitle: renderAdminHeaderTitle,
            }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Main"
          options={{
            headerShown: false,
          }}
        >
          {() => (
            <AuthProvider value={{ logout: handleCoupleLogout }}>
              <MainTabNavigator />
            </AuthProvider>
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
