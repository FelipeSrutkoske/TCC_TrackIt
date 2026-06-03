export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface GoogleGeocodingResponse {
  status: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  }>;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const trimmedAddress = address.trim();

  if (!apiKey || !trimmedAddress) {
    return null;
  }

  const params = new URLSearchParams({
    address: trimmedAddress,
    key: apiKey,
  });
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as GoogleGeocodingResponse;
  const firstResult = data.results?.[0];
  const latitude = firstResult?.geometry?.location?.lat;
  const longitude = firstResult?.geometry?.location?.lng;

  if (data.status !== 'OK' || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }

  return {
    latitude,
    longitude,
    formattedAddress: firstResult?.formatted_address ?? trimmedAddress,
  };
}
