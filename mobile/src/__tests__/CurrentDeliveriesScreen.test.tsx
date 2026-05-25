import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { CurrentDeliveriesScreen } from '../screens/CurrentDeliveriesScreen';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { Delivery } from '../types/delivery';

const mockUseAuth = jest.fn();
const mockListCurrentDeliveries = jest.fn();
const mockUseFocusEffect = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (...args: unknown[]) => mockUseFocusEffect(...args),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../services/deliveries.service', () => ({
  listCurrentDeliveries: (...args: unknown[]) => mockListCurrentDeliveries(...args),
}));

const deliveriesFixture: Delivery[] = [
  {
    id: 2,
    driverId: 701,
    destinationAddress: 'Rua B, 200 - Centro',
    status: 'EM_ROTA',
  },
  {
    id: 1,
    driverId: 701,
    destinationAddress: 'Rua A, 100 - Centro',
    status: 'AGUARDANDO_MOTORISTA',
  },
];

describe('CurrentDeliveriesScreen', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      session: { accessToken: 'token-1', user: { id: 7, nome: 'Motorista', email: 'm@test.com', tipoUsuario: 'MOTORISTA' } },
    });
    mockListCurrentDeliveries.mockReset();
    mockUseFocusEffect.mockReset();
    mockUseFocusEffect.mockImplementation(() => undefined);
  });

  it('loads and renders the authenticated driver current deliveries', async () => {
    mockListCurrentDeliveries.mockResolvedValueOnce(deliveriesFixture);

    render(
      <AppThemeProvider>
        <CurrentDeliveriesScreen />
      </AppThemeProvider>,
    );

    expect(screen.getByText('Carregando entregas...')).toBeOnTheScreen();

    await waitFor(() => {
      expect(mockListCurrentDeliveries).toHaveBeenCalledWith('token-1');
    });

    expect(await screen.findByText('Operacao ativa')).toBeOnTheScreen();
    expect(screen.getByText('2')).toBeOnTheScreen();
    expect(screen.getByText('Ativas')).toBeOnTheScreen();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Em rota').length).toBeGreaterThan(0);
    expect(screen.getByText('Aguardando')).toBeOnTheScreen();
    expect(await screen.findByText('Rua B, 200 - Centro')).toBeOnTheScreen();
    expect(screen.getByText('Rua A, 100 - Centro')).toBeOnTheScreen();
    expect(screen.getByText('Aguardando motorista')).toBeOnTheScreen();
  });

  it('shows an operational empty state when there are no current deliveries', async () => {
    mockListCurrentDeliveries.mockResolvedValueOnce([]);

    render(
      <AppThemeProvider>
        <CurrentDeliveriesScreen />
      </AppThemeProvider>,
    );

    expect(await screen.findByText('Nenhuma entrega ativa no momento')).toBeOnTheScreen();
    expect(
      screen.getByText('Quando novas atribuicoes estiverem disponiveis, elas aparecerao aqui.'),
    ).toBeOnTheScreen();
  });

  it('refreshes deliveries when the screen regains focus', async () => {
    let focusCallback: (() => void) | undefined;

    mockUseFocusEffect.mockImplementation((callback: () => void) => {
      focusCallback = callback;
    });
    mockListCurrentDeliveries
      .mockResolvedValueOnce(deliveriesFixture)
      .mockResolvedValueOnce([deliveriesFixture[0]]);

    render(
      <AppThemeProvider>
        <CurrentDeliveriesScreen />
      </AppThemeProvider>,
    );

    await waitFor(() => {
      expect(mockListCurrentDeliveries).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      focusCallback?.();
    });

    await waitFor(() => {
      expect(mockListCurrentDeliveries).toHaveBeenCalledTimes(2);
    });
  });
});
