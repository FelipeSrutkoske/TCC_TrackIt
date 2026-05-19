import * as Location from 'expo-location';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export async function getCurrentCoordinates(): Promise<Coordinates | null> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    return null;
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
