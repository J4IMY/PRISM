import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, SystemDetailResponse } from '@/lib/api';

const COL_W = 130;
const LABEL_W = 140;

const SECTIONS = ['Overview', 'Packages', 'Features', 'TCO'] as const;
type Section = typeof SECTIONS[number];

function fmt(n: number) {
  return '$' + n.toLocaleString();
}

function parsePriceNum(price: string | undefined): number {
  if (!price) return 0;
  return parseInt(price.replace(/[^0-9]/g, ''), 10) || 0;
}

export default function CompareScreen() {
  const theme = useTheme();
  const { ids } = useLocalSearchParams<{ ids: string }>();
  const [section, setSection] = useState<Section>('Overview');
  const [entries, setEntries] = useState<SystemDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        let systemIds = (ids ?? '').split(',').filter(Boolean);
        if (systemIds.length < 2) {
          try {
            const { items } = await api.watchlist.list();
            systemIds = items.slice(0, 3).map((i) => i.id);
          } catch {
            // not signed in
          }
        }
        if (systemIds.length < 2) {
          if (!cancelled) {
            setEntries([]);
            setLoading(false);
          }
          return;
        }
        const data = await api.compare.load(systemIds);
        if (!cancelled) setEntries(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load comparison');
          setEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  const featureKeys = useMemo(() => {
    const names = new Set<string>();
    entries.forEach((e) => e.features.forEach((f) => names.add(f.feature_name)));
    return Array.from(names).sort();
  }, [entries]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (entries.length < 2) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Text style={[styles.backArrow, { color: theme.primary }]}>‹</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Compare</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {error || 'Select at least 2 systems to compare.'}
          </Text>
          <Text style={[styles.emptyHint, { color: theme.mutedForeground }]}>
            Save systems to your watchlist or pass ?ids= in the URL.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: theme.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Compare · {entries.length} systems
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.sectionScroll, { borderBottomColor: theme.border }]}
        contentContainerStyle={styles.sectionContent}
      >
        {SECTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setSection(s)}
            style={[
              styles.sectionTab,
              section === s && [styles.sectionTabActive, { borderBottomColor: theme.primary }],
            ]}
          >
            <Text
              style={[
                styles.sectionLabel,
                { color: section === s ? theme.primary : theme.mutedForeground },
                section === s && styles.sectionLabelActive,
              ]}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {section === 'Overview' && <OverviewSection entries={entries} />}
            {section === 'Packages' && <PackagesSection entries={entries} />}
            {section === 'Features' && <FeaturesSection entries={entries} featureKeys={featureKeys} />}
            {section === 'TCO' && <TCOSection entries={entries} />}
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

function SysHeader({ entries }: { entries: SystemDetailResponse[] }) {
  const theme = useTheme();
  return (
    <View style={styles.sysHeaderRow}>
      <View style={[styles.labelCol, { borderRightColor: theme.border }]} />
      {entries.map((e) => (
        <View key={e.system.id} style={[styles.sysCol, { borderRightColor: theme.border }]}>
          <View style={[styles.sysLogoBox, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.sysLogoLetter, { color: theme.mutedForeground }]}>
              {e.system.name.charAt(0)}
            </Text>
          </View>
          <Text style={[styles.sysName, { color: theme.text }]} numberOfLines={2}>
            {e.system.name}
          </Text>
          <Text style={[styles.sysVendor, { color: theme.mutedForeground }]} numberOfLines={1}>
            {e.system.vendor_name}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DataRow({
  label,
  cells,
  highlight,
}: {
  label: string;
  cells: React.ReactNode[];
  highlight?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.dataRow,
        {
          borderBottomColor: theme.border,
          backgroundColor: highlight ? theme.backgroundElement : 'transparent',
        },
      ]}
    >
      <View style={[styles.labelCol, { borderRightColor: theme.border }]}>
        <Text style={[styles.rowLabel, { color: theme.mutedForeground }]}>{label}</Text>
      </View>
      {cells.map((cell, i) => (
        <View key={i} style={[styles.sysCol, { borderRightColor: theme.border }]}>
          {cell}
        </View>
      ))}
    </View>
  );
}

function Stars({ rating }: { rating: number }) {
  const theme = useTheme();
  const full = Math.floor(rating);
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ color: i <= full ? '#F59E0B' : theme.border, fontSize: 14 }}>
          {i <= full ? '★' : '☆'}
        </Text>
      ))}
      <Text style={[styles.ratingNum, { color: theme.mutedForeground }]}>{rating.toFixed(1)}</Text>
    </View>
  );
}

function OverviewSection({ entries }: { entries: SystemDetailResponse[] }) {
  const theme = useTheme();
  const rows: Array<{ label: string; render: (e: SystemDetailResponse) => React.ReactNode }> = [
    {
      label: 'Category',
      render: (e) => (
        <Text style={[styles.cellText, { color: theme.text }]}>{e.system.category_name}</Text>
      ),
    },
    { label: 'Rating', render: (e) => <Stars rating={Number(e.system.rating)} /> },
    {
      label: 'Starting price',
      render: (e) => (
        <Text style={[styles.cellText, styles.cellBold, { color: theme.text }]}>
          {e.system.starting_price}
        </Text>
      ),
    },
    {
      label: 'Pricing tier',
      render: (e) => (
        <Text style={[styles.cellText, { color: theme.text }]}>{e.system.pricing_tier}</Text>
      ),
    },
    {
      label: 'Deployment',
      render: (e) => (
        <Text style={[styles.cellText, { color: theme.text }]}>{e.system.deployment_type}</Text>
      ),
    },
    {
      label: 'Best fit',
      render: (e) => (
        <Text style={[styles.cellText, { color: theme.text }]}>{e.system.target_size}</Text>
      ),
    },
    {
      label: 'Verified',
      render: (e) => (
        <Text style={{ color: e.system.verified ? theme.verified : theme.mutedForeground, fontSize: 16 }}>
          {e.system.verified ? '✓' : '—'}
        </Text>
      ),
    },
    {
      label: 'Free trial',
      render: (e) => (
        <Text style={{ color: e.system.trial_available ? theme.verified : theme.mutedForeground, fontSize: 16 }}>
          {e.system.trial_available ? '✓' : '—'}
        </Text>
      ),
    },
    {
      label: 'Compliance',
      render: (e) => (
        <Text style={[styles.cellText, { color: theme.mutedForeground }]} numberOfLines={2}>
          {(e.system.security_certifications ?? []).join(', ') || '—'}
        </Text>
      ),
    },
    {
      label: 'Integrations',
      render: (e) => (
        <Text style={[styles.cellText, { color: theme.mutedForeground }]} numberOfLines={3}>
          {e.integrations.map((i) => i.integration_name).join(', ') || '—'}
        </Text>
      ),
    },
  ];
  return (
    <View>
      <SysHeader entries={entries} />
      {rows.map((row, i) => (
        <DataRow
          key={row.label}
          label={row.label}
          highlight={i % 2 === 0}
          cells={entries.map((e) => row.render(e))}
        />
      ))}
    </View>
  );
}

function PackagesSection({ entries }: { entries: SystemDetailResponse[] }) {
  const theme = useTheme();
  const maxPkgs = Math.max(...entries.map((e) => e.plans.length), 1);
  return (
    <View>
      <SysHeader entries={entries} />
      {Array.from({ length: maxPkgs }).map((_, pi) => (
        <DataRow
          key={pi}
          label={`Plan ${pi + 1}`}
          highlight={pi % 2 === 0}
          cells={entries.map((e) => {
            const pkg = e.plans[pi];
            if (!pkg) return <Text style={[styles.cellText, { color: theme.mutedForeground }]}>—</Text>;
            return (
              <View
                style={[
                  styles.pkgCell,
                  pkg.is_popular && { borderColor: theme.primary, borderWidth: 1, borderRadius: Radius.md },
                ]}
              >
                <Text
                  style={[
                    styles.pkgName,
                    { color: theme.text },
                    pkg.is_popular && { color: theme.primary },
                  ]}
                >
                  {pkg.name}
                </Text>
                <Text style={[styles.pkgPrice, { color: theme.text }]}>{pkg.price}</Text>
                <Text style={[styles.pkgBilling, { color: theme.mutedForeground }]}>
                  {pkg.billing_cycle}
                </Text>
                {pkg.is_popular && (
                  <View style={[styles.popularBadge, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.popularText, { color: theme.primaryForeground }]}>Popular</Text>
                  </View>
                )}
              </View>
            );
          })}
        />
      ))}
    </View>
  );
}

function FeaturesSection({
  entries,
  featureKeys,
}: {
  entries: SystemDetailResponse[];
  featureKeys: string[];
}) {
  const theme = useTheme();
  return (
    <View>
      <SysHeader entries={entries} />
      {featureKeys.map((feat, i) => (
        <DataRow
          key={feat}
          label={feat}
          highlight={i % 2 === 0}
          cells={entries.map((e) => {
            const f = e.features.find((x) => x.feature_name === feat);
            const has = f?.feature_value ?? false;
            return (
              <View style={styles.featureCell}>
                <View
                  style={[
                    styles.featureDot,
                    {
                      backgroundColor: has ? theme.verified : 'transparent',
                      borderColor: has ? theme.verified : theme.border,
                    },
                  ]}
                >
                  {has ? (
                    <Text style={styles.featureCheck}>✓</Text>
                  ) : (
                    <Text style={[styles.featureDash, { color: theme.mutedForeground }]}>—</Text>
                  )}
                </View>
              </View>
            );
          })}
        />
      ))}
    </View>
  );
}

function TCOSection({ entries }: { entries: SystemDetailResponse[] }) {
  const theme = useTheme();
  const seats = 50;

  const year1For = (e: SystemDetailResponse) => {
    const popular = e.plans.find((p) => p.is_popular) ?? e.plans[0];
    const monthly = parsePriceNum(popular?.price);
    return monthly * seats * 12;
  };

  const bestYear1Id = entries.reduce((best, e) => {
    const y1 = year1For(e);
    const bestY1 = year1For(best);
    return y1 > 0 && (bestY1 === 0 || y1 < bestY1) ? e : best;
  }, entries[0]).system.id;

  const rows: Array<{ label: string; render: (e: SystemDetailResponse) => React.ReactNode }> = [
    {
      label: 'Per seat / mo',
      render: (e) => {
        const popular = e.plans.find((p) => p.is_popular) ?? e.plans[0];
        const monthly = parsePriceNum(popular?.price);
        return (
          <Text style={[styles.cellBold, styles.cellText, { color: theme.text }]}>
            {monthly ? `$${monthly}` : 'Custom'}
          </Text>
        );
      },
    },
    {
      label: 'Year 1 (est.)',
      render: (e) => {
        const y1 = year1For(e);
        return (
          <Text style={[styles.cellBold, styles.cellText, { color: theme.primary }]}>
            {y1 ? fmt(y1) : '—'}
          </Text>
        );
      },
    },
    {
      label: 'Year 3 total (est.)',
      render: (e) => {
        const y1 = year1For(e);
        return (
          <Text style={[styles.cellBold, styles.cellText, { color: theme.primary }]}>
            {y1 ? fmt(Math.round(y1 * 2.9)) : '—'}
          </Text>
        );
      },
    },
    {
      label: 'Pricing model',
      render: (e) => (
        <Text style={[styles.cellText, { color: theme.text }]}>{e.system.pricing_tier}</Text>
      ),
    },
  ];

  return (
    <View>
      <SysHeader entries={entries} />
      <View style={[styles.tcoCallout, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={[styles.labelCol, { borderRightColor: theme.border }]}>
          <Text style={[styles.tcoCalloutLabel, { color: theme.text }]}>Lowest Y1 cost</Text>
        </View>
        {entries.map((e) => (
          <View key={e.system.id} style={[styles.sysCol, { borderRightColor: theme.border }]}>
            {e.system.id === bestYear1Id && year1For(e) > 0 && (
              <View style={[styles.popularBadge, { backgroundColor: theme.verified }]}>
                <Text style={[styles.popularText, { color: '#fff' }]}>Best value</Text>
              </View>
            )}
          </View>
        ))}
      </View>
      {rows.map((row, i) => (
        <DataRow
          key={row.label}
          label={row.label}
          highlight={i % 2 === 0}
          cells={entries.map((e) => row.render(e))}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  backBtn: { paddingRight: 4 },
  backArrow: { fontSize: 32, lineHeight: 36, fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontSize: 16, textAlign: 'center', fontWeight: '600' },
  emptyHint: { fontSize: 13, textAlign: 'center' },
  sectionScroll: { flexGrow: 0, borderBottomWidth: 1 },
  sectionContent: { paddingHorizontal: Spacing.md, flexDirection: 'row' },
  sectionTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 4,
  },
  sectionTabActive: {},
  sectionLabel: { fontSize: 14, fontWeight: '500' },
  sectionLabelActive: { fontWeight: '700' },
  sysHeaderRow: { flexDirection: 'row', paddingVertical: Spacing.md },
  labelCol: { width: LABEL_W, paddingHorizontal: Spacing.sm, borderRightWidth: 1, justifyContent: 'center' },
  sysCol: { width: COL_W, paddingHorizontal: Spacing.sm, alignItems: 'center', borderRightWidth: 1 },
  sysLogoBox: { width: 36, height: 36, borderRadius: Radius.md, marginBottom: 6, alignItems: 'center', justifyContent: 'center' },
  sysLogoLetter: { fontSize: 16, fontWeight: '700' },
  sysName: { fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 17 },
  sysVendor: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    minHeight: 46,
    alignItems: 'center',
  },
  rowLabel: { fontSize: 12, lineHeight: 16 },
  cellText: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  cellBold: { fontWeight: '700' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  ratingNum: { fontSize: 11, marginLeft: 4 },
  pkgCell: { padding: Spacing.xs, alignItems: 'center', gap: 2, width: '100%' },
  pkgName: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  pkgPrice: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  pkgBilling: { fontSize: 10, textAlign: 'center' },
  popularBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginTop: 3,
  },
  popularText: { fontSize: 9, fontWeight: '700' },
  featureCell: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  featureDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCheck: { color: '#fff', fontSize: 11, fontWeight: '700' },
  featureDash: { fontSize: 12 },
  tcoCallout: {
    flexDirection: 'row',
    borderWidth: 1,
    marginHorizontal: 0,
    paddingVertical: Spacing.sm,
  },
  tcoCalloutLabel: { fontSize: 12, fontWeight: '700' },
});
