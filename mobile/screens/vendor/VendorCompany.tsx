import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, H1, H2, Card, Input, Button } from '../../components/ui';
import { spacing } from '../../theme';

export default function VendorCompany() {
  return (
    <Screen>
      <ScrollView>
        <H1>Company profile</H1>
        <View style={{ height: spacing.md }} />
        <Card>
          <H2>Basics</H2>
          <View style={{ height: spacing.md }} />
          <Input label="Company name" defaultValue="Acme Inc." />
          <Input label="Website" defaultValue="https://acme.com" />
          <Input label="HQ" defaultValue="San Francisco, US" />
          <Input label="Founded" defaultValue="2014" keyboardType="numeric" />
        </Card>
        <Card>
          <H2>About</H2>
          <View style={{ height: spacing.md }} />
          <Input label="Tagline" defaultValue="Sales pipelines made simple." />
          <Input label="Description" multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top' }} />
        </Card>
        <Button title="Save changes" />
      </ScrollView>
    </Screen>
  );
}
