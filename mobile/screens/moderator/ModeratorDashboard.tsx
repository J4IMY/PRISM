import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, H1, H2, Card, Row, Caption, Button } from '../../components/ui';
import { useAuth } from '../../App';
import { spacing } from '../../theme';

export default function ModeratorDashboard({ navigation }: any) {
  const { signOut } = useAuth();
  return (
    <Screen>
      <ScrollView>
        <H1>Moderator</H1>
        <View style={{ height: spacing.md }} />
        <Row>
          <Card style={{ flex: 1 }}>
            <Caption>Assigned to you</Caption>
            <H2>12</H2>
          </Card>
          <Card style={{ flex: 1 }}>
            <Caption>Resolved today</Caption>
            <H2>5</H2>
          </Card>
        </Row>
        <Button title="Open queue" onPress={() => navigation.navigate('Queue')} />
        <View style={{ height: spacing.sm }} />
        <Button title="Sign out" variant="ghost" onPress={signOut} />
      </ScrollView>
    </Screen>
  );
}
