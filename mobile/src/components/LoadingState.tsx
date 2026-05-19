import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';

export function LoadingState({ message }: { message: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text style={[styles.message, { color: theme.colors.textMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  message: {
    fontSize: 15,
  },
});
