import { Linking, Platform } from 'react-native';
import { buildDeliveryMapUrl, openDeliveryAddressInMaps } from '../utils/maps';

describe('maps util', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds a geo query URL for the delivery address', () => {
    jest.spyOn(Platform, 'select').mockImplementation((options) => options?.android as string);

    expect(buildDeliveryMapUrl('Rua A, 100 - Centro')).toBe(
      'geo:0,0?q=Rua%20A%2C%20100%20-%20Centro',
    );
  });

  it('builds an Apple Maps URL when running on iOS', () => {
    jest.spyOn(Platform, 'select').mockImplementation((options) => options?.ios as string);

    expect(buildDeliveryMapUrl('Rua A, 100 - Centro')).toBe(
      'http://maps.apple.com/?q=Rua%20A%2C%20100%20-%20Centro',
    );
  });

  it('opens the encoded delivery address in the external maps app', async () => {
    jest.spyOn(Platform, 'select').mockImplementation((options) => options?.android as string);
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(true);

    await openDeliveryAddressInMaps('Rua A, 100 - Centro');

    expect(openURLSpy).toHaveBeenCalledWith('geo:0,0?q=Rua%20A%2C%20100%20-%20Centro');
  });
});
