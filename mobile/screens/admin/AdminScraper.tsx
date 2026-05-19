import React from 'react';
import { FlatList, View } from 'react-native';
import { Screen, H1, P, Card, Caption, Row, Badge, Button } from '../../components/ui';
import { mockScraperItems } from '../../data/mockData';
import { spacing } from '../../theme';

export default function AdminScraper() {
  return (
    <Screen>
      <H1>Scraper queue</H1>
      <Caption>{mockScraperItems.length} items waiting</Caption>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={mockScraperItems}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <P style={{ fontWeight: '600' }}>{item.name}</P>
                <Caption>{item.source} · confidence {Math.round(item.confidence * 100)}%</Caption>
              </View>
              <Badge tone={item.status === 'pending' ? 'warning' : 'default'}>{item.status}</Badge>
            </Row>
            <View style={{ height: spacing.sm }} />
            <Row>
              <Button title="Assign" variant="outline" style={{ flex: 1 }} />
              <Button title="Review" style={{ flex: 1 }} />
            </Row>
          </Card>
        )}
      />
    </Screen>
  );
}
