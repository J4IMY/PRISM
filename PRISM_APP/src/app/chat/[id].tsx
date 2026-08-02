import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { api, Message } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-storage";

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let payload = parts[1];
    payload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4;
    if (pad) payload += "=".repeat(4 - pad);
    const decoded =
      typeof atob !== "undefined" ? atob(payload) : Buffer.from(payload, "base64").toString();
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export default function ChatDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const flatRef = useRef<FlatList>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { user } = await api.auth.me();
        if (user?.id) {
          setCurrentUserId(user.id);
          return;
        }
      } catch {
        // fallback to token
      }
      const token = await getAuthToken();
      if (token) {
        const payload = decodeJwt(token);
        if (payload?.sub) setCurrentUserId(payload.sub as string);
      }
    })();
  }, []);

  const [subject, setSubject] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.threads
      .get(id)
      .then((data) => {
        setSubject(data.thread.subject);
        setMessages(data.messages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !id) return;
    setSending(true);
    try {
      const res = (await api.threads.sendMessage(id, text)) as { message: Message };
      setMessages((prev) => [
        ...prev,
        {
          ...res.message,
          sender_name: res.message.sender_name ?? "You",
        },
      ]);
      setDraft("");
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

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
        <Pressable onPress={() => goBack()} style={styles.backBtn} hitSlop={12}>
          <Text style={[styles.backArrow, { color: theme.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {subject}
        </Text>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messageList}
        extraData={currentUserId}
        renderItem={({ item }) => {
          const isMe = item.sender_id === currentUserId;
          return (
            <View
              style={[
                styles.bubbleWrapper,
                isMe ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isMe ? styles.bubbleRight : styles.bubbleLeft,
                  {
                    backgroundColor: isMe ? theme.primary : theme.backgroundElement,
                    borderColor: isMe ? theme.primary : theme.border,
                  },
                ]}
              >
                {!isMe && (
                  <Text style={[styles.sender, { color: theme.mutedForeground }]}>
                    {item.sender_name}
                  </Text>
                )}
                <Text
                  style={[styles.msgText, { color: isMe ? theme.primaryForeground : theme.text }]}
                >
                  {item.body}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          style={[
            styles.composer,
            { borderTopColor: theme.border, backgroundColor: theme.background },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.backgroundElement,
              },
            ]}
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message…"
            placeholderTextColor={theme.mutedForeground}
            multiline
          />
          <Pressable
            onPress={sendMessage}
            disabled={sending}
            style={[styles.sendBtn, { backgroundColor: theme.primary, opacity: sending ? 0.7 : 1 }]}
          >
            <Text style={{ color: theme.primaryForeground, fontWeight: "700" }}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 28, fontWeight: "300" },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "700" },
  messageList: { padding: Spacing.md, gap: Spacing.sm },
  bubbleWrapper: { flexDirection: "row" },
  bubbleWrapperLeft: { justifyContent: "flex-start" },
  bubbleWrapperRight: { justifyContent: "flex-end" },
  bubble: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    maxWidth: "80%",
  },
  bubbleLeft: {
    borderBottomLeftRadius: Radius.sm,
  },
  bubbleRight: {
    borderBottomRightRadius: Radius.sm,
  },
  sender: { fontSize: 11, marginBottom: 2 },
  msgText: { fontSize: 15, lineHeight: 20, flexWrap: "wrap" },
  composer: {
    flexDirection: "row",
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
  },
  sendBtn: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: "center",
  },
});
