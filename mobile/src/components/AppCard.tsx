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
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
});
