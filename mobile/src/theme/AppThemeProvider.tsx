import React, { createContext, ReactNode, useContext } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';
import { AppTheme, darkTheme, lightTheme } from './tokens';

type ThemeContextValue = {
  colorScheme: ColorSchemeName;
  theme: AppTheme;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ colorScheme, theme }}>
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
