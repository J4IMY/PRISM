import { router } from 'expo-router';
import React, { useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useApi } from '@/hooks/use-api';
import { api, System, Category } from '@/lib/api';

const STATIC_CATS = ['All'];

export default function DiscoverScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [watchlisted, setWatchlisted] = useState<Set<string>>(new Set());

  const systemsParams = useMemo(() => ({
    q: query.length >= 2 ? query : undefined,
    category: selectedCat !== 'All' ? selectedCat.toLowerCase() : undefined,
  }), [query, selectedCat]);

  const { data: systemsData, loading: systemsLoading, error: systemsError } = useApi(
    () => api.systems.list(systemsParams as Record<string, string>),
    [systemsParams]
  );

  const { data: catsData } = useApi(() => api.categories.list(), []);

  const categoryLabels = useMemo(() => {
    if (!catsData?.categories) return STATIC_CATS;
    return ['All', ...catsData.categories.map((c: Category) => c.name)];
  }, [catsData]);

  const systems = systemsData?.systems ?? [];

  const toggleWatchlist = useCallback((id: string) => {
    setWatchlisted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.logo, { color: theme.primary }]}>PRISM</Text>
      </View>

      <View style={styles.heroRow}>
        <Text style={[styles.heroTitle, { color: theme.text }]}>
          Discover the right software
        </Text>
      </View>

      <View style={[styles.searchRow, { backgroundColor: theme.background }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Text style={[styles.searchIcon, { color: theme.mutedForeground }]}>⌕</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search CRM, ERP, helpdesk…"
            placeholderTextColor={theme.mutedForeground}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={[styles.clearBtn, { color: theme.mutedForeground }]}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {categoryLabels.map(cat => {
          const active = cat === selectedCat;
          return (
            <Pressable
              key={cat}
              onPress={() => setSelectedCat(cat)}
              style={[
                styles.catChip,
                {
                  backgroundColor: active ? theme.primary : theme.chipBg,
                  borderColor: active ? theme.primary : theme.chipBorder,
                },
              ]}
            >
              <Text style={[styles.catLabel, { color: active ? theme.primaryForeground : theme.chipText }]}>
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.resultsMeta}>
        <Text style={[styles.resultsCount, { color: theme.mutedForeground }]}>
          {systemsLoading ? 'Loading…' : `${systems.length} system${systems.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {systemsError ? (
        <View style={styles.errorBox}>
          <Text style={[styles.errorText, { color: theme.mutedForeground }]}>
            Unable to load systems. Check your connection.
          </Text>
        </View>
      ) : systemsLoading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={systems}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SystemCard
              item={item}
              watchlisted={watchlisted.has(item.id)}
              onPress={() => router.push({ pathname: '/system/[slug]', params: { slug: item.slug } })}
              onWatchlist={() => toggleWatchlist(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>No systems found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function SystemCard({
  item,
  watchlisted,
  onPress,
  onWatchlist,
}: {
  item: System;
  watchlisted: boolean;
  onPress: () => void;
  onWatchlist: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.logoBox, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.logoLetter, { color: theme.mutedForeground }]}>
            {item.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardName, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.cardVendor, { color: theme.mutedForeground }]}>{item.vendor_name}</Text>
        </View>
        <Pressable onPress={onWatchlist} style={styles.heartBtn} hitSlop={8}>
          <Text style={[styles.heart, { color: watchlisted ? '#E53E3E' : theme.mutedForeground }]}>
            {watchlisted ? '♥' : '♡'}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.tagline, { color: theme.mutedForeground }]} numberOfLines={2}>
        {item.tagline}
      </Text>

      <View style={styles.badgeRow}>
        <Badge label={item.category_name} color={theme.badgeText} bg={theme.badgeBg} />
        <Badge label={item.pricing_tier} color={theme.badgeText} bg={theme.badgeBg} />
        {item.verified && (
          <Badge label="✓ Verified" color={theme.verified} bg={theme.verifiedBg} />
        )}
        {item.trial_available && (
          <Badge label="Free trial" color={theme.badgeText} bg={theme.badgeBg} />
        )}
      </View>

      <View style={styles.priceRow}>
        <Text style={[styles.priceLabel, { color: theme.mutedForeground }]}>From</Text>
        <Text style={[styles.price, { color: theme.text }]}>{item.starting_price}</Text>
      </View>
    </Pressable>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: { fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  searchRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm + 4,
    height: 44,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  clearBtn: { fontSize: 14, paddingHorizontal: 4 },
  heroRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  heroTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  catScroll: { flexGrow: 0 },
  catContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    flexDirection: 'row',
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  catLabel: { fontSize: 13, fontWeight: '600' },
  resultsMeta: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  resultsCount: { fontSize: 12, fontWeight: '500' },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 120, gap: Spacing.sm },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontSize: 18, fontWeight: '700' },
  cardMeta: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  cardVendor: { fontSize: 12, marginTop: 2 },
  heartBtn: { padding: 2 },
  heart: { fontSize: 22 },
  tagline: { fontSize: 13, lineHeight: 18 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  badgeText: { fontSize: 11, fontWeight: '600' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  priceLabel: { fontSize: 12 },
  price: { fontSize: 13, fontWeight: '700' },
  loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  errorText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBox: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
