import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Session } from '../types/auth';

const mockFetch = jest.fn();

globalThis.fetch = mockFetch as unknown as typeof fetch;

function Probe() {
  const { session, isLoading, login } = useAuth();

  return (
    <>
      <Text>{isLoading ? 'loading' : 'ready'}</Text>
      <Text>{session?.user.email ?? 'no-session'}</Text>
      <Text onPress={() => login({ email: 'motorista@test.com', senha: '123456' })}>
        login
      </Text>
    </>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    jest.clearAllMocks();
  });

  it('restores persisted session on bootstrap', async () => {
    const session: Session = {
      accessToken: 'token-1',
      user: {
        id: 7,
        nome: 'Motorista Test',
        email: 'motorista@test.com',
        tipoUsuario: 'MOTORISTA',
        driverProfileId: 99,
      },
    };

    jest
      .spyOn(SecureStore, 'getItemAsync')
      .mockResolvedValueOnce(JSON.stringify(session));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('ready')).toBeOnTheScreen();
      expect(screen.getByText('motorista@test.com')).toBeOnTheScreen();
    });
  });

  it('stores motorista session after login', async () => {
    jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValueOnce(null);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'token-1',
        user: {
          id: 7,
          nome: 'Motorista Test',
          email: 'motorista@test.com',
          tipoUsuario: 'MOTORISTA',
          driverProfileId: 99,
        },
      }),
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('ready')).toBeOnTheScreen();
    });

    await act(async () => {
      screen.getByText('login').props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByText('motorista@test.com')).toBeOnTheScreen();
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  it('ignores invalid persisted session data during bootstrap', async () => {
    jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValueOnce('{invalid-json');

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('ready')).toBeOnTheScreen();
      expect(screen.getByText('no-session')).toBeOnTheScreen();
    });
  });

  it('continues bootstrap when SecureStore restore fails', async () => {
    jest
      .spyOn(SecureStore, 'getItemAsync')
      .mockRejectedValueOnce(new Error('SecureStore unavailable'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('ready')).toBeOnTheScreen();
      expect(screen.getByText('no-session')).toBeOnTheScreen();
    });
  });
});
