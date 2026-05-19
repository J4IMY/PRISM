import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, H1, H2, P, Card, Input, Button, Caption } from '../../components/ui';
import { useAuth } from '../../App';
import { spacing } from '../../theme';

export default function ProfileScreen({ navigation }: any) {
  const { signOut } = useAuth();
  return (
    <Screen>
      <ScrollView>
        <H1>Profile</H1>
        <View style={{ height: spacing.md }} />
        <Card>
          <H2>Account</H2>
          <View style={{ height: spacing.md }} />
          <Input label="Username" defaultValue="alex.kim" />
          <Input label="Email" defaultValue="alex@acme.com" keyboardType="email-address" />
          <Button title="Save changes" />
        </Card>
        <Card>
          <H2>Change password</H2>
          <View style={{ height: spacing.md }} />
          <Input label="Current password" secureTextEntry />
          <Input label="New password" secureTextEntry />
          <Button title="Update password" />
        </Card>
        <Card>
          <H2>Privacy</H2>
          <View style={{ height: spacing.md }} />
          <Button title="Export my data (JSON)" variant="outline" />
          <View style={{ height: spacing.sm }} />
          <Button title="Request data deletion" variant="destructive" />
          <View style={{ height: spacing.sm }} />
          <Caption>Your request will be reviewed within 30 days (GDPR).</Caption>
        </Card>
        <Button title="Settings" variant="outline" onPress={() => navigation.navigate('Settings')} />
        <View style={{ height: spacing.sm }} />
        <Button title="Sign out" variant="ghost" onPress={signOut} />
      </ScrollView>
    </Screen>
  );
}
