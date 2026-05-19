import React from 'react';
import { FlatList, View } from 'react-native';
import { Screen, H1, P, Card, Caption, Row, Badge, Button } from '../../components/ui';
import { spacing } from '../../theme';

const mods = [
  { id: '1', name: 'Lee Park', queue: 12, active: true },
  { id: '2', name: 'Mira Vance', queue: 4, active: true },
  { id: '3', name: 'Tom Hall', queue: 0, active: false },
];

export default function AdminModerators() {
  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <H1>Moderators</H1>
        <Button title="Invite" />
      </Row>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={mods}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <P style={{ fontWeight: '600' }}>{item.name}</P>
                <Caption>{item.queue} items in queue</Caption>
              </View>
              <Badge tone={item.active ? 'success' : 'default'}>
                {item.active ? 'Active' : 'Inactive'}
              </Badge>
            </Row>
          </Card>
        )}
      />
    </Screen>
  );
}
