import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#FFFFFF',
    backgroundElement: '#F4F5F8',
    backgroundSelected: '#E7EAF0',
    text: '#0F1929',
    textSecondary: '#7A8299',
    primary: '#1E2D40',
    primaryForeground: '#FFFFFF',
    border: '#E7EAF0',
    card: '#FFFFFF',
    muted: '#F4F5F8',
    mutedForeground: '#7A8299',
    verified: '#16A34A',
    verifiedBg: '#DCFCE7',
    accent: '#1E2D40',
    destructive: '#DC2626',
    destructiveFg: '#FFFFFF',
    badgeBg: '#F4F5F8',
    badgeText: '#1E2D40',
    chipBg: '#F0F2F5',
    chipBorder: '#D8DCE6',
    chipText: '#3A4560',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E7EAF0',
    tabBarActive: '#1E2D40',
    tabBarInactive: '#7A8299',
  },
  dark: {
    background: '#0F1929',
    backgroundElement: '#1E2D40',
    backgroundSelected: '#283D56',
    text: '#F4F5F8',
    textSecondary: '#A0ACC0',
    primary: '#E7EAF0',
    primaryForeground: '#1E2D40',
    border: 'rgba(255,255,255,0.1)',
    card: '#1E2D40',
    muted: '#283D56',
    mutedForeground: '#8896AA',
    verified: '#4ADE80',
    verifiedBg: '#14532D',
    accent: '#7EB3F5',
    destructive: '#EF4444',
    destructiveFg: '#FFFFFF',
    badgeBg: '#283D56',
    badgeText: '#C8D4E8',
    chipBg: '#2A3F5A',
    chipBorder: 'rgba(255,255,255,0.18)',
    chipText: '#C8D4E8',
    tabBar: '#131F30',
    tabBarBorder: 'rgba(255,255,255,0.1)',
    tabBarActive: '#E7EAF0',
    tabBarInactive: '#6A7A90',
  },
} as const;

export type ThemeColors = typeof Colors.light;
export type ThemeColor = keyof ThemeColors;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 0, android: 0 }) ?? 0;
export const MaxContentWidth = 800;
