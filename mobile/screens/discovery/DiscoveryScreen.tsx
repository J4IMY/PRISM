import React, { useMemo, useState } from 'react';
import { FlatList, View, TouchableOpacity, ScrollView } from 'react-native';
import { Screen, H2, P, Card, Input, Badge, Row, Caption } from '../../components/ui';
import { mockSystems } from '../../data/mockData';
import { colors, spacing } from '../../theme';

const categories = ['All', 'CRM', 'ERP', 'Helpdesk', 'Analytics', 'Security'];

export default function DiscoveryScreen({ navigation }: any) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  const results = useMemo(() => {
    return mockSystems.filter(s => {
      const matchQ = !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.vendor.toLowerCase().includes(q.toLowerCase());
      const matchC = cat === 'All' || s.category === cat;
      return matchQ && matchC;
    });
  }, [q, cat]);

  return (
    <Screen>
      <Input placeholder="Search systems, vendors, categories…" value={q} onChangeText={setQ} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {categories.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => setCat(c)}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
              backgroundColor: c === cat ? colors.primary : colors.muted, marginRight: 8,
            }}
          >
            <P style={{ color: c === cat ? colors.primaryForeground : colors.foreground, fontSize: 13 }}>{c}</P>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Caption>{results.length} systems</Caption>
      <View style={{ height: spacing.sm }} />
      <FlatList
        data={results}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('SystemDetail', { slug: item.slug })}>
            <Card>
              <Row>
                <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.muted }} />
                <View style={{ flex: 1 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <H2 style={{ fontSize: 16 }}>{item.name}</H2>
                    {item.verified && <Badge tone="success">Verified</Badge>}
                  </Row>
                  <Caption>{item.vendor} · {item.category}</Caption>
                </View>
              </Row>
              <View style={{ height: spacing.sm }} />
              <P muted>{item.tagline}</P>
              <View style={{ height: spacing.sm }} />
              <Row>
                <Badge>{item.pricingTier}</Badge>
                <Badge>{item.deployment}</Badge>
                <Caption style={{ marginLeft: 'auto' }}>{item.startingPrice}</Caption>
              </Row>
            </Card>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}
