import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { HomeScreen } from '../screens/HomeScreen';

const mockLogout = jest.fn();
const mockListCurrentDeliveries = jest.fn();
const mockGetDeliveryHistory = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    logout: mockLogout,
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
  }),
}));

jest.mock('../services/deliveries.service', () => ({
  listCurrentDeliveries: (...args: unknown[]) => mockListCurrentDeliveries(...args),
  getDeliveryHistory: (...args: unknown[]) => mockGetDeliveryHistory(...args),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    mockListCurrentDeliveries.mockReset();
    mockGetDeliveryHistory.mockReset();
    mockListCurrentDeliveries.mockResolvedValue([
      { id: 2, driverId: 99, destinationAddress: 'Rua B', status: 'EM_ROTA' },
      { id: 3, driverId: 99, destinationAddress: 'Rua C', status: 'AGUARDANDO_MOTORISTA' },
    ]);
    mockGetDeliveryHistory.mockResolvedValue({
      items: [],
      metrics: {
        totalConcluidas: 8,
        totalEmRota: 1,
        totalCanceladas: 1,
        taxaConclusao: 80,
      },
    });
  });

  it('navigates to settings from the home shortcuts', async () => {
    const navigate = jest.fn();

    render(
      <AppThemeProvider>
        <HomeScreen navigation={{ navigate } as never} route={{ key: 'Home', name: 'Home' } as never} />
      </AppThemeProvider>,
    );

    await waitFor(() => {
      expect(mockListCurrentDeliveries).toHaveBeenCalledWith('token-1');
    });

    fireEvent.press(screen.getByRole('button', { name: 'Configuracoes' }));

    expect(navigate).toHaveBeenCalledWith('Settings');
  });

  it('shows current driver deliveries instead of completion rate', async () => {
    render(
      <AppThemeProvider>
        <HomeScreen navigation={{ navigate: jest.fn() } as never} route={{ key: 'Home', name: 'Home' } as never} />
      </AppThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('2')).toBeOnTheScreen();
    });

    expect(screen.getByText('Hub operacional')).toBeOnTheScreen();
    expect(screen.getByText('Em rota')).toBeOnTheScreen();
    expect(screen.getByText('Pendentes')).toBeOnTheScreen();
    expect(screen.getByText('Total')).toBeOnTheScreen();
    expect(screen.queryByText('80%')).not.toBeOnTheScreen();
    expect(screen.queryByText('Taxa de conclusao')).not.toBeOnTheScreen();
    expect(screen.queryByText('Conta ativa')).not.toBeOnTheScreen();
    expect(screen.queryByText('Contato')).not.toBeOnTheScreen();
  });

  it('refreshes the hub summary from the header action', async () => {
    mockListCurrentDeliveries
      .mockResolvedValueOnce([
        { id: 2, driverId: 99, destinationAddress: 'Rua B', status: 'EM_ROTA' },
      ])
      .mockResolvedValueOnce([
        { id: 2, driverId: 99, destinationAddress: 'Rua B', status: 'EM_ROTA' },
        { id: 3, driverId: 99, destinationAddress: 'Rua C', status: 'AGUARDANDO_MOTORISTA' },
      ]);

    render(
      <AppThemeProvider>
        <HomeScreen navigation={{ navigate: jest.fn() } as never} route={{ key: 'Home', name: 'Home' } as never} />
      </AppThemeProvider>,
    );

    await waitFor(() => {
      expect(mockListCurrentDeliveries).toHaveBeenCalledTimes(1);
    });

    fireEvent.press(screen.getByLabelText('Atualizar entregas do hub'));

    await waitFor(() => {
      expect(mockListCurrentDeliveries).toHaveBeenCalledTimes(2);
    });
  });
});
