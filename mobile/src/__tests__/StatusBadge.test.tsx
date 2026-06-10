import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { StatusBadge } from '../components/StatusBadge';

describe('StatusBadge', () => {
  it('uses the requested accent colors for route delivered and canceled statuses', () => {
    render(
      <AppThemeProvider>
        <>
          <StatusBadge status="EM_ROTA" />
          <StatusBadge status="ENTREGUE" />
          <StatusBadge status="CANCELADO" />
        </>
      </AppThemeProvider>,
    );

    expect(screen.getByText('Em rota')).toHaveStyle({ color: '#F4F7FB' });
    expect(screen.getByText('Entregue')).toHaveStyle({ color: '#F4FFF7' });
    expect(screen.getByText('Cancelado')).toHaveStyle({ color: '#FFF5F5' });
  });

  it('shows pending label for deliveries waiting for driver action', () => {
    render(
      <AppThemeProvider>
        <StatusBadge status="AGUARDANDO_MOTORISTA" />
      </AppThemeProvider>,
    );

    expect(screen.getByText('Pendente')).toBeOnTheScreen();
    expect(screen.queryByText('Aguardando motorista')).toBeNull();
  });
});
