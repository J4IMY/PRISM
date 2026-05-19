import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, H1, H2, P, Card, Caption, Row, Badge, Input, Button, Divider } from '../../components/ui';
import { mockScraperItems, mockSystems } from '../../data/mockData';
import { spacing } from '../../theme';

export default function ModeratorItem({ route, navigation }: any) {
  const id = route?.params?.id ?? mockScraperItems[0].id;
  const item = mockScraperItems.find(i => i.id === id) ?? mockScraperItems[0];
  const dupe = mockSystems[0];

  return (
    <Screen>
      <ScrollView>
        <H1>Review item</H1>
        <Caption>{item.source}</Caption>
        <View style={{ height: spacing.md }} />
        <Card>
          <H2>Scraped data</H2>
          <View style={{ height: spacing.sm }} />
          <Input label="Name" defaultValue={item.name} />
          <Input label="Category" defaultValue="CRM" />
          <Input label="Vendor" defaultValue="Unknown" />
          <Input label="Website" defaultValue="https://example.com" />
        </Card>

        <Card style={{ borderColor: '#f59e0b' }}>
          <Row>
            <H2>Possible duplicate</H2>
            <Badge tone="warning">85% match</Badge>
          </Row>
          <Divider />
          <P style={{ fontWeight: '600' }}>{dupe.name}</P>
          <Caption>{dupe.vendor} · {dupe.category}</Caption>
          <View style={{ height: spacing.sm }} />
          <Row>
            <Button title="Merge" variant="outline" style={{ flex: 1 }} />
            <Button title="Not a duplicate" variant="ghost" style={{ flex: 1 }} />
          </Row>
        </Card>

        <Row>
          <Button title="Reject" variant="destructive" style={{ flex: 1 }} onPress={() => navigation.goBack()} />
          <Button title="Approve" style={{ flex: 1 }} onPress={() => navigation.goBack()} />
        </Row>
      </ScrollView>
    </Screen>
  );
}
