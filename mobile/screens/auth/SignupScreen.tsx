import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, H1, P, Input, Button, Caption } from '../../components/ui';
import { spacing } from '../../theme';

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: spacing.xxl }}>
        <H1>Create account</H1>
        <P muted>We'll send a verification email.</P>
        <View style={{ height: spacing.xl }} />
        <Input label="Work email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Password" value={pw} onChangeText={setPw} secureTextEntry />
        <Input label="Confirm password" value={pw2} onChangeText={setPw2} secureTextEntry />
        <Button title="Create account" onPress={() => navigation.navigate('Login')} />
        <View style={{ height: spacing.md }} />
        <Caption>By signing up you agree to our Terms and Privacy Policy.</Caption>
      </ScrollView>
    </Screen>
  );
}
