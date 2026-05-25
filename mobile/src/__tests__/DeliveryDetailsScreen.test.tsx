import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DeliveryDetailsScreen } from '../screens/DeliveryDetailsScreen';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { Delivery } from '../types/delivery';

const mockUseAuth = jest.fn();
const mockStartDelivery = jest.fn();
const mockOpenDeliveryAddressInMaps = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../services/deliveries.service', () => ({
  startDelivery: (...args: unknown[]) => mockStartDelivery(...args),
}));

jest.mock('../utils/maps', () => ({
  openDeliveryAddressInMaps: (...args: unknown[]) => mockOpenDeliveryAddressInMaps(...args),
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
  });

  it('starts the delivery and opens the address in the external maps app', async () => {
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
      expect(mockStartDelivery).toHaveBeenCalledWith(1, 'token-1');
    });

    await waitFor(() => {
      expect(mockOpenDeliveryAddressInMaps).toHaveBeenCalledWith('Rua A, 100 - Centro');
    });

    expect(await screen.findByText('Em rota')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Iniciar entrega' })).not.toBeOnTheScreen();
  });
});
