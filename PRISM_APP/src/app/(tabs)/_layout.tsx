import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 28 : 16,
          left: 20,
          right: 20,
          backgroundColor: theme.tabBar,
          borderTopWidth: 0,
          borderRadius: 28,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
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
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <ChatsIcon color={color} size={size} />
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

function ChatsIcon({ color, size }: { color: string; size: number }) {
  const r = Radius_sm;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size * 0.88,
        height: size * 0.72,
        borderRadius: size * 0.18,
        borderWidth: 2,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}>
        <View style={{
          flexDirection: 'row',
          gap: size * 0.12,
        }}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={{
                width: size * 0.1,
                height: size * 0.1,
                borderRadius: size * 0.05,
                backgroundColor: color,
              }}
            />
          ))}
        </View>
      </View>
      <View style={{
        position: 'absolute',
        bottom: size * 0.02,
        left: size * 0.15,
        width: size * 0.22,
        height: size * 0.22,
        borderRightWidth: 2,
        borderBottomWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
        backgroundColor: 'transparent',
      }} />
    </View>
  );
}

const Radius_sm = 4;

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
