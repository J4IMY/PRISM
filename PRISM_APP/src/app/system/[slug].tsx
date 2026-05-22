import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { mockSystems } from '@/lib/mock-data';

const TABS = ['Overview', 'Pricing', 'Features', 'TCO', 'Media'] as const;
type Tab = typeof TABS[number];

const PRICING_PLANS = [
  { name: 'Starter', price: '$15', per: 'per seat / month', features: ['Core features', 'Email support', 'Up to 10 users', 'Basic reporting'] },
  { name: 'Growth', price: '$49', per: 'per seat / month', features: ['Everything in Starter', 'Advanced reporting', 'API access', 'Priority support'] },
  { name: 'Enterprise', price: 'Custom', per: 'contact sales', features: ['Everything in Growth', 'Dedicated CSM', 'Custom integrations', 'SLA guarantee', 'SSO / SAML'] },
];

const FEATURES = [
  { name: 'Single sign-on (SSO)', value: '✓' },
  { name: 'Audit log', value: '✓' },
  { name: 'Custom roles', value: '✓' },
  { name: 'API access', value: '✓' },
  { name: 'SLA 99.99%', value: '—' },
  { name: 'On-prem deployment', value: '—' },
  { name: 'White-label', value: '—' },
];

export default function SystemDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>('Overview');
  const [watchlisted, setWatchlisted] = useState(false);
  const [seats, setSeats] = useState('50');
  const [term, setTerm] = useState('3');
  const [escalation, setEscalation] = useState('5');
  const [discount, setDiscount] = useState('10');

  const system = mockSystems.find(s => s.slug === slug) ?? mockSystems[0];

  const tcoYear1 = parseInt(seats) * 15 * 12 * (1 - parseInt(discount) / 100);
  const tcoYear2 = tcoYear1 * (1 + parseInt(escalation) / 100);
  const tcoYear3 = tcoYear2 * (1 + parseInt(escalation) / 100);
  const tcoTotal = tcoYear1 + (parseInt(term) >= 2 ? tcoYear2 : 0) + (parseInt(term) >= 3 ? tcoYear3 : 0);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={[styles.backArrow, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {system.name}
        </Text>
        <Pressable onPress={() => setWatchlisted(v => !v)} hitSlop={8}>
          <Text style={[styles.heartBtn, { color: watchlisted ? '#E53E3E' : theme.mutedForeground }]}>
            {watchlisted ? '♥' : '♡'}
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.logoBox, { backgroundColor: theme.backgroundElement }]} />
          <View style={styles.heroText}>
            <Text style={[styles.systemName, { color: theme.text }]}>{system.name}</Text>
            <Text style={[styles.systemVendor, { color: theme.mutedForeground }]}>
              {system.vendor} · {system.category}
            </Text>
          </View>
          {system.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.verifiedBg }]}>
              <Text style={[styles.verifiedText, { color: theme.verified }]}>✓ Verified</Text>
            </View>
          )}
        </View>

        <Text style={[styles.tagline, { color: theme.mutedForeground }]}>{system.tagline}</Text>

        <View style={styles.ctaRow}>
          <Pressable
            onPress={() => setWatchlisted(v => !v)}
            style={[styles.ctaBtn, { borderColor: theme.border, flex: 1 }]}
          >
            <Text style={[styles.ctaBtnText, { color: theme.text }]}>
              {watchlisted ? '♥ Saved' : '♡ Watchlist'}
            </Text>
          </Pressable>
          <Pressable style={[styles.ctaBtn, { backgroundColor: theme.primary, flex: 1 }]}>
            <Text style={[styles.ctaBtnText, { color: theme.primaryForeground }]}>Message vendor</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContent}
        >
          {TABS.map(t => {
            const active = t === tab;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? theme.primary : 'transparent',
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={[styles.tabLabel, { color: active ? theme.primaryForeground : theme.textSecondary }]}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.tabBody}>
          {tab === 'Overview' && (
            <>
              <Card theme={theme}>
                <SectionTitle title="About" theme={theme} />
                <Text style={[styles.bodyText, { color: theme.mutedForeground }]}>{system.description}</Text>
              </Card>
              <Card theme={theme}>
                <SectionTitle title="Compliance" theme={theme} />
                <View style={styles.chipRow}>
                  {system.compliance.map(c => (
                    <View key={c} style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
                      <Text style={[styles.chipText, { color: theme.text }]}>{c}</Text>
                    </View>
                  ))}
                </View>
              </Card>
              <Card theme={theme}>
                <SectionTitle title="Integrations" theme={theme} />
                <View style={styles.chipRow}>
                  {system.integrations.map(i => (
                    <View key={i} style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
                      <Text style={[styles.chipText, { color: theme.text }]}>{i}</Text>
                    </View>
                  ))}
                </View>
              </Card>
              <InfoRow label="Starting price" value={system.startingPrice} theme={theme} />
              <InfoRow label="Deployment" value={system.deployment} theme={theme} />
              <InfoRow label="Best fit" value={system.fit} theme={theme} />
              <InfoRow label="Rating" value={`${system.rating} / 5`} theme={theme} />
            </>
          )}

          {tab === 'Pricing' && (
            <>
              {PRICING_PLANS.map(plan => (
                <Card key={plan.name} theme={theme}>
                  <View style={styles.planHeader}>
                    <Text style={[styles.planName, { color: theme.text }]}>{plan.name}</Text>
                    <View style={styles.planPrice}>
                      <Text style={[styles.planPriceMain, { color: theme.text }]}>{plan.price}</Text>
                      <Text style={[styles.planPriceSub, { color: theme.mutedForeground }]}>{plan.per}</Text>
                    </View>
                  </View>
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  {plan.features.map(f => (
                    <View key={f} style={styles.featureRow}>
                      <Text style={[styles.checkmark, { color: theme.verified }]}>✓</Text>
                      <Text style={[styles.featureText, { color: theme.text }]}>{f}</Text>
                    </View>
                  ))}
                  <Pressable style={[styles.planBtn, plan.name === 'Enterprise' ? { borderWidth: 1, borderColor: theme.border } : { backgroundColor: theme.primary }]}>
                    <Text style={[styles.planBtnText, { color: plan.name === 'Enterprise' ? theme.text : theme.primaryForeground }]}>
                      {plan.name === 'Enterprise' ? 'Contact sales' : 'Get started'}
                    </Text>
                  </Pressable>
                </Card>
              ))}
            </>
          )}

          {tab === 'Features' && (
            <Card theme={theme}>
              <SectionTitle title="Feature matrix" theme={theme} />
              {FEATURES.map((f, i) => (
                <View key={f.name}>
                  <View style={[styles.featureMatrixRow]}>
                    <Text style={[styles.featureMatrixName, { color: theme.text }]}>{f.name}</Text>
                    <Text style={[styles.featureMatrixVal, { color: f.value === '✓' ? theme.verified : theme.mutedForeground }]}>
                      {f.value}
                    </Text>
                  </View>
                  {i < FEATURES.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  )}
                </View>
              ))}
            </Card>
          )}

          {tab === 'TCO' && (
            <>
              <Card theme={theme}>
                <SectionTitle title="TCO Inputs" theme={theme} />
                <TcoInput label="Number of seats" value={seats} onChange={setSeats} theme={theme} />
                <TcoInput label="Term length (years)" value={term} onChange={setTerm} theme={theme} />
                <TcoInput label="Annual price escalation %" value={escalation} onChange={setEscalation} theme={theme} />
                <TcoInput label="Discount %" value={discount} onChange={setDiscount} theme={theme} />
              </Card>
              <Card theme={theme} bg={theme.primary}>
                <Text style={[styles.tcoLabel, { color: theme.primaryForeground, opacity: 0.7 }]}>
                  Estimated {term}-year TCO
                </Text>
                <Text style={[styles.tcoTotal, { color: theme.primaryForeground }]}>
                  ${Math.round(tcoTotal).toLocaleString()}
                </Text>
                <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                <TcoRow label="Year 1" value={tcoYear1} color={theme.primaryForeground} />
                {parseInt(term) >= 2 && <TcoRow label="Year 2" value={tcoYear2} color={theme.primaryForeground} />}
                {parseInt(term) >= 3 && <TcoRow label="Year 3" value={tcoYear3} color={theme.primaryForeground} />}
              </Card>
            </>
          )}

          {tab === 'Media' && (
            <View style={styles.mediaGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.mediaItem, { backgroundColor: theme.backgroundElement }]}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ children, theme, bg }: { children: React.ReactNode; theme: any; bg?: string }) {
  return (
    <View style={[styles.card, { backgroundColor: bg ?? theme.card, borderColor: bg ? 'transparent' : theme.border }]}>
      {children}
    </View>
  );
}

function SectionTitle({ title, theme }: { title: string; theme: any }) {
  return <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>;
}

function InfoRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={[styles.infoRow, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function TcoInput({ label, value, onChange, theme }: { label: string; value: string; onChange: (v: string) => void; theme: any }) {
  return (
    <View style={styles.tcoField}>
      <Text style={[styles.tcoFieldLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.tcoFieldInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
      />
    </View>
  );
}

function TcoRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.tcoBreakRow}>
      <Text style={[styles.tcoBreakLabel, { color, opacity: 0.8 }]}>{label}</Text>
      <Text style={[styles.tcoBreakVal, { color }]}>${Math.round(value).toLocaleString()}</Text>
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
  backBtn: { padding: 2 },
  backArrow: { fontSize: 28, lineHeight: 32, fontWeight: '300' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  heartBtn: { fontSize: 22 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  logoBox: { width: 56, height: 56, borderRadius: Radius.md },
  heroText: { flex: 1 },
  systemName: { fontSize: 20, fontWeight: '800' },
  systemVendor: { fontSize: 13, marginTop: 3 },
  verifiedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  verifiedText: { fontSize: 12, fontWeight: '700' },
  tagline: { fontSize: 14, lineHeight: 20, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  ctaBtn: {
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  ctaBtnText: { fontSize: 14, fontWeight: '700' },
  tabScroll: { flexGrow: 0 },
  tabContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
    flexDirection: 'row',
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  tabBody: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6 },
  bodyText: { fontSize: 14, lineHeight: 21 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  chipText: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, marginVertical: Spacing.xs },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '700' },
  planHeader: { gap: 4 },
  planName: { fontSize: 18, fontWeight: '700' },
  planPrice: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  planPriceMain: { fontSize: 28, fontWeight: '800' },
  planPriceSub: { fontSize: 13 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkmark: { fontSize: 14, fontWeight: '700' },
  featureText: { fontSize: 14 },
  planBtn: {
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  planBtnText: { fontSize: 15, fontWeight: '700' },
  featureMatrixRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  featureMatrixName: { fontSize: 14 },
  featureMatrixVal: { fontSize: 14, fontWeight: '700' },
  tcoField: { gap: 6 },
  tcoFieldLabel: { fontSize: 12, fontWeight: '600' },
  tcoFieldInput: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    fontWeight: '600',
  },
  tcoLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  tcoTotal: { fontSize: 40, fontWeight: '800' },
  tcoBreakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tcoBreakLabel: { fontSize: 14 },
  tcoBreakVal: { fontSize: 14, fontWeight: '700' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  mediaItem: {
    width: '47%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.md,
  },
});
