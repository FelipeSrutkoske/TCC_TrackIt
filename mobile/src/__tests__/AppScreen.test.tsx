import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationContext } from '@react-navigation/native';
import { AppScreen } from '../components/AppScreen';
import { AppThemeProvider } from '../theme/AppThemeProvider';

const mockCanGoBack = jest.fn();
const mockGoBack = jest.fn();

describe('AppScreen', () => {
  beforeEach(() => {
    mockCanGoBack.mockReset();
    mockGoBack.mockReset();
  });

  it('shows a discreet back arrow when the navigation stack can go back', () => {
    mockCanGoBack.mockReturnValue(true);

    render(
      <AppThemeProvider>
        <NavigationContext.Provider
          value={{ canGoBack: mockCanGoBack, goBack: mockGoBack } as any}
        >
          <AppScreen>
            <></>
          </AppScreen>
        </NavigationContext.Provider>
      </AppThemeProvider>,
    );

    expect(screen.getByText('TrackIt')).toBeOnTheScreen();

    const backButton = screen.getByLabelText('Voltar para a tela anterior');

    expect(screen.getByTestId('square-arrow-left-icon')).toBeOnTheScreen();

    fireEvent.press(backButton);

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('does not show the back arrow on the first screen of the stack', () => {
    mockCanGoBack.mockReturnValue(false);

    render(
      <AppThemeProvider>
        <NavigationContext.Provider
          value={{ canGoBack: mockCanGoBack, goBack: mockGoBack } as any}
        >
          <AppScreen>
            <></>
          </AppScreen>
        </NavigationContext.Provider>
      </AppThemeProvider>,
    );

    expect(screen.queryByLabelText('Voltar para a tela anterior')).toBeNull();
    expect(screen.getByText('TrackIt')).toBeOnTheScreen();
  });

  it('renders content below a compact fixed app header', () => {
    mockCanGoBack.mockReturnValue(true);

    render(
      <AppThemeProvider>
        <NavigationContext.Provider
          value={{ canGoBack: mockCanGoBack, goBack: mockGoBack } as any}
        >
          <AppScreen>
            <></>
          </AppScreen>
        </NavigationContext.Provider>
      </AppThemeProvider>,
    );

    expect(screen.getByTestId('app-top-bar')).toBeOnTheScreen();
    expect(screen.getByTestId('app-screen-body')).toBeOnTheScreen();
  });

  it('renders and triggers header actions on the right side', () => {
    mockCanGoBack.mockReturnValue(false);
    const onRefresh = jest.fn();
    const onHome = jest.fn();

    render(
      <AppThemeProvider>
        <NavigationContext.Provider
          value={{ canGoBack: mockCanGoBack, goBack: mockGoBack } as any}
        >
          <AppScreen
            rightActions={[
              { accessibilityLabel: 'Atualizar dados', icon: 'refresh', onPress: onRefresh },
              { accessibilityLabel: 'Ir para inicio', icon: 'home', onPress: onHome },
            ]}
          >
            <></>
          </AppScreen>
        </NavigationContext.Provider>
      </AppThemeProvider>,
    );

    fireEvent.press(screen.getByLabelText('Atualizar dados'));
    fireEvent.press(screen.getByLabelText('Ir para inicio'));

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onHome).toHaveBeenCalledTimes(1);
  });
});
