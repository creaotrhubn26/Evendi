import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable } from "react-native";

import GuestsScreen from "@/screens/GuestsScreen";
import TableSeatingScreen from "@/screens/TableSeatingScreen";
import SpeechListScreen from "@/screens/SpeechListScreen";
import QaSystemScreen from "@/screens/QaSystemScreen";
import GuestInvitationsScreen from "@/screens/GuestInvitationsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { EvendiIcon } from "@/components/EvendiIcon";
import { useTheme } from "@/hooks/useTheme";

export type GuestsStackParamList = {
  Guests: undefined;
  TableSeating: undefined;
  SpeechList: undefined;
  QaSystem: undefined;
  GuestInvitations: undefined;
};

const Stack = createNativeStackNavigator<GuestsStackParamList>();

export default function GuestsStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        ...screenOptions,
        headerRight: route.name === "Guests"
          ? undefined
          : () => (
              <Pressable onPress={() => navigation.navigate("Guests")}> 
                <EvendiIcon name="home" size={20} color={theme.text} />
              </Pressable>
            ),
      })}
    >
      <Stack.Screen
        name="Guests"
        component={GuestsScreen}
        options={{
          title: "Gjester",
        }}
      />
      <Stack.Screen
        name="TableSeating"
        component={TableSeatingScreen}
        options={{
          title: "Bordplassering",
        }}
      />
      <Stack.Screen
        name="SpeechList"
        component={SpeechListScreen}
        options={{
          title: "Taleliste",
        }}
      />
      <Stack.Screen
        name="QaSystem"
        component={QaSystemScreen}
        options={{
          title: "Spørsmål & Svar",
        }}
      />
      <Stack.Screen
        name="GuestInvitations"
        component={GuestInvitationsScreen}
        options={{
          title: "Invitasjoner",
        }}
      />
    </Stack.Navigator>
  );
}
