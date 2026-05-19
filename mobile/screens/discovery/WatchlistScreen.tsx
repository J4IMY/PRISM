import React from 'react';
import { FlatList, View } from 'react-native';
import { Screen, H1, P, Card, Caption, Row, Badge, Button } from '../../components/ui';
import { mockSystems } from '../../data/mockData';
import { colors, spacing } from '../../theme';

export default function WatchlistScreen() {
  const items = mockSystems.slice(0, 4);
  return (
    <Screen>
      <H1>Watchlist</H1>
      <Caption>{items.length} systems saved</Caption>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <Card>
            <Row>
              <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.muted }} />
              <View style={{ flex: 1 }}>
                <P style={{ fontWeight: '600' }}>{item.name}</P>
                <Caption>{item.vendor}</Caption>
              </View>
              <Badge>{item.pricingTier}</Badge>
            </Row>
            <View style={{ height: spacing.sm }} />
            <Row>
              <Button title="View" variant="outline" style={{ flex: 1 }} />
              <Button title="Remove" variant="ghost" style={{ flex: 1 }} />
            </Row>
          </Card>
        )}
      />
    </Screen>
  );
}
