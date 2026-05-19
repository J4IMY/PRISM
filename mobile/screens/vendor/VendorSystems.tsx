import React from 'react';
import { FlatList, View } from 'react-native';
import { Screen, H1, P, Card, Caption, Row, Badge, Button } from '../../components/ui';
import { mockSystems } from '../../data/mockData';
import { spacing } from '../../theme';

export default function VendorSystems({ navigation }: any) {
  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <H1>Your systems</H1>
        <Button title="New" onPress={() => navigation.navigate('SystemEdit', { id: 'new' })} />
      </Row>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={mockSystems.slice(0, 3)}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <P style={{ fontWeight: '600' }}>{item.name}</P>
                <Caption>{item.category} · {item.pricingTier}</Caption>
              </View>
              <Badge tone={item.verified ? 'success' : 'warning'}>
                {item.verified ? 'Published' : 'Draft'}
              </Badge>
            </Row>
            <View style={{ height: spacing.sm }} />
            <Button title="Edit" variant="outline" onPress={() => navigation.navigate('SystemEdit', { id: item.id })} />
          </Card>
        )}
      />
    </Screen>
  );
}
