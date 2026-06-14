import * as Location from 'expo-location';
import { getCurrentCoordinates } from '../utils/location';

const mockLocation = Location as jest.Mocked<typeof Location>;

describe('location util', () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted',
    } as Location.LocationPermissionResponse);
    mockLocation.getLastKnownPositionAsync.mockResolvedValue(null);
    mockLocation.getCurrentPositionAsync.mockResolvedValue({
      coords: {
        latitude: -23.5505,
        longitude: -46.6333,
        accuracy: 18,
      },
    } as Location.LocationObject);
  });

  it('returns null when permission is denied', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    } as Location.LocationPermissionResponse);

    await expect(getCurrentCoordinates()).resolves.toBeNull();
    expect(mockLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('uses recent last known coordinates without waiting for a fresh GPS fix', async () => {
    mockLocation.getLastKnownPositionAsync.mockResolvedValueOnce({
      coords: {
        latitude: -23.5,
        longitude: -46.6,
        accuracy: 30,
      },
      timestamp: Date.now() - 30_000,
    } as Location.LocationObject);

    await expect(getCurrentCoordinates()).resolves.toEqual({
      latitude: -23.5,
      longitude: -46.6,
      accuracy: 30,
    });
    expect(mockLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('falls back to last known coordinates when fresh GPS times out', async () => {
    jest.useFakeTimers();
    mockLocation.getLastKnownPositionAsync.mockResolvedValue({
      coords: {
        latitude: -24.1,
        longitude: -52.3,
        accuracy: 70,
      },
      timestamp: Date.now() - 10 * 60_000,
    } as Location.LocationObject);
    mockLocation.getCurrentPositionAsync.mockImplementationOnce(
      () => new Promise(() => undefined),
    );

    const result = getCurrentCoordinates({ timeoutMs: 1_000 });
    await jest.advanceTimersByTimeAsync(1_000);

    await expect(result).resolves.toEqual({
      latitude: -24.1,
      longitude: -52.3,
      accuracy: 70,
    });
  });
});
