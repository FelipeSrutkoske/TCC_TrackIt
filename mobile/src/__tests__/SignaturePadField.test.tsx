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
  it('accumulates back-to-back drag points in the emitted signature payload', () => {
    const handleChange = jest.fn();

    render(
      <AppThemeProvider>
        <SignaturePadField label="Assinatura" onChange={handleChange} value={null} />
      </AppThemeProvider>,
    );

    const pad = screen.getByTestId('signature-pad');

    act(() => {
      fireEvent(pad, 'touchMove', { nativeEvent: { locationX: 10, locationY: 20 } });
      fireEvent(pad, 'touchMove', { nativeEvent: { locationX: 30, locationY: 40 } });
    });

    const payload = decodeSignature(handleChange.mock.calls.at(-1)?.[0] ?? null);

    expect(handleChange).toHaveBeenCalled();
    expect(payload).toContain('10,20');
    expect(payload).toContain('30,40');
  });
});
