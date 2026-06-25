import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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

function expectedDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
    const navigation = { reset: jest.fn() };

    mockGetDeliveryHistory.mockResolvedValue({
      items: [
        {
          id: 5,
          driverId: 701,
          company: { id: 10, corporateName: 'Loja Com Ocorrencia' },
          createdAt: '2026-05-24T09:00:00.000Z',
          finalization: { finalizedAt: '2026-05-24T09:40:00.000Z' },
          destinationAddress: 'Rua E',
          status: 'CANCELADO',
          occurrences: [
            {
              id: 30,
              tipoOcorrencia: 'DESTINATARIO_AUSENTE',
              descricao: 'Cliente nao estava no local informado',
              createdAt: '2026-05-24T09:35:00.000Z',
            },
          ],
        },
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
        <HistoryScreen navigation={navigation as never} />
      </AppThemeProvider>,
    );

    await waitFor(() => {
      expect(mockGetDeliveryHistory).toHaveBeenCalledWith('token-1');
    });

    expect(await screen.findByText('Dados de entregas')).toBeOnTheScreen();
    expect(screen.getByTestId('history-scroll')).toBeOnTheScreen();
    expect(screen.getByText('Historico de entregas')).toHaveStyle({ color: '#F7FFF9' });
    expect(screen.getByText('Seus dados de entrega')).toBeOnTheScreen();
    expect(await screen.findByText('25%')).toBeOnTheScreen();
    expect(screen.getByText('Concluidas')).toHaveStyle({ fontSize: 12 });
    expect(screen.getByText('Em rota')).toHaveStyle({ fontSize: 12 });
    expect(screen.getByText('Canceladas')).toHaveStyle({ fontSize: 12 });
    expect(screen.getByText('Rua D')).toBeOnTheScreen();
    expect(screen.getByText('ACME Transportes LTDA')).toBeOnTheScreen();
    expect(screen.getAllByText('Tempo de entrega').length).toBeGreaterThan(0);
    expect(screen.getByText('2h 30min')).toBeOnTheScreen();
    expect(screen.getByText('Rua C')).toBeOnTheScreen();
    expect(screen.getByLabelText('Atualizar historico operacional')).toBeOnTheScreen();
    expect(screen.getByLabelText('Ir para o inicio')).toBeOnTheScreen();
    expect(screen.getByText('Ocorrencia registrada')).toBeOnTheScreen();
    expect(screen.queryByText('Cliente nao estava no local informado')).not.toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('Ver detalhes da entrega historica 5'));

    expect(screen.getByText('Cliente nao estava no local informado')).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('Atualizar historico operacional'));

    await waitFor(() => {
      expect(mockGetDeliveryHistory).toHaveBeenCalledTimes(2);
    });

    fireEvent.press(screen.getByLabelText('Ir para o inicio'));

    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
  });

  it('uses the occurrence timestamp for deliveries closed with occurrence', async () => {
    mockGetDeliveryHistory.mockResolvedValue({
      items: [
        {
          id: 12,
          driverId: 701,
          createdAt: '2026-05-24T09:00:00',
          destinationAddress: 'Rua Ocorrencia',
          status: 'COM_OCORRENCIA',
          occurrences: [
            {
              id: 33,
              tipoOcorrencia: 'OUTROS',
              descricao: 'Portaria bloqueou o acesso',
              dataHora: '2026-05-24T09:35:00',
              createdAt: '2026-05-24T09:20:00',
            },
          ],
        },
      ],
      metrics: {
        totalConcluidas: 0,
        totalEmRota: 0,
        totalCanceladas: 0,
        taxaConclusao: 0,
      },
    });

    render(
      <AppThemeProvider>
        <HistoryScreen />
      </AppThemeProvider>,
    );

    expect(await screen.findByText('Ocorrência em')).toBeOnTheScreen();
    expect(screen.getByText(expectedDateTime('2026-05-24T09:35:00'))).toBeOnTheScreen();
    expect(screen.queryByText('Finalizada em')).toBeNull();
    expect(screen.queryByText('Ocorrencia registrada')).toBeNull();
  });

  it('uses occurrence createdAt when dataHora is unavailable', async () => {
    mockGetDeliveryHistory.mockResolvedValue({
      items: [
        {
          id: 13,
          driverId: 701,
          createdAt: '2026-05-24T09:00:00',
          destinationAddress: 'Rua Fallback',
          status: 'COM_OCORRENCIA',
          occurrences: [
            {
              id: 34,
              tipoOcorrencia: 'DESTINATARIO_AUSENTE',
              descricao: 'Cliente ausente',
              createdAt: '2026-05-24T09:42:00',
            },
          ],
        },
      ],
      metrics: {
        totalConcluidas: 0,
        totalEmRota: 0,
        totalCanceladas: 0,
        taxaConclusao: 0,
      },
    });

    render(
      <AppThemeProvider>
        <HistoryScreen />
      </AppThemeProvider>,
    );

    expect(await screen.findByText('Ocorrência em')).toBeOnTheScreen();
    expect(screen.getByText(expectedDateTime('2026-05-24T09:42:00'))).toBeOnTheScreen();
  });

  it('keeps finalizedAt for delivered deliveries', async () => {
    mockGetDeliveryHistory.mockResolvedValue({
      items: [
        {
          id: 14,
          driverId: 701,
          createdAt: '2026-05-24T09:00:00',
          destinationAddress: 'Rua Entregue',
          status: 'ENTREGUE',
          finalization: { finalizedAt: '2026-05-24T10:15:00' },
        },
      ],
      metrics: {
        totalConcluidas: 1,
        totalEmRota: 0,
        totalCanceladas: 0,
        taxaConclusao: 100,
      },
    });

    render(
      <AppThemeProvider>
        <HistoryScreen />
      </AppThemeProvider>,
    );

    expect(await screen.findByText('Finalizada em')).toBeOnTheScreen();
    expect(screen.getByText(expectedDateTime('2026-05-24T10:15:00'))).toBeOnTheScreen();
    expect(screen.queryByText('Ocorrência em')).toBeNull();
  });
});
