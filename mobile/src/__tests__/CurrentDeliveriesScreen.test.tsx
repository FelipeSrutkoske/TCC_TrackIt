import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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
    expect(screen.queryByText('Consulte as rotas em andamento e as proximas entregas disponiveis para inicio.')).not.toBeOnTheScreen();
    expect(screen.getByText('Clique para expandir')).toBeOnTheScreen();
    expect(screen.queryByText('2 Ativas')).not.toBeOnTheScreen();
    expect(screen.queryByText('1 Em rota')).not.toBeOnTheScreen();
    expect(screen.queryByText('1 Pendente')).not.toBeOnTheScreen();
    expect(screen.getByTestId('current-deliveries-chevron-icon')).toBeOnTheScreen();
    expect(screen.getByText('Ordem de trabalho')).toBeOnTheScreen();
    expect(screen.getByText('Sua fila')).toBeOnTheScreen();
    expect(screen.getByText('entregas')).toBeOnTheScreen();
    expect(await screen.findByText('Rua B, 200 - Centro')).toBeOnTheScreen();
    expect(screen.getByText('Rua A, 100 - Centro')).toBeOnTheScreen();
    expect(screen.getByText('Posicao 1 de 2 na fila')).toBeOnTheScreen();
    expect(screen.getByText('Posicao 2 de 2 na fila')).toBeOnTheScreen();
    expect(screen.getByText('Pendente')).toBeOnTheScreen();
    expect(screen.queryByText('1 Aguardando')).not.toBeOnTheScreen();
    expect(screen.queryByText('Aguardando motorista')).not.toBeOnTheScreen();
  });

  it('expande e recolhe o resumo operacional ao tocar no card', async () => {
    mockListCurrentDeliveries.mockResolvedValueOnce(deliveriesFixture);

    render(
      <AppThemeProvider>
        <CurrentDeliveriesScreen />
      </AppThemeProvider>,
    );

    await screen.findByText('Operacao ativa');

    expect(screen.queryByText('Consulte as rotas em andamento e as proximas entregas disponiveis para inicio.')).not.toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Expandir resumo da operacao' }));

    expect(screen.getByText('Consulte as rotas em andamento e as proximas entregas disponiveis para inicio.')).toBeOnTheScreen();
    expect(screen.queryByText('2 Ativas')).not.toBeOnTheScreen();
    expect(screen.queryByText('1 Em rota')).not.toBeOnTheScreen();
    expect(screen.queryByText('1 Pendente')).not.toBeOnTheScreen();
    expect(screen.getByText('total na fila')).toBeOnTheScreen();
    expect(screen.getByText('50% em deslocamento')).toBeOnTheScreen();
    expect(screen.getByText('pronta para sair')).toBeOnTheScreen();
    expect(screen.getByText('Composicao da fila')).toBeOnTheScreen();
    expect(screen.getByText(/^Sincronizado/)).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Recolher resumo da operacao' }));

    expect(screen.queryByText('Consulte as rotas em andamento e as proximas entregas disponiveis para inicio.')).not.toBeOnTheScreen();
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
