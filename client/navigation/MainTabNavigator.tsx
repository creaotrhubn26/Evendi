import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { EvendiIcon } from "@/components/EvendiIcon";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import PlanningStackNavigator, { type PlanningStackParamList } from "@/navigation/PlanningStackNavigator";
import InspirationStackNavigator, { type InspirationStackParamList } from "@/navigation/InspirationStackNavigator";
import GuestsStackNavigator, { type GuestsStackParamList } from "@/navigation/GuestsStackNavigator";
import ProfileStackNavigator, { type ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/theme";

export type MainTabParamList = {
  PlanningTab: NavigatorScreenParams<PlanningStackParamList> | undefined;
  InspirationTab: NavigatorScreenParams<InspirationStackParamList> | undefined;
  GuestsTab: NavigatorScreenParams<GuestsStackParamList> | undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const palette = isDark ? Colors.dark : Colors.light;

  return (
    <Tab.Navigator
      initialRouteName="PlanningTab"
      screenOptions={{
        tabBarActiveTintColor: theme.accent ?? palette.accent,
        tabBarInactiveTintColor: theme.tabIconDefault ?? palette.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot ?? palette.backgroundRoot,
            web: theme.backgroundRoot ?? palette.backgroundRoot,
          }),
          borderTopWidth: 0,
          borderTopColor: theme.border ?? palette.border,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="PlanningTab"
        component={PlanningStackNavigator}
        options={{
          title: "Planlegging",
          tabBarIcon: ({ color, size }) => (
            <EvendiIcon name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="InspirationTab"
        component={InspirationStackNavigator}
        options={{
          title: "Showcase",
          tabBarIcon: ({ color, size }) => (
            <EvendiIcon name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GuestsTab"
        component={GuestsStackNavigator}
        options={{
          title: "Gjester",
          tabBarIcon: ({ color, size }) => (
            <EvendiIcon name="users" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <EvendiIcon name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
