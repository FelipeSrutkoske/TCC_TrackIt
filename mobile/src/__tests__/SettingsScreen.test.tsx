import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SettingsScreen } from '../screens/SettingsScreen';

const mockSetThemePreference = jest.fn();

jest.mock('../theme/AppThemeProvider', () => ({
  useAppTheme: () => ({
    colorScheme: 'light',
    resolvedColorScheme: 'light',
    setThemePreference: mockSetThemePreference,
    theme: require('../theme/tokens').lightTheme,
    themePreference: 'system',
  }),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    mockSetThemePreference.mockReset();
  });

  it('allows selecting the dark theme mode', () => {
    render(
      <SettingsScreen navigation={{ goBack: jest.fn() } as never} route={{ key: 'Settings', name: 'Settings' } as never} />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Escuro' }));

    expect(mockSetThemePreference).toHaveBeenCalledWith('dark');
  });
});
