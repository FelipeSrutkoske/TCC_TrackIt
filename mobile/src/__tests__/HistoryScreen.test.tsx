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
        {
          id: 3,
          driverId: 701,
          company: { id: 9, corporateName: 'ACME Transportes LTDA' },
          createdAt: '2026-05-24T10:00:00.000Z',
          finalization: { finalizedAt: '2026-05-24T12:30:00.000Z' },
          destinationAddress: 'Rua C',
          status: 'ENTREGUE',
        },
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

    expect(await screen.findByText('Leitura consolidada')).toBeOnTheScreen();
    expect(screen.getByTestId('history-scroll')).toBeOnTheScreen();
    expect(screen.getByText('Historico operacional')).toHaveStyle({ color: '#F7FFF9' });
    expect(screen.getByText('Resumo das entregas')).toBeOnTheScreen();
    expect(await screen.findByText('25%')).toBeOnTheScreen();
    expect(screen.getByText('Concluidas')).toHaveStyle({ fontSize: 12 });
    expect(screen.getByText('Em rota')).toHaveStyle({ fontSize: 12 });
    expect(screen.getByText('Canceladas')).toHaveStyle({ fontSize: 12 });
    expect(screen.getByText('Rua D')).toBeOnTheScreen();
    expect(screen.getByText('ACME Transportes LTDA')).toBeOnTheScreen();
    expect(screen.getAllByText('Tempo de entrega').length).toBeGreaterThan(0);
    expect(screen.getByText('2h 30min')).toBeOnTheScreen();
    expect(screen.getByText('Rua C')).toBeOnTheScreen();
  });
});
