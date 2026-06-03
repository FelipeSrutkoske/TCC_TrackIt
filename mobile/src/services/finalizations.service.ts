import { apiRequest } from '../lib/api';

export type DeliveryFinalizationPayload = {
  deliveryId: number;
  receiverName: string;
  receiverDocument?: string;
  receiverRelation?: string;
  signature: string;
  latitude: number;
  longitude: number;
  gpsAccuracyMeters?: number | null;
  photoUrl?: string;
};

export type DeliveryFinalizationResponse = {
  id: number;
  deliveryId: number;
  receiverName: string;
  signatureUrl: string;
  photoUrl?: string | null;
  latitude: number;
  longitude: number;
  gpsAccuracyMeters?: number | string | null;
  distanciaDestinoMetros?: number | string | null;
  gpsValidado?: boolean;
  gpsDivergente?: boolean;
  finalizedAt: string;
};

export async function finalizeDelivery(
  payload: DeliveryFinalizationPayload,
  token: string,
): Promise<DeliveryFinalizationResponse> {
  return apiRequest<DeliveryFinalizationResponse>('/finalizations', {
    method: 'POST',
    token,
    body: payload,
  });
}
