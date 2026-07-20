import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme, useThemeMode } from "@/hooks/use-theme";
import { api, AuthUser } from "@/lib/api";
import { clearAuthToken } from "@/lib/auth-storage";

export default function ProfileScreen() {
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState("");

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const { user: me } = await api.auth.me();
      setUser(me);
      setEditingName(me?.name ?? "");
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser]),
  );

  const handleSaveName = async () => {
    setSavingName(true);
    setNameMessage("");
    try {
      const data = await api.profile.updateName(editingName);
      setUser((prev) => (prev ? { ...prev, name: data.name } : prev));
      setNameMessage("Name updated");
    } catch (e) {
      setNameMessage(e instanceof Error ? e.message : "Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    }
    await clearAuthToken();
    setUser(null);
    router.push("/auth/login");
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "Guest";
  const initial = displayName.charAt(0).toUpperCase();
  const isPrivileged = user ? ["admin", "moderator", "vendor"].includes(user.role) : false;

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        </View>
        <View style={styles.guestBox}>
          <Text style={[styles.guestTitle, { color: theme.text }]}>
            Sign in to view your profile
          </Text>
          <Pressable
            onPress={() => router.push("/auth/login")}
            style={[styles.btn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.btnText, { color: theme.primaryForeground }]}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={[styles.avatarInitial, { color: theme.primaryForeground }]}>
              {initial}
            </Text>
          </View>
          <View>
            <Text style={[styles.displayName, { color: theme.text }]}>{displayName}</Text>
            <Text style={[styles.email, { color: theme.mutedForeground }]}>{user.email}</Text>
          </View>
        </View>

        <Section title="Account" theme={theme}>
          <Field label="Name" value={user.name ?? ""} theme={theme} editable={false} />
          <Field label="Email" value={user.email} theme={theme} editable={false} />
          <Field label="Role" value={user.role} theme={theme} editable={false} />
        </Section>

        <Section title="Appearance" theme={theme}>
          <View style={[styles.themeRow, { borderColor: theme.border }]}>
            {(["system", "light", "dark"] as const).map((opt) => {
              const label = opt === "system" ? "System" : opt === "light" ? "Light" : "Dark";
              const active = mode === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    setMode(opt);
                    api.theme.set(opt).catch(() => {});
                  }}
                  style={[
                    styles.themeOpt,
                    {
                      backgroundColor: active ? theme.primary : "transparent",
                      borderRadius: Radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.themeOptText,
                      { color: active ? theme.primaryForeground : theme.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <View style={styles.bottomActions}>
          <OutlineButton label="Sign out" onPress={handleSignOut} theme={theme} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: any;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View
        style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        {children}
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  theme,
  editable = true,
}: {
  label: string;
  value: string;
  theme: any;
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          {
            color: theme.text,
            borderColor: theme.border,
            backgroundColor: theme.backgroundElement,
            opacity: editable ? 1 : 0.7,
          },
        ]}
        value={value}
        editable={editable}
        placeholderTextColor={theme.mutedForeground}
      />
    </View>
  );
}

function OutlineButton({
  label,
  onPress,
  theme,
}: {
  label: string;
  onPress: () => void;
  theme: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { borderWidth: 1, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.btnText, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: "700" },
  guestBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  guestTitle: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 22, fontWeight: "700" },
  displayName: { fontSize: 17, fontWeight: "700" },
  email: { fontSize: 13, marginTop: 2 },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  sectionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  fieldInput: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  btn: {
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  btnText: { fontSize: 15, fontWeight: "600" },
  themeRow: {
    flexDirection: "row",
    padding: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 2,
  },
  themeOpt: { flex: 1, paddingVertical: 8, alignItems: "center" },
  themeOptText: { fontSize: 13, fontWeight: "600" },
  bottomActions: { gap: Spacing.sm },
});
