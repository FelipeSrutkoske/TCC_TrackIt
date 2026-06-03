import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
};

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
});
