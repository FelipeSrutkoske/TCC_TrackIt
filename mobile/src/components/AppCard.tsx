import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';

export function AppCard({ children }: { children: ReactNode }) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.surfaceAccent,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 22,
    gap: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
});
