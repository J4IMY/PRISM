import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={[styles.closeText, { color: theme.mutedForeground }]}>✕</Text>
        </Pressable>

        <View style={styles.logoRow}>
          <Text style={[styles.logo, { color: theme.primary }]}>PRISM</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Sign in to your account</Text>
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
          Discover and compare enterprise software
        </Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.mutedForeground }]}>Email</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              placeholderTextColor={theme.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.mutedForeground }]}>Password</Text>
              <Pressable>
                <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot password?</Text>
              </Pressable>
            </View>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.mutedForeground}
              secureTextEntry
            />
          </View>

          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [styles.signInBtn, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={[styles.signInText, { color: theme.primaryForeground }]}>Sign in</Text>
          </Pressable>

          <View style={[styles.dividerRow]}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.mutedForeground }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <Pressable style={[styles.googleBtn, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Text style={[styles.googleBtnText, { color: theme.text }]}>Continue with Google</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.mutedForeground }]}>Don't have an account? </Text>
          <Pressable onPress={() => router.replace('/auth/signup')}>
            <Text style={[styles.footerLink, { color: theme.primary }]}>Sign up</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  closeBtn: { alignSelf: 'flex-start', padding: Spacing.xs },
  closeText: { fontSize: 18 },
  logoRow: { alignItems: 'center', marginTop: Spacing.xl },
  logo: { fontSize: 28, fontWeight: '900', letterSpacing: 3 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: Spacing.lg },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: Spacing.xs },
  form: { marginTop: Spacing.xl, gap: Spacing.md },
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600' },
  forgotText: { fontSize: 13, fontWeight: '600' },
  input: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  signInBtn: {
    height: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  signInText: { fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  googleBtn: {
    height: 50,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: { fontSize: 15, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
