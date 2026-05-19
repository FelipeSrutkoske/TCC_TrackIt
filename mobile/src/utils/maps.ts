import { Linking, Platform } from 'react-native';

export function buildDeliveryMapUrl(address: string) {
  const encodedAddress = encodeURIComponent(address);

  return Platform.select({
    ios: `http://maps.apple.com/?q=${encodedAddress}`,
    android: `geo:0,0?q=${encodedAddress}`,
    default: `geo:0,0?q=${encodedAddress}`,
  });
}

export async function openDeliveryAddressInMaps(address: string) {
  await Linking.openURL(buildDeliveryMapUrl(address));
}
