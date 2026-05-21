import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SignaturePadField } from '../components/SignaturePadField';
import { AppThemeProvider } from '../theme/AppThemeProvider';

function decodeSignature(value: string | null) {
  if (!value) {
    return '';
  }

  return value;
}

describe('SignaturePadField', () => {
  it('emits signature payload when the user finishes a stroke', () => {
    const handleChange = jest.fn();

    render(
      <AppThemeProvider>
        <SignaturePadField label="Assinatura" onChange={handleChange} value={null} />
      </AppThemeProvider>,
    );

    const pad = screen.getByTestId('signature-pad');

    act(() => {
      fireEvent(pad, 'touchStart', { nativeEvent: { locationX: 10, locationY: 20 } });
      fireEvent(pad, 'touchMove', { nativeEvent: { locationX: 30, locationY: 40 } });
      fireEvent(pad, 'touchEnd');
    });

    const payload = decodeSignature(handleChange.mock.calls.at(-1)?.[0] ?? null);

    expect(handleChange).toHaveBeenCalled();
    expect(payload).toContain('10,20');
    expect(payload).toContain('30,40');
  });

  it('does not trigger react render-loop warnings when notifying parent state', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    function Wrapper() {
      const [value, setValue] = React.useState<string | null>(null);

      return <SignaturePadField label="Assinatura" onChange={setValue} value={value} />;
    }

    render(
      <AppThemeProvider>
        <Wrapper />
      </AppThemeProvider>,
    );

    const pad = screen.getByTestId('signature-pad');

    act(() => {
      fireEvent(pad, 'touchStart', { nativeEvent: { locationX: 14, locationY: 18 } });
      fireEvent(pad, 'touchMove', { nativeEvent: { locationX: 28, locationY: 32 } });
      fireEvent(pad, 'touchEnd');
    });

    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Cannot update a component'),
    );
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Maximum update depth exceeded'),
    );

    consoleErrorSpy.mockRestore();
  });
});
