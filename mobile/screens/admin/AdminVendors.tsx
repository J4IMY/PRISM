import React from 'react';
import { FlatList, View } from 'react-native';
import { Screen, H1, P, Card, Caption, Row, Badge, Button } from '../../components/ui';
import { mockSystems } from '../../data/mockData';
import { spacing } from '../../theme';

export default function AdminVendors() {
  return (
    <Screen>
      <H1>Vendors</H1>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={mockSystems}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <P style={{ fontWeight: '600' }}>{item.vendor}</P>
                <Caption>{item.name} · {item.category}</Caption>
              </View>
              <Badge tone={item.verified ? 'success' : 'warning'}>
                {item.verified ? 'Verified' : 'Unverified'}
              </Badge>
            </Row>
            <View style={{ height: spacing.sm }} />
            <Row>
              <Button title="Suspend" variant="outline" style={{ flex: 1 }} />
              <Button title="Open" style={{ flex: 1 }} />
            </Row>
          </Card>
        )}
      />
    </Screen>
  );
}
