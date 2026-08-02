import { Tabs } from "expo-router";
import React from "react";
import { Platform, View, Animated } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { useNavInactivity } from "@/hooks/use-nav-inactivity";

export default function TabsLayout() {
  const theme = useTheme();
  const { navStyle, panResponder } = useNavInactivity(3000);
  const iconSize = Platform.OS === "android" ? 20 : 24;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            bottom: Platform.OS === "ios" ? 28 : 12,
            left: 20,
            right: 20,
            backgroundColor: theme.tabBar,
            borderTopWidth: 0,
            borderRadius: 24,
            height: Platform.OS === "android" ? 60 : 68,
            paddingBottom: Platform.OS === "android" ? 8 : 10,
            paddingTop: Platform.OS === "android" ? 8 : 10,
            paddingHorizontal: 8,
            elevation: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            ...navStyle,
          } as any,
          tabBarActiveTintColor: theme.tabBarActive,
          tabBarInactiveTintColor: theme.tabBarInactive,
          tabBarLabelStyle: {
            fontSize: Platform.OS === "android" ? 10 : 11,
            fontWeight: "700",
            marginTop: 2,
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <DiscoverIcon color={color} size={iconSize} />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: "Watchlist",
          tabBarIcon: ({ color }) => <WatchlistIcon color={color} size={iconSize} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color }) => <ChatsIcon color={color} size={iconSize} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <ProfileIcon color={color} size={iconSize} />,
        }}
      />
    </Tabs>
    </View>
  );
}

function DiscoverIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size + 4, height: size + 4, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size * 0.4,
          borderWidth: 2,
          borderColor: color,
        }}
      >
        <View
          style={{
            position: "absolute",
            width: size * 0.35,
            height: 2,
            backgroundColor: color,
            transform: [{ rotate: "-45deg" }],
            top: size * 0.52,
            left: size * 0.52,
          }}
        />
      </View>
    </View>
  );
}

function WatchlistIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size + 4, height: size + 4, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: size * 0.75,
          height: size * 0.85,
          borderWidth: 2,
          borderColor: color,
          borderRadius: 3,
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 2,
        }}
      >
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.3,
            borderRightWidth: size * 0.3,
            borderTopWidth: size * 0.25,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: color,
            marginBottom: size * 0.1,
          }}
        />
      </View>
    </View>
  );
}

function ChatsIcon({ color, size }: { color: string; size: number }) {
  const theme = useTheme();
  return (
    <View style={{ width: size + 4, height: size + 4, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: size * 0.88,
          height: size * 0.72,
          borderRadius: size * 0.18,
          borderWidth: 2,
          borderColor: color,
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          marginBottom: 2,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: size * 0.12,
          }}
        >
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                width: size * 0.08,
                height: size * 0.08,
                borderRadius: size * 0.04,
                backgroundColor: color,
              }}
            />
          ))}
        </View>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: size * 0.1,
          left: size * 0.15,
          width: size * 0.2,
          height: size * 0.2,
          borderRightWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          transform: [{ rotate: "45deg" }],
          backgroundColor: theme.tabBar,
        }}
      />
    </View>
  );
}

const Radius_sm = 4;

function ProfileIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size + 4, height: size + 4, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: size * 0.21,
          borderWidth: 2,
          borderColor: color,
          marginBottom: 1,
        }}
      />
      <View
        style={{
          width: size * 0.75,
          height: size * 0.32,
          borderTopLeftRadius: size * 0.35,
          borderTopRightRadius: size * 0.35,
          borderWidth: 2,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
    </View>
  );
}
