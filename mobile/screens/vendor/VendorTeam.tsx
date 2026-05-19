import React from 'react';
import { FlatList, View } from 'react-native';
import { Screen, H1, P, Card, Caption, Row, Badge, Button } from '../../components/ui';
import { spacing } from '../../theme';

const team = [
  { id: '1', name: 'Alex Kim', email: 'alex@acme.com', role: 'Owner' },
  { id: '2', name: 'Jordan Reed', email: 'jordan@acme.com', role: 'Editor' },
  { id: '3', name: 'Sam Patel', email: 'sam@acme.com', role: 'Viewer' },
];

export default function VendorTeam() {
  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <H1>Team</H1>
        <Button title="Invite" />
      </Row>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={team}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <P style={{ fontWeight: '600' }}>{item.name}</P>
                <Caption>{item.email}</Caption>
              </View>
              <Badge>{item.role}</Badge>
            </Row>
          </Card>
        )}
      />
    </Screen>
  );
}
