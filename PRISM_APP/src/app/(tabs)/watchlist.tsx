import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { mockSystems, MockSystem } from '@/lib/mock-data';

export default function WatchlistScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<MockSystem[]>(
    mockSystems.filter(s => ['1', '4'].includes(s.id))
  );

  const remove = (id: string) => setItems(prev => prev.filter(s => s.id !== id));

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Watchlist</Text>
        <Text style={[styles.count, { color: theme.mutedForeground }]}>
          {items.length} saved
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyIcon, { color: theme.mutedForeground }]}>♡</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No saved systems yet</Text>
          <Text style={[styles.emptyBody, { color: theme.mutedForeground }]}>
            Tap the heart icon on any system to add it here.
          </Text>
          <Pressable
            onPress={() => router.push('/')}
            style={[styles.browseBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.browseBtnText, { color: theme.primaryForeground }]}>
              Browse systems
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/system/[slug]', params: { slug: item.slug } })}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.logoBox, { backgroundColor: theme.backgroundElement }]} />
                <View style={styles.meta}>
                  <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.vendor, { color: theme.mutedForeground }]}>{item.vendor}</Text>
                  <Text style={[styles.cat, { color: theme.mutedForeground }]}>{item.category}</Text>
                </View>
                <View style={styles.rightCol}>
                  {item.verified && (
                    <View style={[styles.badge, { backgroundColor: item.verified ? theme.verifiedBg : theme.badgeBg }]}>
                      <Text style={[styles.badgeText, { color: theme.verified }]}>✓</Text>
                    </View>
                  )}
                  <Text style={[styles.price, { color: theme.text }]}>{item.startingPrice}</Text>
                </View>
              </View>

              <Text style={[styles.tagline, { color: theme.mutedForeground }]} numberOfLines={1}>
                {item.tagline}
              </Text>

              <View style={styles.actions}>
                <Pressable
                  onPress={() => router.push({ pathname: '/system/[slug]', params: { slug: item.slug } })}
                  style={[styles.actionBtn, { borderColor: theme.border }]}
                >
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>View details</Text>
                </Pressable>
                <Pressable
                  onPress={() => remove(item.id)}
                  style={[styles.actionBtn, { borderColor: theme.border }]}
                >
                  <Text style={[styles.actionBtnText, { color: '#E53E3E' }]}>Remove</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '700' },
  count: { fontSize: 13, fontWeight: '500' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 52, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  browseBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
  },
  browseBtnText: { fontSize: 15, fontWeight: '700' },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardTop: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  logoBox: { width: 48, height: 48, borderRadius: Radius.md },
  meta: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  vendor: { fontSize: 12, marginTop: 2 },
  cat: { fontSize: 12 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  price: { fontSize: 13, fontWeight: '700' },
  tagline: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  actionBtn: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
});
