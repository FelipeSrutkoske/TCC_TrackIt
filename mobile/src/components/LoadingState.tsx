import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppCard } from './AppCard';
import { useAppTheme } from '../theme/AppThemeProvider';

export function LoadingState({ message }: { message: string }) {
  const { theme } = useAppTheme();

  return (
    <AppCard>
      <View style={styles.container}>
        <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>Sincronizando</Text>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>{message}</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 15,
  },
});
