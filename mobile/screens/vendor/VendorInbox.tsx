import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Screen, H1, P, Card, Caption, Row, Badge, Input, Button } from '../../components/ui';
import { mockThreads } from '../../data/mockData';
import { spacing } from '../../theme';

export default function VendorInbox() {
  const [open, setOpen] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  if (open) {
    const t = mockThreads.find(x => x.id === open)!;
    return (
      <Screen>
        <Button title="← Back" variant="ghost" onPress={() => setOpen(null)} />
        <H1>{t.subject}</H1>
        <Caption>From {t.from}</Caption>
        <View style={{ height: spacing.md }} />
        <Card><P>Hi — could you share a pricing breakdown for 100 seats with annual billing?</P></Card>
        <Input label="Reply" value={reply} onChangeText={setReply} multiline style={{ height: 100, textAlignVertical: 'top' }} />
        <Button title="Send reply" onPress={() => { setReply(''); setOpen(null); }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <H1>Inbox</H1>
      <View style={{ height: spacing.md }} />
      <FlatList
        data={mockThreads}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Row>
                  <P style={{ fontWeight: '600' }}>{item.subject}</P>
                  {item.unread && <Badge tone="warning">New</Badge>}
                </Row>
                <Caption>{item.from} · {item.updated}</Caption>
              </View>
              <Button title="Open" variant="outline" onPress={() => setOpen(item.id)} />
            </Row>
          </Card>
        )}
      />
    </Screen>
  );
}
