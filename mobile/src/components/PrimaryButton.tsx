import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../theme/AppThemeProvider';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ title, onPress, disabled }: PrimaryButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={[
          styles.button,
          {
            backgroundColor: disabled ? theme.colors.surfaceMuted : theme.colors.primary,
            borderColor: disabled ? theme.colors.border : theme.colors.primary,
          },
        ]}
      >
      <Text style={[styles.text, { color: theme.colors.primaryText }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
