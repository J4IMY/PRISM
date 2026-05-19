import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, H1, H2, Card, Row, Caption, Button } from '../../components/ui';
import { useAuth } from '../../App';
import { spacing } from '../../theme';

const stats = [
  { label: 'Pending scraper items', value: '14' },
  { label: 'Deletion requests', value: '3' },
  { label: 'Active vendors', value: '128' },
  { label: 'Moderators', value: '7' },
];

export default function AdminDashboard({ navigation }: any) {
  const { signOut } = useAuth();
  return (
    <Screen>
      <ScrollView>
        <H1>Admin</H1>
        <View style={{ height: spacing.md }} />
        <Row style={{ flexWrap: 'wrap' }}>
          {stats.map(s => (
            <View key={s.label} style={{ width: '48%', margin: '1%' }}>
              <Card>
                <Caption>{s.label}</Caption>
                <H2>{s.value}</H2>
              </Card>
            </View>
          ))}
        </Row>
        <Button title="Open scraper queue" onPress={() => navigation.navigate('Scraper Queue')} />
        <View style={{ height: spacing.sm }} />
        <Button title="Review deletions" variant="outline" onPress={() => navigation.navigate('Deletions')} />
        <View style={{ height: spacing.sm }} />
        <Button title="Sign out" variant="ghost" onPress={signOut} />
      </ScrollView>
    </Screen>
  );
}
