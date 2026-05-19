import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen, H1, P, Input, Button, Caption } from '../../components/ui';
import { spacing } from '../../theme';

export default function ForgotScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  return (
    <Screen>
      <View style={{ paddingTop: spacing.xxl }}>
        <H1>Reset your password</H1>
        <P muted>We'll send a reset link.</P>
        <View style={{ height: spacing.xl }} />
        <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Button title="Send reset link" onPress={() => navigation.navigate('Reset')} />
        <View style={{ height: spacing.md }} />
        <Caption onPress={() => navigation.goBack()}>Back to sign in</Caption>
      </View>
    </Screen>
  );
}
