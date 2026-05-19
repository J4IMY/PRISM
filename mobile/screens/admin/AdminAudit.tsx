import React from 'react';
import { FlatList, View } from 'react-native';
import { Screen, H1, P, Card, Caption, Row } from '../../components/ui';
import { mockAudit } from '../../data/mockData';
import { spacing } from '../../theme';

export default function AdminAudit() {
  return (
    <Screen>
      <H1>Audit log</H1>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={mockAudit}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <Card>
            <P style={{ fontWeight: '600' }}>{item.action}</P>
            <Caption>{item.actor} → {item.target}</Caption>
            <Caption>{item.at}</Caption>
          </Card>
        )}
      />
    </Screen>
  );
}
