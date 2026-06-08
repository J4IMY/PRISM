import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import { Colors, ThemeColors } from '@/constants/theme';

const THEME_KEY = 'prism_theme';

type ThemeMode = 'system' | 'light' | 'dark';

let cachedMode: ThemeMode = 'system';

export function useThemeMode() {
  const [mode, setModeState] = useState<ThemeMode>(cachedMode);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') {
        cachedMode = v;
        setModeState(v);
      }
    });
  }, []);

  const setMode = (next: ThemeMode) => {
    cachedMode = next;
    setModeState(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
  };

  return { mode, setMode };
}

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  const { mode } = useThemeMode();
  const resolved = mode === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : mode;
  return Colors[resolved] as ThemeColors;
}
