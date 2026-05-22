import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

function TabIcon({ focused, active, inactive, children }: {
  focused: boolean;
  active: string;
  inactive: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <DiscoverIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color, size }) => (
            <WatchlistIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <ProfileIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

function DiscoverIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size * 0.85,
        height: size * 0.85,
        borderRadius: size * 0.42,
        borderWidth: 2,
        borderColor: color,
      }}>
        <View style={{
          position: 'absolute',
          right: size * 0.1,
          bottom: size * 0.1,
          width: size * 0.28,
          height: 2,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
          top: size * 0.55,
          left: size * 0.55,
        }} />
      </View>
    </View>
  );
}

function WatchlistIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size * 0.75,
        height: size * 0.85,
        borderWidth: 2,
        borderColor: color,
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 2,
        overflow: 'hidden',
      }}>
        <View style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.375,
          borderRightWidth: size * 0.375,
          borderTopWidth: size * 0.3,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
        }} />
      </View>
    </View>
  );
}

function ProfileIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size * 0.45,
        height: size * 0.45,
        borderRadius: size * 0.225,
        borderWidth: 2,
        borderColor: color,
        marginBottom: 1,
      }} />
      <View style={{
        width: size * 0.8,
        height: size * 0.35,
        borderTopLeftRadius: size * 0.4,
        borderTopRightRadius: size * 0.4,
        borderWidth: 2,
        borderBottomWidth: 0,
        borderColor: color,
      }} />
    </View>
  );
}
