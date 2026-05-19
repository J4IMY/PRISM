import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, H1, H2, P, Card, Row, Caption, Button } from '../../components/ui';
import { useAuth } from '../../App';
import { spacing } from '../../theme';

const stats = [
  { label: 'Listing views', value: '12,480' },
  { label: 'Watchlist adds', value: '342' },
  { label: 'Inquiries', value: '28' },
  { label: 'Compare appearances', value: '1,021' },
];

export default function VendorDashboard({ navigation }: any) {
  const { signOut } = useAuth();
  return (
    <Screen>
      <ScrollView>
        <H1>Vendor dashboard</H1>
        <Caption>Acme Inc.</Caption>
        <View style={{ height: spacing.md }} />
        <Row style={{ flexWrap: 'wrap' }}>
          {stats.map(s => (
            <View key={s.label} style={{ width: '48%', margin: '1%' }}>
              <Card>
                <Caption>{s.label}</Caption>
                <H2 style={{ marginTop: 4 }}>{s.value}</H2>
              </Card>
            </View>
          ))}
        </Row>
        <Card>
          <H2>Recent inquiries</H2>
          <View style={{ height: spacing.sm }} />
          <P>buyer@bigco.com — Pricing question</P>
          <Caption>2h ago</Caption>
          <View style={{ height: spacing.sm }} />
          <P>pm@startup.io — Integration with Linear?</P>
          <Caption>1d ago</Caption>
          <View style={{ height: spacing.md }} />
          <Button title="Open inbox" onPress={() => navigation.navigate('Inbox')} />
        </Card>
        <Button title="Sign out" variant="ghost" onPress={signOut} />
      </ScrollView>
    </Screen>
  );
}
