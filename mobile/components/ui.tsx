import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ViewStyle,
  TextStyle, TextInputProps, TouchableOpacityProps,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function H1(p: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[typography.h1, { color: colors.foreground }, p.style]}>{p.children}</Text>;
}
export function H2(p: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[typography.h2, { color: colors.foreground }, p.style]}>{p.children}</Text>;
}
export function H3(p: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[typography.h3, { color: colors.foreground }, p.style]}>{p.children}</Text>;
}
export function P(p: { children: React.ReactNode; muted?: boolean; style?: TextStyle }) {
  return (
    <Text style={[typography.body, { color: p.muted ? colors.mutedForeground : colors.foreground }, p.style]}>
      {p.children}
    </Text>
  );
}
export function Caption(p: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[typography.caption, p.style]}>{p.children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type BtnProps = TouchableOpacityProps & {
  title: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
};
export function Button({ title, variant = 'primary', style, ...rest }: BtnProps) {
  const v = styles[`btn_${variant}`];
  const t = styles[`btnText_${variant}`];
  return (
    <TouchableOpacity activeOpacity={0.8} {...rest} style={[styles.btnBase, v, style]}>
      <Text style={[styles.btnTextBase, t]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Input(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        {...rest}
        style={[styles.input, style]}
      />
    </View>
  );
}

export function Badge({ children, tone = 'default' }: {
  children: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'destructive';
}) {
  const bg = tone === 'success' ? '#dcfce7' : tone === 'warning' ? '#fef3c7'
    : tone === 'destructive' ? '#fee2e2' : colors.muted;
  const fg = tone === 'success' ? '#166534' : tone === 'warning' ? '#92400e'
    : tone === 'destructive' ? '#991b1b' : colors.foreground;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '600' }}>{children}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />;
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  card: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  btnBase: {
    borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: spacing.lg,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
  },
  btn_primary: { backgroundColor: colors.primary },
  btn_outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  btn_ghost: { backgroundColor: 'transparent' },
  btn_destructive: { backgroundColor: colors.destructive },
  btnTextBase: { fontSize: 14, fontWeight: '600' },
  btnText_primary: { color: colors.primaryForeground },
  btnText_outline: { color: colors.foreground },
  btnText_ghost: { color: colors.foreground },
  btnText_destructive: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '500', color: colors.foreground, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.foreground,
    backgroundColor: colors.background,
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start',
  },
});
