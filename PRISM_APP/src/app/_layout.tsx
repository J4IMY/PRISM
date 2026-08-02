import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";
import { useNotifications } from "@/hooks/use-notifications";

export default function RootLayout() {
  const scheme = useColorScheme();
  useNotifications();

  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="system/[slug]"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen name="auth/login" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false, presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}
