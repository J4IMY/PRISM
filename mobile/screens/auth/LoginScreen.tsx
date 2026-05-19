import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, H1, P, Input, Button, Caption, Row } from '../../components/ui';
import { useAuth, Role } from '../../App';
import { spacing } from '../../theme';

export default function LoginScreen({ navigation }: any) {
  const { setRole } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const signInAs = (r: Role) => setRole(r);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: spacing.xxl }}>
        <H1>Welcome back</H1>
        <P muted>Sign in to PRISM</P>
        <View style={{ height: spacing.xl }} />
        <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Password" value={pw} onChangeText={setPw} secureTextEntry />
        <Button title="Sign in" onPress={() => signInAs('buyer')} />
        <View style={{ height: spacing.md }} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Caption onPress={() => navigation.navigate('Forgot')}>Forgot password?</Caption>
          <Caption onPress={() => navigation.navigate('Signup')}>Create account</Caption>
        </Row>
        <View style={{ height: spacing.xl }} />
        <Caption>Demo: continue as</Caption>
        <View style={{ height: spacing.sm }} />
        <Row>
          <Button title="Vendor" variant="outline" style={{ flex: 1 }} onPress={() => signInAs('vendor')} />
          <Button title="Moderator" variant="outline" style={{ flex: 1 }} onPress={() => signInAs('moderator')} />
          <Button title="Admin" variant="outline" style={{ flex: 1 }} onPress={() => signInAs('admin')} />
        </Row>
      </ScrollView>
    </Screen>
  );
}
