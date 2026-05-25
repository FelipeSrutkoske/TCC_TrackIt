import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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

jest.mock('../components/SignaturePadField', () => ({
  SignaturePadField: ({
    onChange,
    onDrawEnd,
    onDrawStart,
  }: {
    onChange: (value: string | null) => void;
    onDrawStart?: () => void;
    onDrawEnd?: () => void;
  }) => {
    const ReactNative = require('react-native');

    return (
      <ReactNative.Pressable
        accessibilityRole="button"
        accessibilityLabel="Assinar entrega"
        testID="signature-pad"
        onPress={() => onChange('sig:test')}
        onTouchEnd={onDrawEnd}
        onTouchStart={onDrawStart}
      >
        <ReactNative.Text>Mock signature pad</ReactNative.Text>
      </ReactNative.Pressable>
    );
  },
}));

const deliveryFixture: Delivery = {
  id: 2,
  driverId: 701,
  companyId: 9,
  company: {
    id: 9,
    corporateName: 'ACME Transportes LTDA',
    tradeName: 'ACME',
  },
  createdAt: '2026-05-24T10:00:00.000Z',
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

    expect(screen.getByText('Encerramento operacional')).toBeOnTheScreen();
    expect(screen.getByText('Fechar entrega com validacao completa')).toBeOnTheScreen();
    expect(screen.getByText('ACME Transportes LTDA')).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('Nome do recebedor'), 'Maria');
    fireEvent.changeText(screen.getByLabelText('Documento do recebedor'), '12345678901');
    fireEvent.changeText(screen.getByLabelText('Parentesco ou grau'), 'Irmao');
    fireEvent.press(screen.getByRole('button', { name: 'Finalizar entrega' }));

    expect(await screen.findByText('Registre a assinatura antes de concluir a entrega.')).toBeOnTheScreen();
    expect(mockGetCurrentCoordinates).not.toHaveBeenCalled();
    expect(mockFinalizeDelivery).not.toHaveBeenCalled();
  });

  it('disables parent scroll while the user is drawing the signature', () => {
    render(
      <AppThemeProvider>
        <DeliveryFinalizationScreen
          navigation={{ replace: jest.fn() }}
          route={{ key: 'DeliveryFinalization-1', name: 'DeliveryFinalization', params: { delivery: deliveryFixture } }}
        />
      </AppThemeProvider>,
    );

    const scrollView = screen.getByTestId('delivery-finalization-scroll');
    const signaturePad = screen.getByTestId('signature-pad');

    expect(scrollView.props.scrollEnabled).toBe(true);

    fireEvent(signaturePad, 'touchStart', { nativeEvent: { locationX: 14, locationY: 18 } });

    expect(screen.getByTestId('delivery-finalization-scroll').props.scrollEnabled).toBe(false);

    fireEvent(signaturePad, 'touchEnd');

    expect(screen.getByTestId('delivery-finalization-scroll').props.scrollEnabled).toBe(true);
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
    fireEvent.changeText(screen.getByLabelText('Documento do recebedor'), '12345678901');
    fireEvent.changeText(screen.getByLabelText('Parentesco ou grau'), 'Irmao');
    fireEvent.press(screen.getByTestId('signature-pad'));

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
    fireEvent.changeText(screen.getByLabelText('Documento do recebedor'), '12345678901');
    fireEvent.changeText(screen.getByLabelText('Parentesco ou grau'), 'Irmao');
    fireEvent.press(screen.getByTestId('signature-pad'));

    fireEvent.press(screen.getByRole('button', { name: 'Finalizar entrega' }));

    await waitFor(() => {
      expect(mockFinalizeDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          deliveryId: 2,
          receiverName: 'Maria',
          receiverDocument: '12345678901',
          receiverRelation: 'Irmao',
          latitude: -23.5,
          longitude: -46.6,
          signature: expect.any(String),
        }),
        'token-1',
      );
    });

    expect(replace).toHaveBeenCalledWith('History');
  });

  it('ignores rapid repeated submit taps while a finalization is already in progress', async () => {
    let resolveCoordinates!: (value: { latitude: number; longitude: number }) => void;

    mockGetCurrentCoordinates.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCoordinates = resolve;
      }),
    );
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
          navigation={{ replace: jest.fn() }}
          route={{ key: 'DeliveryFinalization-1', name: 'DeliveryFinalization', params: { delivery: deliveryFixture } }}
        />
      </AppThemeProvider>,
    );

    fireEvent.changeText(screen.getByLabelText('Nome do recebedor'), 'Maria');
    fireEvent.changeText(screen.getByLabelText('Documento do recebedor'), '12345678901');
    fireEvent.changeText(screen.getByLabelText('Parentesco ou grau'), 'Irmao');
    fireEvent.press(screen.getByTestId('signature-pad'));

    const submitButton = screen.getByRole('button', { name: 'Finalizar entrega' });

    act(() => {
      fireEvent.press(submitButton);
      fireEvent.press(submitButton);
    });

    expect(mockGetCurrentCoordinates).toHaveBeenCalledTimes(1);

    resolveCoordinates({ latitude: -23.5, longitude: -46.6 });

    await waitFor(() => {
      expect(mockFinalizeDelivery).toHaveBeenCalledTimes(1);
    });
  });
});
