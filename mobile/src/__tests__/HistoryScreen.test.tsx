import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AppThemeProvider } from '../theme/AppThemeProvider';

const mockUseAuth = jest.fn();
const mockGetDeliveryHistory = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../services/deliveries.service', () => ({
  getDeliveryHistory: (...args: unknown[]) => mockGetDeliveryHistory(...args),
}));

describe('HistoryScreen', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      session: {
        accessToken: 'token-1',
        user: { id: 7, nome: 'Motorista', email: 'm@test.com', tipoUsuario: 'MOTORISTA' },
      },
    });
    mockGetDeliveryHistory.mockReset();
  });

  it('loads history items and backend metrics for the authenticated driver', async () => {
    mockGetDeliveryHistory.mockResolvedValueOnce({
      items: [
        { id: 4, driverId: 701, destinationAddress: 'Rua D', status: 'CANCELADO' },
        { id: 3, driverId: 701, destinationAddress: 'Rua C', status: 'ENTREGUE' },
      ],
      metrics: {
        totalConcluidas: 1,
        totalEmRota: 1,
        totalCanceladas: 1,
        taxaConclusao: 25,
      },
    });

    render(
      <AppThemeProvider>
        <HistoryScreen />
      </AppThemeProvider>,
    );

    await waitFor(() => {
      expect(mockGetDeliveryHistory).toHaveBeenCalledWith('token-1');
    });

    expect(await screen.findByText('25%')).toBeOnTheScreen();
    expect(screen.getByText('Concluidas')).toBeOnTheScreen();
    expect(screen.getByText('Em rota')).toBeOnTheScreen();
    expect(screen.getByText('Canceladas')).toBeOnTheScreen();
    expect(screen.getByText('Rua D')).toBeOnTheScreen();
    expect(screen.getByText('Rua C')).toBeOnTheScreen();
  });
});
