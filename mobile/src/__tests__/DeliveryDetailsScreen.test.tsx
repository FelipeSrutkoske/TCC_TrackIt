import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DeliveryDetailsScreen } from '../screens/DeliveryDetailsScreen';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { Delivery } from '../types/delivery';

const mockUseAuth = jest.fn();
const mockStartDelivery = jest.fn();
const mockOpenDeliveryAddressInMaps = jest.fn();
const mockGetCurrentCoordinates = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../services/deliveries.service', () => ({
  startDelivery: (...args: unknown[]) => mockStartDelivery(...args),
}));

jest.mock('../utils/maps', () => ({
  openDeliveryAddressInMaps: (...args: unknown[]) => mockOpenDeliveryAddressInMaps(...args),
}));

jest.mock('../utils/location', () => ({
  getCurrentCoordinates: (...args: unknown[]) => mockGetCurrentCoordinates(...args),
}));

const deliveryFixture: Delivery = {
  id: 1,
  driverId: 701,
  destinationAddress: 'Rua A, 100 - Centro',
  status: 'AGUARDANDO_MOTORISTA',
};

describe('DeliveryDetailsScreen', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      session: { accessToken: 'token-1', user: { id: 7, nome: 'Motorista', email: 'm@test.com', tipoUsuario: 'MOTORISTA' } },
    });
    mockStartDelivery.mockReset();
    mockOpenDeliveryAddressInMaps.mockReset();
    mockGetCurrentCoordinates.mockReset();
  });

  it('starts the delivery with GPS and opens the address in the external maps app', async () => {
    mockGetCurrentCoordinates.mockResolvedValueOnce({ latitude: -23.5505, longitude: -46.6333 });
    mockStartDelivery.mockResolvedValueOnce({
      ...deliveryFixture,
      status: 'EM_ROTA',
    });

    render(
      <AppThemeProvider>
        <DeliveryDetailsScreen route={{ key: 'DeliveryDetails-1', name: 'DeliveryDetails', params: { delivery: deliveryFixture } }} />
      </AppThemeProvider>,
    );

    expect(screen.getByText('Missao operacional')).toBeOnTheScreen();
    expect(screen.getByText('Aguardando despacho')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Iniciar entrega' }));

    await waitFor(() => {
      expect(mockStartDelivery).toHaveBeenCalledWith(1, 'token-1', {
        latitudeInicio: -23.5505,
        longitudeInicio: -46.6333,
      });
    });

    await waitFor(() => {
      expect(mockOpenDeliveryAddressInMaps).toHaveBeenCalledWith('Rua A, 100 - Centro');
    });

    expect(await screen.findByText('Em rota')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Iniciar entrega' })).not.toBeOnTheScreen();
  });

  it('does not start the delivery when the start GPS is unavailable', async () => {
    mockGetCurrentCoordinates.mockResolvedValueOnce(null);

    render(
      <AppThemeProvider>
        <DeliveryDetailsScreen route={{ key: 'DeliveryDetails-1', name: 'DeliveryDetails', params: { delivery: deliveryFixture } }} />
      </AppThemeProvider>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Iniciar entrega' }));

    expect(await screen.findByText('Nao foi possivel capturar a localizacao de inicio da entrega.')).toBeOnTheScreen();
    expect(mockStartDelivery).not.toHaveBeenCalled();
    expect(mockOpenDeliveryAddressInMaps).not.toHaveBeenCalled();
  });

  it('renders the delivery cargo details', () => {
    render(
      <AppThemeProvider>
        <DeliveryDetailsScreen
          route={{
            key: 'DeliveryDetails-1',
            name: 'DeliveryDetails',
            params: {
              delivery: {
                ...deliveryFixture,
                details: [
                  {
                    id: 10,
                    entregaId: 1,
                    descricao: 'Caixa de documentos',
                    categoria: 'Documentos',
                    pesoKg: '1.250',
                    volumeM3: '0.0150',
                    quantidade: 1,
                    valorDeclarado: '250.00',
                  },
                ],
              },
            },
          }}
        />
      </AppThemeProvider>,
    );

    expect(screen.getByText('Detalhes da carga')).toBeOnTheScreen();
    expect(screen.getByText('Caixa de documentos')).toBeOnTheScreen();
    expect(screen.getByText('Documentos')).toBeOnTheScreen();
  });
});
