import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AppNavigator } from '../navigation/AppNavigator';
import { AppThemeProvider } from '../theme/AppThemeProvider';

const mockUseAuth = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AppNavigator', () => {
  it('shows login screen when there is no session', () => {
    mockUseAuth.mockReturnValue({ session: null, isLoading: false });

    render(
      <AppThemeProvider>
        <AppNavigator />
      </AppThemeProvider>,
    );

    expect(screen.getByText('Acesse sua conta')).toBeOnTheScreen();
  });

  it('shows authenticated area when motorista session exists', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      session: {
        accessToken: 'token-1',
        user: {
          id: 7,
          nome: 'Motorista Test',
          email: 'motorista@test.com',
          tipoUsuario: 'MOTORISTA',
          driverProfileId: 99,
        },
      },
    });

    render(
      <AppThemeProvider>
        <AppNavigator />
      </AppThemeProvider>,
    );

    expect(screen.getByText('Painel do motorista')).toBeOnTheScreen();
  });
});
