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

export default function SignupScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={[styles.closeText, { color: theme.mutedForeground }]}>✕</Text>
        </Pressable>

        <View style={styles.logoRow}>
          <Text style={[styles.logo, { color: theme.primary }]}>PRISM</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
          Start discovering enterprise software for free
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
            <Text style={[styles.label, { color: theme.mutedForeground }]}>Password</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor={theme.mutedForeground}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.mutedForeground }]}>Confirm password</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              placeholderTextColor={theme.mutedForeground}
              secureTextEntry
            />
          </View>

          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [styles.signUpBtn, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={[styles.signUpText, { color: theme.primaryForeground }]}>Create account</Text>
          </Pressable>

          <Text style={[styles.terms, { color: theme.mutedForeground }]}>
            By signing up you agree to our{' '}
            <Text style={{ color: theme.primary }}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ color: theme.primary }}>Privacy Policy</Text>.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.mutedForeground }]}>Already have an account? </Text>
          <Pressable onPress={() => router.replace('/auth/login')}>
            <Text style={[styles.footerLink, { color: theme.primary }]}>Sign in</Text>
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
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  signUpBtn: {
    height: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  signUpText: { fontSize: 16, fontWeight: '700' },
  terms: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
