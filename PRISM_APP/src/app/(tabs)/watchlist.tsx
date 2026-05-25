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
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const remove = (id: string) => {
    setItems(prev => prev.filter(s => s.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const exitCompare = () => {
    setCompareMode(false);
    setSelected(new Set());
  };

  const launchCompare = () => {
    router.push({ pathname: '/compare', params: { ids: [...selected].join(',') } });
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Watchlist</Text>
          <Text style={[styles.count, { color: theme.mutedForeground }]}>
            {items.length} saved
          </Text>
        </View>
        {items.length >= 2 && (
          <Pressable
            onPress={compareMode ? exitCompare : () => setCompareMode(true)}
            style={[
              styles.compareToggle,
              {
                backgroundColor: compareMode ? theme.backgroundElement : theme.primary,
                borderColor: compareMode ? theme.border : theme.primary,
              },
            ]}
          >
            <Text style={[
              styles.compareToggleText,
              { color: compareMode ? theme.text : theme.primaryForeground },
            ]}>
              {compareMode ? 'Cancel' : '⇄  Compare'}
            </Text>
          </Pressable>
        )}
      </View>

      {compareMode && (
        <View style={[styles.compareBanner, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
          <Text style={[styles.bannerText, { color: theme.mutedForeground }]}>
            {selected.size === 0
              ? 'Select 2 or more systems to compare'
              : selected.size === 1
              ? 'Select 1 more system'
              : `${selected.size} systems selected`}
          </Text>
        </View>
      )}

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
        <>
          <FlatList
            data={items}
            keyExtractor={i => i.id}
            contentContainerStyle={[styles.list, { paddingBottom: compareMode && selected.size >= 2 ? 140 : 120 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selected.has(item.id);
              return (
                <Pressable
                  onPress={() => {
                    if (compareMode) {
                      toggleSelect(item.id);
                    } else {
                      router.push({ pathname: '/system/[slug]', params: { slug: item.slug } });
                    }
                  }}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: theme.card,
                      borderColor: isSelected ? theme.primary : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View style={styles.cardTop}>
                    {compareMode && (
                      <View style={[
                        styles.checkbox,
                        {
                          backgroundColor: isSelected ? theme.primary : 'transparent',
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}>
                        {isSelected && (
                          <Text style={[styles.checkboxTick, { color: theme.primaryForeground }]}>✓</Text>
                        )}
                      </View>
                    )}
                    <View style={[styles.logoBox, { backgroundColor: theme.backgroundElement }]} />
                    <View style={styles.meta}>
                      <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                      <Text style={[styles.vendor, { color: theme.mutedForeground }]}>{item.vendor}</Text>
                      <Text style={[styles.cat, { color: theme.mutedForeground }]}>{item.category}</Text>
                    </View>
                    <View style={styles.rightCol}>
                      {item.verified && (
                        <View style={[styles.badge, { backgroundColor: theme.verifiedBg }]}>
                          <Text style={[styles.badgeText, { color: theme.verified }]}>✓</Text>
                        </View>
                      )}
                      <Text style={[styles.price, { color: theme.text }]}>{item.startingPrice}</Text>
                    </View>
                  </View>

                  <Text style={[styles.tagline, { color: theme.mutedForeground }]} numberOfLines={1}>
                    {item.tagline}
                  </Text>

                  {!compareMode && (
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
                  )}
                </Pressable>
              );
            }}
          />

          {compareMode && selected.size >= 2 && (
            <View style={[styles.compareCTA, { backgroundColor: theme.background }]}>
              <Pressable
                onPress={launchCompare}
                style={[styles.compareBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={[styles.compareBtnText, { color: theme.primaryForeground }]}>
                  Compare {selected.size} systems  →
                </Text>
              </Pressable>
            </View>
          )}
        </>
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
  count: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  compareToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  compareToggleText: { fontSize: 13, fontWeight: '700' },
  compareBanner: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  bannerText: { fontSize: 13 },
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
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardTop: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxTick: { fontSize: 13, fontWeight: '800' },
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
  compareCTA: {
    position: 'absolute',
    bottom: 96,
    left: Spacing.md,
    right: Spacing.md,
  },
  compareBtn: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  compareBtnText: { fontSize: 16, fontWeight: '700' },
});
