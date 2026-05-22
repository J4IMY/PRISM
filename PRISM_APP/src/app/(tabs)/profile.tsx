import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={[styles.avatarInitial, { color: theme.primaryForeground }]}>A</Text>
          </View>
          <View>
            <Text style={[styles.displayName, { color: theme.text }]}>alex.kim</Text>
            <Text style={[styles.email, { color: theme.mutedForeground }]}>alex@acme.com</Text>
          </View>
        </View>

        <Section title="Account" theme={theme}>
          <Field label="Username" value="alex.kim" theme={theme} />
          <Field label="Email" value="alex@acme.com" keyboardType="email-address" theme={theme} />
          <PrimaryButton label="Save changes" onPress={() => {}} theme={theme} />
        </Section>

        <Section title="Change Password" theme={theme}>
          <Field label="Current password" secure theme={theme} />
          <Field label="New password" secure theme={theme} />
          <Field label="Confirm new password" secure theme={theme} />
          <PrimaryButton label="Update password" onPress={() => {}} theme={theme} />
        </Section>

        <Section title="Privacy" theme={theme}>
          <OutlineButton label="Export my data (JSON)" onPress={() => {}} theme={theme} />
          <View style={{ height: Spacing.sm }} />
          <View style={[styles.gdprNote, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.gdprText, { color: theme.mutedForeground }]}>
              Data deletion requests are processed within 30 days per GDPR requirements.
            </Text>
          </View>
          <View style={{ height: Spacing.sm }} />
          <DestructiveButton label="Request data deletion" onPress={() => {}} theme={theme} />
        </Section>

        <Section title="Appearance" theme={theme}>
          <View style={[styles.themeRow, { borderColor: theme.border }]}>
            {(['System', 'Light', 'Dark'] as const).map(opt => (
              <Pressable
                key={opt}
                style={[
                  styles.themeOpt,
                  {
                    backgroundColor: opt === 'System' ? theme.primary : 'transparent',
                    borderRadius: Radius.sm,
                  },
                ]}
              >
                <Text style={[styles.themeOptText, { color: opt === 'System' ? theme.primaryForeground : theme.textSecondary }]}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <View style={styles.bottomActions}>
          <OutlineButton label="Sign out" onPress={() => {}} theme={theme} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children, theme }: { title: string; children: React.ReactNode; theme: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );
}

function Field({ label, value, secure, keyboardType, theme }: {
  label: string;
  value?: string;
  secure?: boolean;
  keyboardType?: any;
  theme: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
        defaultValue={value}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        placeholderTextColor={theme.mutedForeground}
        placeholder={secure ? '••••••••' : undefined}
      />
    </View>
  );
}

function PrimaryButton({ label, onPress, theme }: { label: string; onPress: () => void; theme: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }]}
    >
      <Text style={[styles.btnText, { color: theme.primaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

function OutlineButton({ label, onPress, theme }: { label: string; onPress: () => void; theme: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, { borderWidth: 1, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }]}
    >
      <Text style={[styles.btnText, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

function DestructiveButton({ label, onPress, theme }: { label: string; onPress: () => void; theme: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, { backgroundColor: theme.destructive, opacity: pressed ? 0.8 : 1 }]}
    >
      <Text style={[styles.btnText, { color: theme.destructiveFg }]}>{label}</Text>
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
  title: { fontSize: 22, fontWeight: '700' },
  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 22, fontWeight: '700' },
  displayName: { fontSize: 17, fontWeight: '700' },
  email: { fontSize: 13, marginTop: 2 },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  btnText: { fontSize: 15, fontWeight: '600' },
  gdprNote: {
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  gdprText: { fontSize: 13, lineHeight: 18 },
  themeRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 2,
  },
  themeOpt: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  themeOptText: { fontSize: 13, fontWeight: '600' },
  bottomActions: { gap: Spacing.sm },
});
