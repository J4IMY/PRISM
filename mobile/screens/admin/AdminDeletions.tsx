import React from 'react';
import { FlatList, View } from 'react-native';
import { Screen, H1, P, Card, Caption, Row, Badge, Button } from '../../components/ui';
import { mockDeletions } from '../../data/mockData';
import { spacing } from '../../theme';

export default function AdminDeletions() {
  return (
    <Screen>
      <H1>Deletion requests</H1>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={mockDeletions}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <P style={{ fontWeight: '600' }}>{item.user}</P>
                <Caption>Requested {item.requested}</Caption>
              </View>
              <Badge tone={item.status === 'approved' ? 'success' : 'warning'}>{item.status}</Badge>
            </Row>
            {item.status === 'pending' && (
              <>
                <View style={{ height: spacing.sm }} />
                <Row>
                  <Button title="Approve" style={{ flex: 1 }} />
                  <Button title="Deny" variant="outline" style={{ flex: 1 }} />
                </Row>
              </>
            )}
          </Card>
        )}
      />
    </Screen>
  );
}
