import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DeliveryOccurrenceScreen } from '../screens/DeliveryOccurrenceScreen';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { Delivery } from '../types/delivery';

const mockUseAuth = jest.fn();
const mockGetCurrentCoordinates = jest.fn();
const mockCreateOccurrence = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../utils/location', () => ({
  getCurrentCoordinates: (...args: unknown[]) => mockGetCurrentCoordinates(...args),
}));

jest.mock('../services/occurrences.service', () => ({
  createOccurrence: (...args: unknown[]) => mockCreateOccurrence(...args),
}));

const deliveryFixture: Delivery = {
  id: 8,
  driverId: 701,
  companyId: 9,
  destinationAddress: 'Rua Ocorrencia, 100',
  status: 'EM_ROTA',
};

describe('DeliveryOccurrenceScreen', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      session: {
        accessToken: 'token-1',
        user: { id: 7, nome: 'Motorista', email: 'm@test.com', tipoUsuario: 'MOTORISTA' },
      },
    });
    mockGetCurrentCoordinates.mockReset();
    mockCreateOccurrence.mockReset();
  });

  it('registra ocorrencia e reseta a pilha para o historico', async () => {
    const reset = jest.fn();
    mockGetCurrentCoordinates.mockResolvedValueOnce({ latitude: -23.5, longitude: -46.6 });
    mockCreateOccurrence.mockResolvedValueOnce({ id: 1, deliveryId: 8 });

    render(
      <AppThemeProvider>
        <DeliveryOccurrenceScreen
          navigation={{ reset } as never}
          route={{ key: 'DeliveryOccurrence-1', name: 'DeliveryOccurrence', params: { delivery: deliveryFixture } }}
        />
      </AppThemeProvider>,
    );

    fireEvent.press(screen.getByText('Outros'));
    fireEvent.changeText(screen.getByLabelText('Descricao da ocorrencia'), 'Acesso ao local estava bloqueado.');
    fireEvent.press(screen.getByRole('button', { name: 'Enviar ocorrencia' }));

    await waitFor(() => {
      expect(mockCreateOccurrence).toHaveBeenCalledWith(
        expect.objectContaining({
          entregaId: 8,
          tipoOcorrencia: 'OUTROS',
          descricao: 'Acesso ao local estava bloqueado.',
          latitude: -23.5,
          longitude: -46.6,
        }),
        'token-1',
      );
    });
    expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'History' }] });
  });
});
