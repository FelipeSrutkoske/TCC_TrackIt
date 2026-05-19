import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';

type SecondaryButtonProps = {
  title: string;
  onPress: () => void;
};

export function SecondaryButton({ title, onPress }: SecondaryButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.secondary,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.secondaryText }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
