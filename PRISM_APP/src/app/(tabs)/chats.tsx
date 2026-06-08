import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, Thread } from '@/lib/api';

export default function ChatsScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { threads } = await api.threads.list();
      setConversations(threads);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = query.trim()
    ? conversations.filter(c =>
        (c.system_name ?? '').toLowerCase().includes(query.toLowerCase()) ||
        c.subject.toLowerCase().includes(query.toLowerCase())
      )
    : conversations;

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
          {totalUnread > 0 && (
            <View style={[styles.totalBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.totalBadgeText, { color: theme.primaryForeground }]}>{totalUnread}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search conversations..."
            placeholderTextColor={theme.mutedForeground}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {error ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyBody, { color: theme.mutedForeground }]}>{error}</Text>
          <Pressable onPress={() => router.push('/auth/login')}>
            <Text style={{ color: theme.primary, fontWeight: '700' }}>Sign in</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No conversations yet</Text>
          <Text style={[styles.emptyBody, { color: theme.mutedForeground }]}>
            Contact a vendor from any system page to start a conversation.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
              style={[styles.row, { borderBottomColor: theme.border }]}
            >
              <View style={styles.body}>
                <Text style={[styles.repName, { color: theme.text }]} numberOfLines={1}>{item.subject}</Text>
                {item.system_name && (
                  <Text style={[styles.systemPillText, { color: theme.mutedForeground }]}>{item.system_name}</Text>
                )}
                <Text style={[styles.preview, { color: theme.mutedForeground }]} numberOfLines={2}>
                  {item.last_message ?? 'No messages yet'}
                </Text>
              </View>
              {item.unread_count > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                  <Text style={{ color: theme.primaryForeground, fontSize: 11, fontWeight: '700' }}>{item.unread_count}</Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: 22, fontWeight: '700' },
  totalBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  totalBadgeText: { fontSize: 12, fontWeight: '700' },
  searchWrap: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  searchBox: { borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.sm, height: 40, justifyContent: 'center' },
  searchInput: { fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyBody: { fontSize: 14, textAlign: 'center' },
  list: { paddingVertical: Spacing.xs },
  row: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, alignItems: 'center' },
  body: { flex: 1, gap: 4 },
  repName: { fontSize: 15, fontWeight: '700' },
  systemPillText: { fontSize: 12 },
  preview: { fontSize: 13 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm },
});
