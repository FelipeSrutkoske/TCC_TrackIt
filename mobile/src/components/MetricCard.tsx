import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from './AppCard';
import { useAppTheme } from '../theme/AppThemeProvider';

type MetricCardProps = {
  label: string;
  value: string;
};

export function MetricCard({ label, value }: MetricCardProps) {
  const { theme } = useAppTheme();

  return (
    <AppCard>
      <View style={styles.container}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
});
