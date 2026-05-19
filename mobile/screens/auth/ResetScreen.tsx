import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen, H1, P, Input, Button } from '../../components/ui';
import { spacing } from '../../theme';

export default function ResetScreen({ navigation }: any) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  return (
    <Screen>
      <View style={{ paddingTop: spacing.xxl }}>
        <H1>Set a new password</H1>
        <P muted>Choose a strong password (min. 8 characters).</P>
        <View style={{ height: spacing.xl }} />
        <Input label="New password" value={pw} onChangeText={setPw} secureTextEntry />
        <Input label="Confirm new password" value={pw2} onChangeText={setPw2} secureTextEntry />
        <Button title="Update password" onPress={() => navigation.navigate('Login')} />
      </View>
    </Screen>
  );
}
