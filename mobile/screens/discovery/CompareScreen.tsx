import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, H1, H3, P, Card, Caption, Row, Divider } from '../../components/ui';
import { mockSystems } from '../../data/mockData';
import { spacing } from '../../theme';

export default function CompareScreen() {
  const items = mockSystems.slice(0, 3);
  const rows: [string, (s: typeof items[0]) => string][] = [
    ['Vendor', s => s.vendor],
    ['Category', s => s.category],
    ['Pricing', s => s.pricingTier],
    ['Deployment', s => s.deployment],
    ['Starts at', s => s.startingPrice],
    ['Compliance', s => s.compliance.join(', ')],
  ];
  return (
    <Screen>
      <H1>Compare</H1>
      <Caption>{items.length} systems side-by-side</Caption>
      <View style={{ height: spacing.md }} />
      <ScrollView horizontal>
        <View>
          <Row>
            <View style={{ width: 120 }} />
            {items.map(s => (
              <View key={s.id} style={{ width: 160, paddingHorizontal: 6 }}>
                <H3>{s.name}</H3>
                <Caption>{s.vendor}</Caption>
              </View>
            ))}
          </Row>
          <Divider />
          {rows.map(([label, get]) => (
            <View key={label}>
              <Row style={{ paddingVertical: 10 }}>
                <View style={{ width: 120 }}><Caption>{label}</Caption></View>
                {items.map(s => (
                  <View key={s.id} style={{ width: 160, paddingHorizontal: 6 }}>
                    <P>{get(s)}</P>
                  </View>
                ))}
              </Row>
              <Divider />
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
