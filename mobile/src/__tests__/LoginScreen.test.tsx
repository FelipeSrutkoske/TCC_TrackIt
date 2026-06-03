import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';
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
        <LoginScreen />
      </AppThemeProvider>,
    );

    fireEvent.changeText(screen.getByLabelText('E-mail'), '  Motorista@Test.com  ');
    fireEvent.changeText(screen.getByLabelText('Senha'), '123456');
    fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'motorista@test.com',
        senha: '123456',
      });
    });
  });

  it('toggles password visibility from the login form', () => {
    render(
      <AppThemeProvider>
        <LoginScreen />
      </AppThemeProvider>,
    );

    const passwordInput = screen.getByLabelText('Senha');

    expect(passwordInput.props.secureTextEntry).toBe(true);

    fireEvent.press(screen.getByLabelText('Mostrar senha'));

    expect(screen.getByLabelText('Senha').props.secureTextEntry).toBe(false);
  });

  it('renders a keyboard avoiding container for the form', () => {
    render(
      <AppThemeProvider>
        <LoginScreen />
      </AppThemeProvider>,
    );

    expect(screen.getByTestId('login-keyboard-container')).toBeOnTheScreen();
  });

  it('prepara o formulario para rolar quando email ou senha recebem foco', () => {
    render(
      <AppThemeProvider>
        <LoginScreen />
      </AppThemeProvider>,
    );

    expect(screen.getByTestId('login-scroll-view')).toBeOnTheScreen();
    expect(typeof screen.getByLabelText('E-mail').props.onFocus).toBe('function');
    expect(typeof screen.getByLabelText('Senha').props.onFocus).toBe('function');
  });

  it('shows backend error message after failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Acesso permitido apenas para motoristas'));

    render(
      <AppThemeProvider>
        <LoginScreen />
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
