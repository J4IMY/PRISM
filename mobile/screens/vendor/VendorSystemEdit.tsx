import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, H1, H2, Card, Input, Button, Row } from '../../components/ui';
import { spacing } from '../../theme';

const tabs = ['Overview', 'Pricing', 'Features', 'SEO'] as const;
type Tab = typeof tabs[number];

export default function VendorSystemEdit() {
  const [tab, setTab] = useState<Tab>('Overview');
  return (
    <Screen>
      <ScrollView>
        <H1>Edit system</H1>
        <View style={{ height: spacing.md }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map(t => (
            <View key={t} style={{ marginRight: 8 }}>
              <Button title={t} variant={t === tab ? 'primary' : 'outline'} onPress={() => setTab(t)} />
            </View>
          ))}
        </ScrollView>
        <View style={{ height: spacing.md }} />

        {tab === 'Overview' && (
          <Card>
            <Input label="Name" defaultValue="Acme CRM" />
            <Input label="Category" defaultValue="CRM" />
            <Input label="Tagline" defaultValue="Sales pipelines made simple." />
            <Input label="Description" multiline style={{ height: 100, textAlignVertical: 'top' }} />
          </Card>
        )}

        {tab === 'Pricing' && (
          <Card>
            <Input label="Starting price" defaultValue="$15/seat/mo" />
            <Input label="Pricing tier (Free/Paid/Enterprise)" defaultValue="Paid" />
            <Input label="Free trial (days)" defaultValue="14" keyboardType="numeric" />
          </Card>
        )}

        {tab === 'Features' && (
          <Card>
            <H2>Toggle features</H2>
            <View style={{ height: spacing.sm }} />
            {['SSO', 'Audit log', 'Custom roles', 'SLA 99.99%', 'On-prem'].map(f => (
              <Row key={f} style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
                <Input label={f} placeholder="Included? yes/no" />
              </Row>
            ))}
          </Card>
        )}

        {tab === 'SEO' && (
          <Card>
            <Input label="SEO title" defaultValue="Acme CRM — Sales pipelines" />
            <Input label="Meta description" multiline style={{ height: 80, textAlignVertical: 'top' }} />
            <Input label="Canonical URL" defaultValue="https://prism.io/systems/acme-crm" />
          </Card>
        )}

        <Button title="Save" />
      </ScrollView>
    </Screen>
  );
}
