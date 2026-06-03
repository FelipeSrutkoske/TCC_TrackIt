export function calculateDistanceMeters(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLatitude = toRadians(destination.latitude - origin.latitude);
  const deltaLongitude = toRadians(destination.longitude - origin.longitude);
  const latitude1 = toRadians(origin.latitude);
  const latitude2 = toRadians(destination.latitude);
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2;

  return Math.round(
    earthRadiusMeters *
      2 *
      Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)),
  );
}

export function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${meters} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}
