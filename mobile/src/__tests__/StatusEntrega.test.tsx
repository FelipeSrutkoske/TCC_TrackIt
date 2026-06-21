import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatusBadge } from '../components/StatusBadge';
import { AppThemeProvider } from '../theme/AppThemeProvider';

describe('Status da entrega', () => {
  it('mostra os status principais em portugues', () => {
    render(
      <AppThemeProvider>
        <>
          <StatusBadge status="AGUARDANDO_MOTORISTA" />
          <StatusBadge status="EM_ROTA" />
          <StatusBadge status="ENTREGUE" />
        </>
      </AppThemeProvider>,
    );

    expect(screen.getByText('Pendente')).toBeOnTheScreen();
    expect(screen.getByText('Em rota')).toBeOnTheScreen();
    expect(screen.getByText('Entregue')).toBeOnTheScreen();
    expect(screen.queryByText('AGUARDANDO_MOTORISTA')).toBeNull();
    expect(screen.queryByText('EM_ROTA')).toBeNull();
  });
});
