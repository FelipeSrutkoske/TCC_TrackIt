import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AppThemeProvider, useAppTheme } from '../theme/AppThemeProvider';

function ThemeProbe() {
  const { theme } = useAppTheme();

  return <Text>{theme.colors.background}</Text>;
}

describe('AppThemeProvider', () => {
  it('provides the light theme by default', () => {
    render(
      <AppThemeProvider>
        <ThemeProbe />
      </AppThemeProvider>,
    );

    expect(screen.getByText('#F3F4F6')).toBeOnTheScreen();
  });
});
