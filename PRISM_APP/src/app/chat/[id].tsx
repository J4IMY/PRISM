import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { mockConversations, ChatMessage } from '@/lib/mock-data';

export default function ChatDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conv = mockConversations.find(c => c.id === id);
  const flatRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(conv?.messages ?? []);
  const [draft, setDraft] = useState('');

  if (!conv) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, padding: Spacing.md }}>Conversation not found.</Text>
      </SafeAreaView>
    );
  }

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: `m${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };
    setMessages(prev => [...prev, msg]);
    setDraft('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={[styles.backArrow, { color: theme.primary }]}>‹</Text>
        </Pressable>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={[styles.avatarText, { color: theme.primaryForeground }]}>
            {conv.repName.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={[styles.headerName, { color: theme.text }]}>{conv.repName}</Text>
          <Text style={[styles.headerSub, { color: theme.mutedForeground }]}>
            {conv.repTitle} · {conv.systemName}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/system/[slug]', params: { slug: conv.systemId } })}
          style={[styles.viewBtn, { borderColor: theme.border }]}
        >
          <Text style={[styles.viewBtnText, { color: theme.primary }]}>View</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item, index }) => {
            const isUser = item.sender === 'user';
            const prevSender = index > 0 ? messages[index - 1].sender : null;
            const showTimestamp = index === 0 || messages[index - 1].timestamp !== item.timestamp;
            return (
              <View>
                {showTimestamp && (
                  <Text style={[styles.timestamp, { color: theme.mutedForeground }]}>
                    {item.timestamp}
                  </Text>
                )}
                <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
                  {!isUser && prevSender !== 'vendor' && (
                    <View style={[styles.bubbleAvatar, { backgroundColor: theme.primary }]}>
                      <Text style={[styles.bubbleAvatarText, { color: theme.primaryForeground }]}>
                        {conv.repName.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                  )}
                  {!isUser && prevSender === 'vendor' && (
                    <View style={styles.bubbleAvatarSpacer} />
                  )}
                  <View
                    style={[
                      styles.bubble,
                      isUser
                        ? [styles.bubbleUser, { backgroundColor: theme.primary }]
                        : [styles.bubbleVendor, { backgroundColor: theme.backgroundElement, borderColor: theme.border }],
                    ]}
                  >
                    <Text style={[
                      styles.bubbleText,
                      { color: isUser ? theme.primaryForeground : theme.text },
                    ]}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.composer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              color: theme.text,
            }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.mutedForeground}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <Pressable
            onPress={sendMessage}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: draft.trim() ? theme.primary : theme.backgroundElement, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.sendIcon, { color: draft.trim() ? theme.primaryForeground : theme.mutedForeground }]}>
              ↑
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  backBtn: { paddingRight: 4 },
  backArrow: { fontSize: 32, lineHeight: 36, fontWeight: '300' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700' },
  headerMeta: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  viewBtn: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
  },
  viewBtnText: { fontSize: 13, fontWeight: '600' },
  messageList: {
    padding: Spacing.md,
    gap: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  timestamp: {
    fontSize: 11,
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  bubbleRowUser: { flexDirection: 'row-reverse' },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubbleAvatarText: { fontSize: 10, fontWeight: '700' },
  bubbleAvatarSpacer: { width: 28 },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleVendor: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { fontSize: 20, fontWeight: '700', lineHeight: 24 },
});
