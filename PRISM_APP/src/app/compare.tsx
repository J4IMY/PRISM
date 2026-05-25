import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  mockSystems,
  comparisonData,
  FEATURE_KEYS,
} from '@/lib/mock-data';

const COL_W = 130;
const LABEL_W = 140;

const SECTIONS = ['Overview', 'Packages', 'Features', 'TCO'] as const;
type Section = typeof SECTIONS[number];

function fmt(n: number) {
  return '$' + n.toLocaleString();
}

export default function CompareScreen() {
  const theme = useTheme();
  const { ids } = useLocalSearchParams<{ ids: string }>();
  const [section, setSection] = useState<Section>('Overview');

  const systemIds = (ids ?? '').split(',').filter(Boolean);
  const systems = systemIds.map(id => mockSystems.find(s => s.id === id)).filter(Boolean) as typeof mockSystems;

  if (systems.length < 2) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Text style={[styles.backArrow, { color: theme.primary }]}>‹</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Compare</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Select at least 2 systems to compare.</Text>
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
          Compare · {systems.length} systems
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.sectionScroll, { borderBottomColor: theme.border }]}
        contentContainerStyle={styles.sectionContent}
      >
        {SECTIONS.map(s => (
          <Pressable
            key={s}
            onPress={() => setSection(s)}
            style={[
              styles.sectionTab,
              section === s && [styles.sectionTabActive, { borderBottomColor: theme.primary }],
            ]}
          >
            <Text style={[
              styles.sectionLabel,
              { color: section === s ? theme.primary : theme.mutedForeground },
              section === s && styles.sectionLabelActive,
            ]}>
              {s}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {section === 'Overview' && (
              <OverviewSection systems={systems} />
            )}
            {section === 'Packages' && (
              <PackagesSection systems={systems} />
            )}
            {section === 'Features' && (
              <FeaturesSection systems={systems} />
            )}
            {section === 'TCO' && (
              <TCOSection systems={systems} />
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

function SysHeader({ systems }: { systems: typeof mockSystems }) {
  const theme = useTheme();
  return (
    <View style={styles.sysHeaderRow}>
      <View style={[styles.labelCol, { borderRightColor: theme.border }]} />
      {systems.map(s => (
        <View key={s.id} style={[styles.sysCol, { borderRightColor: theme.border }]}>
          <View style={[styles.sysLogoBox, { backgroundColor: theme.backgroundElement }]} />
          <Text style={[styles.sysName, { color: theme.text }]} numberOfLines={2}>{s.name}</Text>
          <Text style={[styles.sysVendor, { color: theme.mutedForeground }]} numberOfLines={1}>{s.vendor}</Text>
        </View>
      ))}
    </View>
  );
}

function RowGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.groupHeader, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.labelCol, { borderRightColor: theme.border }]}>
        <Text style={[styles.groupLabel, { color: theme.mutedForeground }]}>{label}</Text>
      </View>
      {children}
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
    <View style={[styles.dataRow, { borderBottomColor: theme.border, backgroundColor: highlight ? theme.backgroundElement : 'transparent' }]}>
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
  const half = rating - full >= 0.5;
  return (
    <View style={styles.starsRow}>
      {[1,2,3,4,5].map(i => (
        <Text key={i} style={{ color: i <= full ? '#F59E0B' : (i === full + 1 && half ? '#F59E0B' : theme.border), fontSize: 14 }}>
          {i <= full ? '★' : (i === full + 1 && half ? '⯨' : '☆')}
        </Text>
      ))}
      <Text style={[styles.ratingNum, { color: theme.mutedForeground }]}>{rating.toFixed(1)}</Text>
    </View>
  );
}

function OverviewSection({ systems }: { systems: typeof mockSystems }) {
  const theme = useTheme();
  const rows: Array<{ label: string; render: (s: typeof mockSystems[0]) => React.ReactNode }> = [
    { label: 'Category', render: s => <Text style={[styles.cellText, { color: theme.text }]}>{s.category}</Text> },
    { label: 'Rating', render: s => <Stars rating={s.rating} /> },
    {
      label: 'Starting price', render: s => (
        <Text style={[styles.cellText, styles.cellBold, { color: theme.text }]}>{s.startingPrice}</Text>
      )
    },
    { label: 'Pricing tier', render: s => <Text style={[styles.cellText, { color: theme.text }]}>{s.pricingTier}</Text> },
    { label: 'Deployment', render: s => <Text style={[styles.cellText, { color: theme.text }]}>{s.deployment}</Text> },
    { label: 'Best fit', render: s => <Text style={[styles.cellText, { color: theme.text }]}>{s.fit}</Text> },
    {
      label: 'Verified', render: s => (
        <Text style={{ color: s.verified ? theme.verified : theme.mutedForeground, fontSize: 16 }}>
          {s.verified ? '✓' : '—'}
        </Text>
      )
    },
    {
      label: 'Free trial', render: s => (
        <Text style={{ color: s.freeTrial ? theme.verified : theme.mutedForeground, fontSize: 16 }}>
          {s.freeTrial ? '✓' : '—'}
        </Text>
      )
    },
    {
      label: 'Compliance', render: s => (
        <Text style={[styles.cellText, { color: theme.mutedForeground }]} numberOfLines={2}>
          {s.compliance.join(', ')}
        </Text>
      )
    },
    {
      label: 'Integrations', render: s => (
        <Text style={[styles.cellText, { color: theme.mutedForeground }]} numberOfLines={3}>
          {s.integrations.join(', ')}
        </Text>
      )
    },
  ];
  return (
    <View>
      <SysHeader systems={systems} />
      {rows.map((row, i) => (
        <DataRow
          key={row.label}
          label={row.label}
          highlight={i % 2 === 0}
          cells={systems.map(s => row.render(s))}
        />
      ))}
    </View>
  );
}

function PackagesSection({ systems }: { systems: typeof mockSystems }) {
  const theme = useTheme();
  const maxPkgs = Math.max(...systems.map(s => (comparisonData[s.id]?.packages ?? []).length));
  return (
    <View>
      <SysHeader systems={systems} />
      {Array.from({ length: maxPkgs }).map((_, pi) => (
        <DataRow
          key={pi}
          label={`Plan ${pi + 1}`}
          highlight={pi % 2 === 0}
          cells={systems.map(s => {
            const pkg = comparisonData[s.id]?.packages[pi];
            if (!pkg) return <Text style={[styles.cellText, { color: theme.mutedForeground }]}>—</Text>;
            return (
              <View style={[styles.pkgCell, pkg.highlight && { borderColor: theme.primary, borderWidth: 1, borderRadius: Radius.md }]}>
                <Text style={[styles.pkgName, { color: theme.text }, pkg.highlight && { color: theme.primary }]}>{pkg.name}</Text>
                <Text style={[styles.pkgPrice, { color: theme.text }]}>{pkg.price}</Text>
                <Text style={[styles.pkgBilling, { color: theme.mutedForeground }]}>{pkg.billing}</Text>
                {pkg.highlight && (
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

function FeaturesSection({ systems }: { systems: typeof mockSystems }) {
  const theme = useTheme();
  return (
    <View>
      <SysHeader systems={systems} />
      {FEATURE_KEYS.map((feat, i) => (
        <DataRow
          key={feat}
          label={feat}
          highlight={i % 2 === 0}
          cells={systems.map(s => {
            const has = comparisonData[s.id]?.features[feat] ?? false;
            return (
              <View style={styles.featureCell}>
                <View style={[
                  styles.featureDot,
                  { backgroundColor: has ? theme.verified : 'transparent', borderColor: has ? theme.verified : theme.border },
                ]}>
                  {has && <Text style={styles.featureCheck}>✓</Text>}
                  {!has && <Text style={[styles.featureDash, { color: theme.mutedForeground }]}>—</Text>}
                </View>
              </View>
            );
          })}
        />
      ))}
    </View>
  );
}

function TCOSection({ systems }: { systems: typeof mockSystems }) {
  const theme = useTheme();
  const rows: Array<{ label: string; render: (s: typeof mockSystems[0]) => React.ReactNode }> = [
    {
      label: 'Per seat / mo',
      render: s => {
        const d = comparisonData[s.id];
        return <Text style={[styles.cellBold, styles.cellText, { color: theme.text }]}>
          {d?.tcoPerSeatPerMonth ? `$${d.tcoPerSeatPerMonth}` : 'Custom'}
        </Text>;
      }
    },
    {
      label: 'Setup cost',
      render: s => {
        const d = comparisonData[s.id];
        return <Text style={[styles.cellText, { color: theme.text }]}>
          {d?.tcoSetupCost === 0 ? 'Free' : d ? fmt(d.tcoSetupCost) : '—'}
        </Text>;
      }
    },
    {
      label: 'Year 1 (est.)',
      render: s => {
        const d = comparisonData[s.id];
        return <Text style={[styles.cellBold, styles.cellText, { color: theme.primary }]}>
          {d ? fmt(d.tcoYear1) : '—'}
        </Text>;
      }
    },
    {
      label: 'Year 3 total (est.)',
      render: s => {
        const d = comparisonData[s.id];
        return <Text style={[styles.cellBold, styles.cellText, { color: theme.primary }]}>
          {d ? fmt(d.tcoYear3) : '—'}
        </Text>;
      }
    },
    {
      label: 'Pricing model',
      render: s => <Text style={[styles.cellText, { color: theme.text }]}>{s.pricingTier}</Text>,
    },
    {
      label: 'Compliance',
      render: s => <Text style={[styles.cellText, { color: theme.mutedForeground }]} numberOfLines={2}>{s.compliance.join(' · ')}</Text>,
    },
  ];

  const bestYear1Id = systems.reduce((best, s) => {
    const d = comparisonData[s.id];
    if (!d) return best;
    const bestD = comparisonData[best];
    if (!bestD || d.tcoYear1 < bestD.tcoYear1) return s.id;
    return best;
  }, systems[0].id);

  return (
    <View>
      <SysHeader systems={systems} />
      <View style={[styles.tcoCallout, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={[styles.labelCol, { borderRightColor: theme.border }]}>
          <Text style={[styles.tcoCalloutLabel, { color: theme.text }]}>Lowest Y1 cost</Text>
        </View>
        {systems.map(s => (
          <View key={s.id} style={[styles.sysCol, { borderRightColor: theme.border }]}>
            {s.id === bestYear1Id && (
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
          cells={systems.map(s => row.render(s))}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 16, textAlign: 'center' },
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
  sysHeaderRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
  },
  labelCol: { width: LABEL_W, paddingHorizontal: Spacing.sm, borderRightWidth: 1, justifyContent: 'center' },
  sysCol: { width: COL_W, paddingHorizontal: Spacing.sm, alignItems: 'center', borderRightWidth: 1 },
  sysLogoBox: { width: 36, height: 36, borderRadius: Radius.md, marginBottom: 6 },
  sysName: { fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 17 },
  sysVendor: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  groupHeader: { flexDirection: 'row', paddingVertical: 6 },
  groupLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
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
