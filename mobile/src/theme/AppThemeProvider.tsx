import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';
import { AppTheme, darkTheme, lightTheme } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_PREFERENCE_STORAGE_KEY = 'trackit.theme-preference';

type ThemeContextValue = {
  colorScheme: ColorSchemeName;
  resolvedColorScheme: 'light' | 'dark';
  theme: AppTheme;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    async function restoreThemePreference() {
      try {
        const storedPreference = await SecureStore.getItemAsync(THEME_PREFERENCE_STORAGE_KEY);

        if (
          storedPreference === 'system' ||
          storedPreference === 'light' ||
          storedPreference === 'dark'
        ) {
          setThemePreferenceState(storedPreference);
        }
      } catch {
        setThemePreferenceState('system');
      }
    }

    void restoreThemePreference();
  }, []);

  const resolvedColorScheme: 'light' | 'dark' = useMemo(() => {
    if (themePreference === 'light' || themePreference === 'dark') {
      return themePreference;
    }

    return colorScheme === 'dark' ? 'dark' : 'light';
  }, [colorScheme, themePreference]);

  const theme = resolvedColorScheme === 'dark' ? darkTheme : lightTheme;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme,
      resolvedColorScheme,
      theme,
      themePreference,
      setThemePreference: async (preference) => {
        setThemePreferenceState(preference);
        await SecureStore.setItemAsync(THEME_PREFERENCE_STORAGE_KEY, preference);
      },
    }),
    [colorScheme, resolvedColorScheme, theme, themePreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return context;
}
