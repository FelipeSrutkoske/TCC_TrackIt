import * as Location from 'expo-location';

export type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

type GetCurrentCoordinatesOptions = {
  timeoutMs?: number;
  recentLastKnownMaxAgeMs?: number;
  fallbackLastKnownMaxAgeMs?: number;
};

const DEFAULT_TIMEOUT_MS = 5_000;
const RECENT_LAST_KNOWN_MAX_AGE_MS = 2 * 60_000;
const FALLBACK_LAST_KNOWN_MAX_AGE_MS = 15 * 60_000;

export async function getCurrentCoordinates(
  options: GetCurrentCoordinatesOptions = {},
): Promise<Coordinates | null> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    return null;
  }

  const recentLastKnownMaxAgeMs =
    options.recentLastKnownMaxAgeMs ?? RECENT_LAST_KNOWN_MAX_AGE_MS;
  const fallbackLastKnownMaxAgeMs =
    options.fallbackLastKnownMaxAgeMs ?? FALLBACK_LAST_KNOWN_MAX_AGE_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: fallbackLastKnownMaxAgeMs,
  });

  if (isPositionFresh(lastKnown, recentLastKnownMaxAgeMs)) {
    return toCoordinates(lastKnown);
  }

  const position = await withTimeout(
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
    timeoutMs,
  );

  if (!position) {
    return lastKnown ? toCoordinates(lastKnown) : null;
  }

  return toCoordinates(position);
}

function toCoordinates(position: Location.LocationObject): Coordinates {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
}

function isPositionFresh(
  position: Location.LocationObject | null,
  maxAgeMs: number,
): position is Location.LocationObject {
  if (!position) {
    return false;
  }

  return Date.now() - position.timestamp <= maxAgeMs;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
    );
  });
}
