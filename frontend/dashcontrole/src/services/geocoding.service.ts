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

  if (!trimmedAddress) {
    return null;
  }

  if (!apiKey) {
    throw new Error('Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para gerar as coordenadas do destino.');
  }

  const params = new URLSearchParams({
    address: trimmedAddress,
    key: apiKey,
  });
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Nao foi possivel consultar o Google Geocoding para gerar as coordenadas do destino.');
  }

  const data = (await response.json()) as GoogleGeocodingResponse;
  const firstResult = data.results?.[0];
  const latitude = firstResult?.geometry?.location?.lat;
  const longitude = firstResult?.geometry?.location?.lng;

  if (data.status !== 'OK' || typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Nao foi possivel gerar latitude e longitude para o endereco informado.');
  }

  return {
    latitude,
    longitude,
    formattedAddress: firstResult?.formatted_address ?? trimmedAddress,
  };
}
