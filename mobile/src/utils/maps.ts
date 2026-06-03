import { Linking, Platform } from 'react-native';

export function buildDeliveryMapUrl(address: string) {
  const encodedAddress = encodeURIComponent(address);

  return Platform.select({
    ios: `http://maps.apple.com/?q=${encodedAddress}`,
    android: `geo:0,0?q=${encodedAddress}`,
    default: `geo:0,0?q=${encodedAddress}`,
  });
}

export function buildDeliveryDirectionsUrl(
  destination: { latitude: number; longitude: number } | string,
) {
  if (typeof destination === 'string') {
    return buildDeliveryMapUrl(destination);
  }

  const destinationParam = `${destination.latitude},${destination.longitude}`;

  return Platform.select({
    ios: `http://maps.apple.com/?daddr=${destinationParam}`,
    android: `google.navigation:q=${destinationParam}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`,
  });
}

export async function openDeliveryAddressInMaps(address: string) {
  await Linking.openURL(buildDeliveryMapUrl(address));
}

export async function openDeliveryDirectionsInMaps(
  destination: { latitude: number; longitude: number } | string,
) {
  const url = buildDeliveryDirectionsUrl(destination);

  if (url) {
    await Linking.openURL(url);
  }
}
