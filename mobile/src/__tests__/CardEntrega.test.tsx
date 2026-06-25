import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DeliveryCard } from '../components/DeliveryCard';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { Delivery } from '../types/delivery';

describe('Card da entrega', () => {
  it('mostra codigo publico, fila, destino, data e acao', () => {
    const delivery: Delivery = {
      id: 31,
      companySequence: 1,
      driverId: 701,
      destinationAddress: 'Rua A, 100 - Centro',
      status: 'AGUARDANDO_MOTORISTA',
      createdAt: '2026-06-18T12:30:00',
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

    expect(screen.getByText('Entrega #1')).toBeOnTheScreen();
    expect(screen.queryByText('Entrega #31')).toBeNull();
    expect(screen.getByText('Posicao 1 de 3 na fila')).toBeOnTheScreen();
    expect(screen.getByText('Pendente')).toBeOnTheScreen();
    expect(screen.getByText('Destino')).toBeOnTheScreen();
    expect(screen.getByText('Rua A, 100 - Centro')).toBeOnTheScreen();
    expect(screen.getByText('Criada em')).toBeOnTheScreen();
    expect(screen.getByText(/18\/06\/2026/)).toBeOnTheScreen();
    expect(screen.getByText('Detalhes')).toBeOnTheScreen();
  });
});
