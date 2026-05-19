import React, { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { Screen, H1, H2, P, Card, Row, Button, Caption } from '../../components/ui';
import { spacing } from '../../theme';

const themes = ['System', 'Light', 'Dark'];

export default function SettingsScreen() {
  const [theme, setTheme] = useState('System');
  const [vendorReply, setVendorReply] = useState(true);
  const [priceChange, setPriceChange] = useState(false);
  const [digest, setDigest] = useState(true);

  return (
    <Screen>
      <ScrollView>
        <H1>Settings</H1>
        <View style={{ height: spacing.md }} />
        <Card>
          <H2>Theme</H2>
          <View style={{ height: spacing.md }} />
          <Row>
            {themes.map(t => (
              <Button
                key={t} title={t}
                variant={t === theme ? 'primary' : 'outline'}
                style={{ flex: 1 }}
                onPress={() => setTheme(t)}
              />
            ))}
          </Row>
        </Card>
        <Card>
          <H2>Notifications</H2>
          <View style={{ height: spacing.md }} />
          <NotifRow label="New vendor reply" hint="Email me when a vendor responds" value={vendorReply} onChange={setVendorReply} />
          <NotifRow label="Price change on watchlist" hint="Email me on pricing updates" value={priceChange} onChange={setPriceChange} />
          <NotifRow label="Weekly digest" hint="Summary of new systems" value={digest} onChange={setDigest} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

function NotifRow({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 8 }}>
      <View style={{ flex: 1 }}>
        <P style={{ fontWeight: '500' }}>{label}</P>
        <Caption>{hint}</Caption>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </Row>
  );
}
