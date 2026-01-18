import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import SplashScreen from "@/screens/SplashScreen";
import CoupleLoginScreen from "@/screens/CoupleLoginScreen";
import VendorLoginScreen from "@/screens/VendorLoginScreen";
import VendorRegistrationScreen from "@/screens/VendorRegistrationScreen";
import VendorDashboardScreen from "@/screens/VendorDashboardScreen";
import VendorProfileScreen from "@/screens/VendorProfileScreen";
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
import AdminChecklistsScreen from "@/screens/AdminChecklistsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  VendorLogin: undefined;
  VendorDashboard: undefined;
  VendorProfile: undefined;
  VendorRegistration: undefined;
  DeliveryCreate: undefined;
  InspirationCreate: undefined;
  ProductCreate: undefined;
  OfferCreate: undefined;
  VendorChat: { conversationId: string; coupleName: string };
  AdminLogin: undefined;
  AdminMain: { adminKey: string };
  AdminVendors: { adminKey: string };
  AdminDesign: { adminKey: string };
  AdminInspirations: { adminKey: string };
  AdminCategories: { adminKey: string };
  AdminSettings: { adminKey: string };
  AdminChecklists: { adminKey: string };
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const COUPLE_STORAGE_KEY = "wedflow_couple_session";

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await AsyncStorage.getItem(COUPLE_STORAGE_KEY);
        setIsLoggedIn(!!session);
      } catch {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    };

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
    <Stack.Navigator screenOptions={screenOptions}>
      {!isLoggedIn ? (
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
                onLoginSuccess={() => setIsLoggedIn(true)}
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
            name="VendorProfile"
            component={VendorProfileScreen}
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
            options={{
              headerShown: false,
              presentation: "modal",
            }}
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
                onLoginSuccess={() => {}}
              />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="AdminMain"
            component={AdminDashboardScreen}
            options={{
              headerShown: true,
              title: "Admin Dashboard",
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
            name="AdminChecklists"
            component={AdminChecklistsScreen}
            options={{
              headerShown: false,
            }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{
            headerShown: false,
          }}
        />
      )}
    </Stack.Navigator>
  );
}
