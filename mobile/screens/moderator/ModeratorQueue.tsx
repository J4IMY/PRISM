import React from 'react';
import { FlatList, View } from 'react-native';
import { Screen, H1, P, Card, Caption, Row, Badge, Button } from '../../components/ui';
import { mockScraperItems } from '../../data/mockData';
import { spacing } from '../../theme';

export default function ModeratorQueue({ navigation }: any) {
  return (
    <Screen>
      <H1>Queue</H1>
      <Caption>{mockScraperItems.length} items</Caption>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={mockScraperItems}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <P style={{ fontWeight: '600' }}>{item.name}</P>
                <Caption>{item.source} · {Math.round(item.confidence * 100)}%</Caption>
              </View>
              <Badge tone="warning">{item.status}</Badge>
            </Row>
            <View style={{ height: spacing.sm }} />
            <Button title="Review" onPress={() => navigation.navigate('Item', { id: item.id })} />
          </Card>
        )}
      />
    </Screen>
  );
}
