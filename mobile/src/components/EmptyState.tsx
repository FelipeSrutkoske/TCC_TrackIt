import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from './AppCard';
import { useAppTheme } from '../theme/AppThemeProvider';

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  const { theme } = useAppTheme();

  return (
    <AppCard>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>{description}</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
});
