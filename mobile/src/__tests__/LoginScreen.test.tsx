import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { AuthProvider } from '../contexts/AuthContext';
import { AppThemeProvider } from '../theme/AppThemeProvider';

const mockLogin = jest.fn();

jest.mock('../contexts/AuthContext', () => {
  const actual = jest.requireActual('../contexts/AuthContext');

  return {
    ...actual,
    useAuth: () => ({
      login: mockLogin,
      isLoading: false,
      session: null,
      logout: jest.fn(),
    }),
  };
});

describe('LoginScreen', () => {
  beforeEach(() => {
    mockLogin.mockReset();
  });

  it('submits email and password through auth context', async () => {
    render(
      <AppThemeProvider>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </AppThemeProvider>,
    );

    fireEvent.changeText(screen.getByLabelText('E-mail'), 'motorista@test.com');
    fireEvent.changeText(screen.getByLabelText('Senha'), '123456');
    fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'motorista@test.com',
        senha: '123456',
      });
    });
  });

  it('shows backend error message after failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Acesso permitido apenas para motoristas'));

    render(
      <AppThemeProvider>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </AppThemeProvider>,
    );

    fireEvent.changeText(screen.getByLabelText('E-mail'), 'admin@test.com');
    fireEvent.changeText(screen.getByLabelText('Senha'), '123456');
    fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(
      await screen.findByText('Acesso permitido apenas para motoristas'),
    ).toBeOnTheScreen();
  });
});
