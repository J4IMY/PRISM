import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { mockConversations, MockConversation } from '@/lib/mock-data';

export default function ChatsScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState(mockConversations);

  const filtered = query.trim()
    ? conversations.filter(c =>
        c.systemName.toLowerCase().includes(query.toLowerCase()) ||
        c.repName.toLowerCase().includes(query.toLowerCase())
      )
    : conversations;

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  const openChat = (conv: MockConversation) => {
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c)
    );
    router.push({ pathname: '/chat/[id]', params: { id: conv.id } });
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
          {totalUnread > 0 && (
            <View style={[styles.totalBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.totalBadgeText, { color: theme.primaryForeground }]}>
                {totalUnread}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
          {conversations.length} conversations
        </Text>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: theme.background }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Text style={[styles.searchIcon, { color: theme.mutedForeground }]}>⌕</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search conversations..."
            placeholderTextColor={theme.mutedForeground}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyIcon, { color: theme.mutedForeground }]}>💬</Text>
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
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openChat(item)}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? theme.backgroundElement : theme.background },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Text style={[styles.avatarText, { color: theme.primaryForeground }]}>
                  {item.repName.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>

              <View style={styles.body}>
                <View style={styles.topRow}>
                  <View style={styles.nameGroup}>
                    <Text style={[styles.repName, { color: theme.text }]} numberOfLines={1}>
                      {item.repName}
                    </Text>
                    <View style={[styles.systemPill, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                      <Text style={[styles.systemPillText, { color: theme.mutedForeground }]}>
                        {item.systemName}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.time, { color: theme.mutedForeground }]}>
                    {item.lastMessageTime}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text
                    style={[
                      styles.preview,
                      { color: item.unread > 0 ? theme.text : theme.mutedForeground },
                      item.unread > 0 && styles.previewBold,
                    ]}
                    numberOfLines={2}
                  >
                    {item.lastMessage}
                  </Text>
                  {item.unread > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                      <Text style={[styles.unreadText, { color: theme.primaryForeground }]}>
                        {item.unread}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: 22, fontWeight: '700' },
  totalBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  totalBadgeText: { fontSize: 12, fontWeight: '700' },
  subtitle: { fontSize: 13, fontWeight: '500' },
  searchWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    height: 40,
  },
  searchIcon: { fontSize: 18, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  list: { paddingVertical: Spacing.xs },
  separator: { height: 1, marginLeft: 80 },
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  body: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
  nameGroup: { flex: 1, gap: 4 },
  repName: { fontSize: 15, fontWeight: '700' },
  systemPill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  systemPillText: { fontSize: 11, fontWeight: '500' },
  time: { fontSize: 12, flexShrink: 0, marginTop: 2 },
  previewRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  preview: { flex: 1, fontSize: 13, lineHeight: 18 },
  previewBold: { fontWeight: '600' },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    flexShrink: 0,
  },
  unreadText: { fontSize: 11, fontWeight: '700' },
});
