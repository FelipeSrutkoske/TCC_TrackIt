import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DeliveryCard } from '../components/DeliveryCard';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { Delivery } from '../types/delivery';

describe('DeliveryCard', () => {
  it('shows the client company and delivery creation date instead of the delivery code as title', () => {
    const delivery: Delivery = {
      id: 5,
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

    render(
      <AppThemeProvider>
        <DeliveryCard delivery={delivery} onPressDetails={jest.fn()} />
      </AppThemeProvider>,
    );

    expect(screen.getByText('ACME Transportes LTDA')).toBeOnTheScreen();
    expect(screen.getByText('Criada em')).toBeOnTheScreen();
    expect(screen.queryByText('Entrega #5')).toBeNull();
  });

  it('shows queue position when provided by current deliveries screen', () => {
    const delivery: Delivery = {
      id: 5,
      driverId: 701,
      createdAt: '2026-05-24T10:00:00.000Z',
      destinationAddress: 'Rua B, 200 - Centro',
      status: 'EM_ROTA',
    };

    render(
      <AppThemeProvider>
        <DeliveryCard
          delivery={delivery}
          onPressDetails={jest.fn()}
          position={1}
          totalInQueue={3}
        />
      </AppThemeProvider>,
    );

    expect(screen.getByText('01')).toBeOnTheScreen();
    expect(screen.getByText('Posicao 1 de 3 na fila')).toBeOnTheScreen();
  });

  it('uses the company delivery sequence as the public delivery code', () => {
    const delivery: Delivery = {
      id: 31,
      companySequence: 1,
      driverId: 701,
      createdAt: '2026-05-24T10:00:00.000Z',
      destinationAddress: 'Rua B, 200 - Centro',
      status: 'AGUARDANDO_MOTORISTA',
    };

    render(
      <AppThemeProvider>
        <DeliveryCard delivery={delivery} onPressDetails={jest.fn()} />
      </AppThemeProvider>,
    );

    expect(screen.getByText('Entrega #1')).toBeOnTheScreen();
    expect(screen.queryByText('Entrega #31')).toBeNull();
  });
});
