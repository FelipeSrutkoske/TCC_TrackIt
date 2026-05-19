import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DeliveryFinalizationScreen } from '../screens/DeliveryFinalizationScreen';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { Delivery } from '../types/delivery';

const mockUseAuth = jest.fn();
const mockGetCurrentCoordinates = jest.fn();
const mockFinalizeDelivery = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../utils/location', () => ({
  getCurrentCoordinates: (...args: unknown[]) => mockGetCurrentCoordinates(...args),
}));

jest.mock('../services/finalizations.service', () => ({
  finalizeDelivery: (...args: unknown[]) => mockFinalizeDelivery(...args),
}));

const deliveryFixture: Delivery = {
  id: 2,
  driverId: 701,
  destinationAddress: 'Rua B, 200 - Centro',
  status: 'EM_ROTA',
};

describe('DeliveryFinalizationScreen', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      session: {
        accessToken: 'token-1',
        user: { id: 7, nome: 'Motorista', email: 'm@test.com', tipoUsuario: 'MOTORISTA' },
      },
    });
    mockGetCurrentCoordinates.mockReset();
    mockFinalizeDelivery.mockReset();
  });

  it('blocks submission when the signature is missing', async () => {
    render(
      <AppThemeProvider>
        <DeliveryFinalizationScreen
          navigation={{ replace: jest.fn() }}
          route={{ key: 'DeliveryFinalization-1', name: 'DeliveryFinalization', params: { delivery: deliveryFixture } }}
        />
      </AppThemeProvider>,
    );

    fireEvent.changeText(screen.getByLabelText('Nome do recebedor'), 'Maria');
    fireEvent.press(screen.getByRole('button', { name: 'Finalizar entrega' }));

    expect(await screen.findByText('Registre a assinatura antes de concluir a entrega.')).toBeOnTheScreen();
    expect(mockGetCurrentCoordinates).not.toHaveBeenCalled();
    expect(mockFinalizeDelivery).not.toHaveBeenCalled();
  });

  it('shows an operational error when GPS is unavailable', async () => {
    mockGetCurrentCoordinates.mockResolvedValueOnce(null);

    render(
      <AppThemeProvider>
        <DeliveryFinalizationScreen
          navigation={{ replace: jest.fn() }}
          route={{ key: 'DeliveryFinalization-1', name: 'DeliveryFinalization', params: { delivery: deliveryFixture } }}
        />
      </AppThemeProvider>,
    );

    fireEvent.changeText(screen.getByLabelText('Nome do recebedor'), 'Maria');
    fireEvent.press(screen.getByRole('button', { name: 'Assinar entrega' }));
    fireEvent.press(screen.getByRole('button', { name: 'Finalizar entrega' }));

    expect(await screen.findByText('Nao foi possivel confirmar a localizacao atual.')).toBeOnTheScreen();
    expect(mockFinalizeDelivery).not.toHaveBeenCalled();
  });

  it('finalizes the delivery with signature and GPS coordinates', async () => {
    const replace = jest.fn();
    mockGetCurrentCoordinates.mockResolvedValueOnce({ latitude: -23.5, longitude: -46.6 });
    mockFinalizeDelivery.mockResolvedValueOnce({
      id: 1,
      deliveryId: 2,
      receiverName: 'Maria',
      signatureUrl: 'signature-data',
      latitude: -23.5,
      longitude: -46.6,
      finalizedAt: '2026-01-01T10:00:00.000Z',
    });

    render(
      <AppThemeProvider>
        <DeliveryFinalizationScreen
          navigation={{ replace }}
          route={{ key: 'DeliveryFinalization-1', name: 'DeliveryFinalization', params: { delivery: deliveryFixture } }}
        />
      </AppThemeProvider>,
    );

    fireEvent.changeText(screen.getByLabelText('Nome do recebedor'), 'Maria');
    fireEvent.press(screen.getByRole('button', { name: 'Assinar entrega' }));
    fireEvent.press(screen.getByRole('button', { name: 'Finalizar entrega' }));

    await waitFor(() => {
      expect(mockFinalizeDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          deliveryId: 2,
          receiverName: 'Maria',
          latitude: -23.5,
          longitude: -46.6,
          signature: expect.any(String),
        }),
        'token-1',
      );
    });

    expect(replace).toHaveBeenCalledWith('History');
  });
});
