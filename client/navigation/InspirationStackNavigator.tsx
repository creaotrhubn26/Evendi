import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable } from "react-native";

import InspirationScreen from "@/screens/InspirationScreen";
import { EvendiIcon } from "@/components/EvendiIcon";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";

export type InspirationStackParamList = {
  Inspiration: undefined;
};

const Stack = createNativeStackNavigator<InspirationStackParamList>();

export default function InspirationStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        ...screenOptions,
        headerRight:
          route.name === "Inspiration"
            ? undefined
            : () => (
                <Pressable onPress={() => navigation.navigate("Inspiration")}>
                  <EvendiIcon name="home" size={20} color={theme.text} />
                </Pressable>
              ),
      })}
    >
      <Stack.Screen
        name="Inspiration"
        component={InspirationScreen}
        options={{
          title: "Showcase",
        }}
      />
    </Stack.Navigator>
  );
}
