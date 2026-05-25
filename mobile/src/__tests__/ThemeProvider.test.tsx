import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { Text } from 'react-native';
import { AppThemeProvider, useAppTheme } from '../theme/AppThemeProvider';

function ThemeProbe() {
  const { theme, themePreference, resolvedColorScheme, setThemePreference } = useAppTheme();

  return (
    <>
      <Text testID="background-color">{theme.colors.background}</Text>
      <Text testID="theme-preference">{themePreference}</Text>
      <Text testID="resolved-color-scheme">{resolvedColorScheme}</Text>
      <Text onPress={() => setThemePreference('dark')}>dark</Text>
      <Text onPress={() => setThemePreference('light')}>light</Text>
    </>
  );
}

describe('AppThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(null);
  });

  it('uses system theme preference by default', async () => {
    render(
      <AppThemeProvider>
        <ThemeProbe />
      </AppThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme-preference')).toHaveTextContent('system');
      expect(screen.getByTestId('resolved-color-scheme')).toHaveTextContent('light');
      expect(screen.getByTestId('background-color')).toHaveTextContent('#F3F7F1');
    });
  });

  it('restores the persisted dark preference', async () => {
    jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValueOnce('dark');

    render(
      <AppThemeProvider>
        <ThemeProbe />
      </AppThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme-preference')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-color-scheme')).toHaveTextContent('dark');
      expect(screen.getByTestId('background-color')).toHaveTextContent('#09110D');
    });
  });

  it('persists a manual light to dark theme change', async () => {
    render(
      <AppThemeProvider>
        <ThemeProbe />
      </AppThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('system')).toBeOnTheScreen();
    });

    await act(async () => {
      screen.getByText('dark').props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId('background-color')).toHaveTextContent('#09110D');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'trackit.theme-preference',
        'dark',
      );
    });
  });
});
