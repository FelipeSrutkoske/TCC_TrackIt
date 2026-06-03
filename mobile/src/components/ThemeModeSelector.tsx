import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemePreference, useAppTheme } from '../theme/AppThemeProvider';

const OPTIONS: Array<{ label: string; value: ThemePreference }> = [
  { label: 'Sistema', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Escuro', value: 'dark' },
];

export function ThemeModeSelector() {
  const { setThemePreference, theme, themePreference } = useAppTheme();

  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const selected = option.value === themePreference;

        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => {
              void setThemePreference(option.value);
            }}
            style={[
              styles.option,
              {
                backgroundColor: selected ? theme.colors.primary : theme.colors.secondary,
                borderColor: selected ? theme.colors.primary : theme.colors.borderStrong,
              },
            ]}
          >
            <Text
              style={[
                styles.optionText,
                { color: selected ? theme.colors.primaryText : theme.colors.secondaryText },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  option: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
