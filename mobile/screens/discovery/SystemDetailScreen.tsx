import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, H1, H2, H3, P, Card, Badge, Row, Button, Caption, Divider, Input } from '../../components/ui';
import { mockSystems } from '../../data/mockData';
import { colors, spacing } from '../../theme';

const tabs = ['Overview', 'Pricing', 'Features', 'TCO', 'Media'] as const;
type Tab = typeof tabs[number];

export default function SystemDetailScreen({ route }: any) {
  const slug = route?.params?.slug ?? mockSystems[0].slug;
  const system = mockSystems.find(s => s.slug === slug) ?? mockSystems[0];
  const [tab, setTab] = useState<Tab>('Overview');
  const [seats, setSeats] = useState('50');

  return (
    <Screen>
      <ScrollView>
        <Row>
          <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.muted }} />
          <View style={{ flex: 1 }}>
            <H1 style={{ fontSize: 22 }}>{system.name}</H1>
            <Caption>{system.vendor} · {system.category}</Caption>
          </View>
          {system.verified && <Badge tone="success">Verified</Badge>}
        </Row>
        <View style={{ height: spacing.md }} />
        <P>{system.tagline}</P>
        <View style={{ height: spacing.md }} />
        <Row>
          <Button title="Watchlist" variant="outline" style={{ flex: 1 }} />
          <Button title="Message vendor" style={{ flex: 1 }} />
        </Row>
        <View style={{ height: spacing.lg }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map(t => (
            <View key={t} style={{ marginRight: 8 }}>
              <Button title={t} variant={t === tab ? 'primary' : 'outline'} onPress={() => setTab(t)} />
            </View>
          ))}
        </ScrollView>
        <View style={{ height: spacing.md }} />

        {tab === 'Overview' && (
          <>
            <Card><P>{system.description}</P></Card>
            <Card><H3>Compliance</H3><Caption>{system.compliance.join(', ')}</Caption></Card>
            <Card><H3>Integrations</H3><Caption>{system.integrations.join(', ')}</Caption></Card>
            <Card><H3>Starting price</H3><Caption>{system.startingPrice}</Caption></Card>
          </>
        )}

        {tab === 'Pricing' && (
          <>
            {['Starter', 'Growth', 'Enterprise'].map((t, i) => (
              <Card key={t}>
                <H2>{t}</H2>
                <H1>${[15, 49, 0][i] || 'Custom'}</H1>
                <Caption>{i < 2 ? 'per seat / month' : 'contact sales'}</Caption>
                <Divider />
                <P>· Core features</P>
                <P>· Email support</P>
                {i >= 1 && <P>· Advanced reporting</P>}
                {i === 2 && <P>· Dedicated CSM</P>}
              </Card>
            ))}
          </>
        )}

        {tab === 'Features' && (
          <Card>
            {[
              ['Single sign-on (SSO)', '✓'],
              ['Audit log', '✓'],
              ['Custom roles', '✓'],
              ['SLA 99.99%', '—'],
              ['On-prem deployment', '—'],
            ].map(([n, v]) => (
              <Row key={n} style={{ justifyContent: 'space-between', paddingVertical: 8 }}>
                <P>{n}</P><P muted>{v}</P>
              </Row>
            ))}
          </Card>
        )}

        {tab === 'TCO' && (
          <>
            <Card>
              <Input label="Seats" value={seats} onChangeText={setSeats} keyboardType="numeric" />
              <Input label="Term length (years)" defaultValue="3" keyboardType="numeric" />
              <Input label="Annual escalation %" defaultValue="5" keyboardType="numeric" />
              <Input label="Discount %" defaultValue="10" keyboardType="numeric" />
              <Input label="Implementation cost" defaultValue="5000" keyboardType="numeric" />
            </Card>
            <Card style={{ backgroundColor: colors.muted }}>
              <Caption>Estimated TCO (3 years)</Caption>
              <H1>$182,400</H1>
              <Divider />
              <Row style={{ justifyContent: 'space-between' }}><P>Year 1</P><P>$56,000</P></Row>
              <Row style={{ justifyContent: 'space-between' }}><P>Year 2</P><P>$60,800</P></Row>
              <Row style={{ justifyContent: 'space-between' }}><P>Year 3</P><P>$65,600</P></Row>
            </Card>
          </>
        )}

        {tab === 'Media' && (
          <Row style={{ flexWrap: 'wrap' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={{ width: '48%', aspectRatio: 16 / 9, backgroundColor: colors.muted, borderRadius: 10, margin: '1%' }} />
            ))}
          </Row>
        )}
      </ScrollView>
    </Screen>
  );
}
