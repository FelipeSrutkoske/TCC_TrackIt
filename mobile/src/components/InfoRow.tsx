import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';

type InfoRowProps = {
  label: string;
  value: string;
};

export function InfoRow({ label, value }: InfoRowProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    paddingBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
  },
});
