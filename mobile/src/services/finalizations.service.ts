import { apiRequest } from '../lib/api';

export type DeliveryFinalizationPayload = {
  deliveryId: number;
  receiverName: string;
  signature: string;
  latitude: number;
  longitude: number;
};

export type DeliveryFinalizationResponse = {
  id: number;
  deliveryId: number;
  receiverName: string;
  signatureUrl: string;
  latitude: number;
  longitude: number;
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
