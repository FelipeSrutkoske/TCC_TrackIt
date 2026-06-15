import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DeliveryDetailsScreen } from '../screens/DeliveryDetailsScreen';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { Delivery } from '../types/delivery';

const mockUseAuth = jest.fn();
const mockStartDelivery = jest.fn();
const mockOpenDeliveryDirectionsInMaps = jest.fn();
const mockGetCurrentCoordinates = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../services/deliveries.service', () => ({
  startDelivery: (...args: unknown[]) => mockStartDelivery(...args),
}));

jest.mock('../utils/maps', () => ({
  openDeliveryDirectionsInMaps: (...args: unknown[]) => mockOpenDeliveryDirectionsInMaps(...args),
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
    mockOpenDeliveryDirectionsInMaps.mockReset();
    mockGetCurrentCoordinates.mockReset();
  });

  it('does not request GPS automatically when rendering the route preview', () => {
    render(
      <AppThemeProvider>
        <DeliveryDetailsScreen
          route={{
            key: 'DeliveryDetails-1',
            name: 'DeliveryDetails',
            params: {
              delivery: {
                ...deliveryFixture,
                latitudeDestino: '-24.053378',
                longitudeDestino: '-52.376477',
              },
            },
          }}
        />
      </AppThemeProvider>,
    );

    expect(mockGetCurrentCoordinates).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Calcular rota' })).toBeOnTheScreen();
  });

  it('starts the delivery with GPS without opening maps from the main button', async () => {
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
    expect(screen.getByText('Painel da entrega')).toBeOnTheScreen();
    expect(screen.getByText('Contexto operacional')).toBeOnTheScreen();
    expect(screen.getByText('Aguardando despacho')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Iniciar entrega' }));

    await waitFor(() => {
      expect(mockStartDelivery).toHaveBeenCalledWith(1, 'token-1', {
        latitudeInicio: -23.5505,
        longitudeInicio: -46.6333,
      });
    });

    expect(await screen.findByText('Em rota')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Iniciar entrega' })).not.toBeOnTheScreen();
    expect(mockOpenDeliveryDirectionsInMaps).not.toHaveBeenCalled();
  });

  it('starts the delivery and opens directions from the map button using destination coordinates', async () => {
    mockGetCurrentCoordinates.mockResolvedValueOnce({ latitude: -23.5505, longitude: -46.6333 });
    mockStartDelivery.mockResolvedValueOnce({
      ...deliveryFixture,
      latitudeDestino: '-24.053378',
      longitudeDestino: '-52.376477',
      status: 'EM_ROTA',
    });

    render(
      <AppThemeProvider>
        <DeliveryDetailsScreen route={{ key: 'DeliveryDetails-1', name: 'DeliveryDetails', params: { delivery: deliveryFixture } }} />
      </AppThemeProvider>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Iniciar entrega e abrir mapa' }));

    await waitFor(() => {
      expect(mockOpenDeliveryDirectionsInMaps).toHaveBeenCalledWith({
        latitude: -24.053378,
        longitude: -52.376477,
      });
    });
  });

  it('starts the delivery and opens directions using address when destination coordinates are unavailable', async () => {
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

    fireEvent.press(screen.getByRole('button', { name: 'Iniciar entrega e abrir mapa' }));

    await waitFor(() => {
      expect(mockOpenDeliveryDirectionsInMaps).toHaveBeenCalledWith('Rua A, 100 - Centro');
    });
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
    expect(mockOpenDeliveryDirectionsInMaps).not.toHaveBeenCalled();
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
                driver: {
                  id: 701,
                  userId: 7,
                  user: { id: 7, nome: 'Joao Motorista' },
                },
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
    expect(screen.getByText('Ordem de servico')).toBeOnTheScreen();
    expect(screen.getByText('Joao Motorista')).toBeOnTheScreen();
    expect(screen.queryByText('#701')).toBeNull();
    expect(screen.getByText('Caixa de documentos')).toBeOnTheScreen();
    expect(screen.getByText('Documentos')).toBeOnTheScreen();
    expect(screen.getByText('Quantidade: 1')).toBeOnTheScreen();
    expect(screen.getByText('Peso: 1,25 kg')).toBeOnTheScreen();
    expect(screen.getByText('Volume: 0,02 m3')).toBeOnTheScreen();
  });
});
